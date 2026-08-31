import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getShippingSettings } from "@/lib/catalog.functions";
import { createOrder } from "@/lib/checkout.functions";
import { useCart } from "@/lib/cart";
import { formatBRL, onlyDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { track, toBRL } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Koodari Lab" },
      { name: "description", content: "Finalize seu pedido com Pix, boleto ou cartão de crédito." },
      { property: "og:title", content: "Checkout — Koodari Lab" },
      { property: "og:description", content: "Finalize seu pedido na Koodari Lab." },
    ],
  }),
  component: CheckoutPage,
});

const METHODS = [
  { value: "PIX", label: "Pix" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CREDIT_CARD", label: "Cartão de crédito" },
] as const;

function CheckoutPage() {
  const { items, subtotalCents, clear } = useCart();
  const navigate = useNavigate();
  const submitOrder = useServerFn(createOrder);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("PIX");
  const [form, setForm] = useState({
    name: "",
    email: "",
    cpfCnpj: "",
    phone: "",
    zip: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    holderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
  });

  const { data: shipping } = useQuery({
    queryKey: ["shipping-settings"],
    queryFn: () => getShippingSettings(),
  });

  const flatRate = shipping?.flat_rate_cents ?? 2490;
  const freeAbove = shipping?.free_above_cents ?? 29900;
  const shippingCents = subtotalCents >= freeAbove ? 0 : flatRate;

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (items.length === 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }
    setLoading(true);
    try {
      const result = await submitOrder({
        data: {
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          paymentMethod: method,
          customer: {
            name: form.name,
            email: form.email,
            cpfCnpj: onlyDigits(form.cpfCnpj),
            phone: form.phone ? onlyDigits(form.phone) : undefined,
          },
          address: {
            zip: onlyDigits(form.zip),
            street: form.street,
            number: form.number,
            complement: form.complement || undefined,
            district: form.district,
            city: form.city,
            state: form.state.toUpperCase(),
          },
          creditCard:
            method === "CREDIT_CARD"
              ? {
                  holderName: form.holderName,
                  number: onlyDigits(form.cardNumber),
                  expiryMonth: form.expiryMonth,
                  expiryYear: form.expiryYear,
                  ccv: form.ccv,
                }
              : undefined,
        },
      });
      track("order_created", {
        order_id: result.orderId,
        payment_method: method,
        items: items.length,
        units: items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal: toBRL(subtotalCents),
        shipping: toBRL(shippingCents),
        total: toBRL(subtotalCents + shippingCents),
      });
      clear();
      navigate({ to: "/pedido/$id", params: { id: result.orderId } });
    } catch (error) {
      captureError(error, { step: "create_order", payment_method: method });
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir o pedido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-3xl">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-sm">Seus dados</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" value={form.name} onChange={(v) => set("name", v)} required />
              <Field label="E-mail" type="email" value={form.email} onChange={(v) => set("email", v)} required />
              <Field label="CPF/CNPJ" value={form.cpfCnpj} onChange={(v) => set("cpfCnpj", v)} required />
              <Field label="Telefone" value={form.phone} onChange={(v) => set("phone", v)} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-sm">Entrega</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="CEP" value={form.zip} onChange={(v) => set("zip", v)} required />
              <Field label="Rua" value={form.street} onChange={(v) => set("street", v)} required />
              <Field label="Número" value={form.number} onChange={(v) => set("number", v)} required />
              <Field label="Complemento" value={form.complement} onChange={(v) => set("complement", v)} />
              <Field label="Bairro" value={form.district} onChange={(v) => set("district", v)} required />
              <Field label="Cidade" value={form.city} onChange={(v) => set("city", v)} required />
              <Field label="UF" value={form.state} onChange={(v) => set("state", v)} required />
            </div>
          </section>

          <section>
            <h2 className="font-display text-sm">Pagamento</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    "h-10 rounded-sm border px-4 text-sm transition-colors",
                    method === m.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {method === "CREDIT_CARD" ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Nome no cartão" value={form.holderName} onChange={(v) => set("holderName", v)} required />
                <Field label="Número do cartão" value={form.cardNumber} onChange={(v) => set("cardNumber", v)} required />
                <Field label="Mês (MM)" value={form.expiryMonth} onChange={(v) => set("expiryMonth", v)} required />
                <Field label="Ano (AAAA)" value={form.expiryYear} onChange={(v) => set("expiryYear", v)} required />
                <Field label="CVV" value={form.ccv} onChange={(v) => set("ccv", v)} required />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                {method === "PIX"
                  ? "Você receberá o QR Code e o código copia-e-cola na próxima tela."
                  : "O boleto será gerado na próxima tela, com vencimento em 3 dias."}
              </p>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-sm border border-border p-6">
          <h2 className="font-display text-sm">Resumo</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.variantId} className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {item.name} · {item.size} × {item.quantity}
                </span>
                <span>{formatBRL(item.priceCents * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frete</dt>
              <dd>{shippingCents === 0 ? "Grátis" : formatBRL(shippingCents)}</dd>
            </div>
            <div className="flex justify-between text-base">
              <dt>Total</dt>
              <dd>{formatBRL(subtotalCents + shippingCents)}</dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="mt-6 h-11 w-full rounded-sm bg-primary text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Processando..." : "Confirmar pedido"}
          </button>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs tracking-[0.15em] text-muted-foreground uppercase">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-sm border border-border bg-card px-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
