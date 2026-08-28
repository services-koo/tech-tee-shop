import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const eventSchema = z.object({
  event: z.string(),
  payment: z
    .object({
      id: z.string(),
      status: z.string(),
      externalReference: z.string().nullable().optional(),
    })
    .optional(),
});

const PAID = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];
const CANCELED = ["REFUNDED", "CHARGEBACK_REQUESTED", "PAYMENT_DELETED", "CANCELED"];

export const Route = createFileRoute("/api/public/asaas-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedToken = process.env["ASAAS_WEBHOOK_TOKEN"];
        if (!expectedToken) {
          console.error("ASAAS_WEBHOOK_TOKEN não configurado");
          return new Response("Webhook não configurado", { status: 500 });
        }

        const token = request.headers.get("asaas-access-token") ?? "";
        if (token.length !== expectedToken.length || token !== expectedToken) {
          return new Response("Token inválido", { status: 401 });
        }

        let parsed;
        try {
          parsed = eventSchema.parse(await request.json());
        } catch {
          return new Response("Payload inválido", { status: 400 });
        }

        const payment = parsed.payment;
        if (!payment) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const query = supabaseAdmin.from("orders").select("id, payment_status").limit(1);
        const { data: order } = payment.externalReference
          ? await query.eq("id", payment.externalReference).maybeSingle()
          : await query.eq("asaas_payment_id", payment.id).maybeSingle();

        if (!order) return new Response("ok");

        const paid = PAID.includes(payment.status);
        const canceled = CANCELED.includes(payment.status) || parsed.event === "PAYMENT_DELETED";

        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: payment.status,
            status: paid ? "paid" : canceled ? "canceled" : "pending",
          })
          .eq("id", order.id);

        if (paid) {
          await supabaseAdmin.rpc("apply_order_stock", { _order_id: order.id });
        }

        return new Response("ok");
      },
    },
  },
});
