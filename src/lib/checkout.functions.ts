import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkoutSchema, type CheckoutInput } from "./checkout-schema";

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CheckoutInput) => checkoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ensureAsaasCustomer, createAsaasPayment, getAsaasPixQrCode } = await import(
      "./asaas.server"
    );

    const variantIds = data.items.map((i) => i.variantId);
    const { data: variants, error: variantError } = await supabaseAdmin
      .from("product_variants")
      .select("id, size, color, stock, product_id, products(id, name, price_cents, image_url, active)")
      .in("id", variantIds);

    if (variantError) throw new Error(variantError.message);
    if (!variants || variants.length !== variantIds.length) {
      throw new Error("Alguns itens do carrinho não estão mais disponíveis.");
    }

    const lines = data.items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const product = variant.products as unknown as {
        name: string;
        price_cents: number;
        image_url: string | null;
        active: boolean;
      };
      if (!product?.active) throw new Error(`Produto indisponível: ${product?.name ?? ""}`);
      if (variant.stock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${product.name} tamanho ${variant.size}.`);
      }
      return {
        variantId: variant.id,
        productName: product.name,
        size: variant.size,
        color: variant.color,
        imageUrl: product.image_url,
        unitPriceCents: product.price_cents,
        quantity: item.quantity,
      };
    });

    const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

    const { data: shipping } = await supabaseAdmin
      .from("shipping_settings")
      .select("flat_rate_cents, free_above_cents")
      .maybeSingle();

    const flatRate = shipping?.flat_rate_cents ?? 2490;
    const freeAbove = shipping?.free_above_cents ?? 29900;
    const shippingCents = subtotalCents >= freeAbove ? 0 : flatRate;
    const totalCents = subtotalCents + shippingCents;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: context.userId,
        payment_method: data.paymentMethod,
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        total_cents: totalCents,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_cpf_cnpj: data.customer.cpfCnpj,
        customer_phone: data.customer.phone ?? null,
        address_zip: data.address.zip,
        address_street: data.address.street,
        address_number: data.address.number,
        address_complement: data.address.complement ?? null,
        address_district: data.address.district,
        address_city: data.address.city,
        address_state: data.address.state,
      })
      .select("id")
      .single();

    if (orderError || !order) throw new Error(orderError?.message ?? "Não foi possível criar o pedido.");

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        variant_id: l.variantId,
        product_name: l.productName,
        size: l.size,
        color: l.color,
        image_url: l.imageUrl,
        unit_price_cents: l.unitPriceCents,
        quantity: l.quantity,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);

    try {
      const customerId = await ensureAsaasCustomer({
        name: data.customer.name,
        email: data.customer.email,
        cpfCnpj: data.customer.cpfCnpj,
        phone: data.customer.phone ?? null,
        postalCode: data.address.zip,
        address: data.address.street,
        addressNumber: data.address.number,
        province: data.address.district,
      });


      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (data.paymentMethod === "BOLETO" ? 3 : 1));
      const dueDateISO = dueDate.toISOString().slice(0, 10);

      const body: Record<string, unknown> = {
        customer: customerId,
        billingType: data.paymentMethod,
        value: Number((totalCents / 100).toFixed(2)),
        dueDate: dueDateISO,
        description: `Pedido Koodari Lab ${order.id.slice(0, 8)}`,
        externalReference: order.id,
      };

      if (data.paymentMethod === "CREDIT_CARD") {
        if (!data.creditCard) throw new Error("Dados do cartão não informados.");
        body["creditCard"] = {
          holderName: data.creditCard.holderName,
          number: data.creditCard.number,
          expiryMonth: data.creditCard.expiryMonth,
          expiryYear: data.creditCard.expiryYear,
          ccv: data.creditCard.ccv,
        };
        body["creditCardHolderInfo"] = {
          name: data.creditCard.holderName,
          email: data.customer.email,
          cpfCnpj: data.customer.cpfCnpj,
          postalCode: data.address.zip,
          addressNumber: data.address.number,
          addressComplement: data.address.complement ?? null,
          phone: data.customer.phone ?? undefined,
        };
      }

      const payment = await createAsaasPayment(body);

      let pixPayload: string | null = null;
      let pixQrBase64: string | null = null;
      if (data.paymentMethod === "PIX") {
        try {
          const qr = await getAsaasPixQrCode(payment.id);
          pixPayload = qr.payload ?? null;
          pixQrBase64 = qr.encodedImage ?? null;
        } catch (qrError) {
          // Conta Asaas sem chave Pix cadastrada: mantém o pedido válido e usa a fatura.
          console.error("Falha ao gerar QR Code Pix:", qrError);
        }
      }

      const paid = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(payment.status);

      await supabaseAdmin
        .from("orders")
        .update({
          asaas_customer_id: customerId,
          asaas_payment_id: payment.id,
          payment_status: payment.status,
          status: paid ? "paid" : "pending",
          pix_payload: pixPayload,
          pix_qr_base64: pixQrBase64,
          boleto_url: payment.bankSlipUrl ?? null,
          invoice_url: payment.invoiceUrl ?? null,
          due_date: payment.dueDate ?? dueDateISO,
        })
        .eq("id", order.id);

      if (paid) {
        await supabaseAdmin.rpc("apply_order_stock", { _order_id: order.id });
      }

      return { orderId: order.id as string };
    } catch (error) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "canceled", payment_status: "FAILED" })
        .eq("id", order.id);
      throw error instanceof Error ? error : new Error("Falha ao processar o pagamento.");
    }
  });

export const refreshOrderPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, asaas_payment_id, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!order?.asaas_payment_id) return { status: order?.payment_status ?? "PENDING" };

    const { getAsaasPayment } = await import("./asaas.server");
    const payment = await getAsaasPayment(order.asaas_payment_id);
    const paid = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(payment.status);

    if (payment.status !== order.payment_status) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: payment.status, status: paid ? "paid" : "pending" })
        .eq("id", order.id);
      if (paid) await supabaseAdmin.rpc("apply_order_stock", { _order_id: order.id });
    }

    return { status: payment.status };
  });
