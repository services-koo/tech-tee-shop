import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { refreshOrderPayment } from "@/lib/checkout.functions";
import { formatBRL, PAYMENT_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { track, toBRL } from "@/lib/analytics";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/_authenticated/pedido/$id")({
  head: () => ({
    meta: [
      { title: "Seu pedido — Koodari Lab" },
      { name: "description", content: "Acompanhe o pagamento e o status do seu pedido." },
      { property: "og:title", content: "Seu pedido — Koodari Lab" },
      { property: "og:description", content: "Acompanhe o status do seu pedido Koodari Lab." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const refresh = useServerFn(refreshOrderPayment);

  const orderQuery = useQuery({
    queryKey: ["order", id],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const order = orderQuery.data;
  const paidTracked = useRef(false);

  useEffect(() => {
    if (!order || paidTracked.current) return;
    const isPaid = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(order.payment_status);
    if (!isPaid) return;
    paidTracked.current = true;
    track("order_paid", {
      order_id: order.id,
      payment_method: order.payment_method,
      total: toBRL(order.total_cents),
    });
  }, [order]);

  async function handleRefresh() {
    try {
      await refresh({ data: { orderId: id } });
      await orderQuery.refetch();
      toast.success("Status atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o status.");
    }
  }

  if (orderQuery.isLoading) {
    return <p className="mx-auto max-w-3xl px-6 py-20 text-sm text-muted-foreground">Carregando…</p>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl">Pedido não encontrado</h1>
        <Link to="/conta" className="mt-6 inline-block text-sm underline">
          Ver meus pedidos
        </Link>
      </div>
    );
  }

  const paid = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(order.payment_status);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs tracking-[0.25em] text-muted-foreground uppercase">
        Pedido {order.id.slice(0, 8)}
      </p>
      <h1 className="font-display mt-3 text-3xl">
        {paid ? "Pagamento confirmado" : "Aguardando pagamento"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method} ·{" "}
        {PAYMENT_STATUS_LABEL[order.payment_status] ?? order.payment_status}
      </p>

      {!paid && order.payment_method === "PIX" && order.pix_payload ? (
        <div className="mt-10 rounded-sm border border-border p-6">
          <h2 className="font-display text-sm">Pague com Pix</h2>
          {order.pix_qr_base64 ? (
            <img
              src={`data:image/png;base64,${order.pix_qr_base64}`}
              alt="QR Code Pix"
              width={220}
              height={220}
              className="mt-4"
            />
          ) : null}
          <p className="mt-4 text-xs break-all text-muted-foreground">{order.pix_payload}</p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(order.pix_payload ?? "");
              toast.success("Código copiado.");
            }}
            className="mt-4 h-10 rounded-sm border border-border px-4 text-sm transition-colors hover:bg-accent"
          >
            Copiar código
          </button>
        </div>
      ) : null}

      {!paid && order.payment_method === "BOLETO" && order.boleto_url ? (
        <div className="mt-10 rounded-sm border border-border p-6">
          <h2 className="font-display text-sm">Boleto bancário</h2>
          <a
            href={order.boleto_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-10 items-center rounded-sm bg-primary px-5 text-sm text-primary-foreground"
          >
            Abrir boleto
          </a>
        </div>
      ) : null}

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="font-display text-sm">Itens</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                {item.product_name} · {item.size} × {item.quantity}
              </span>
              <span>{formatBRL(item.unit_price_cents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Frete</dt>
            <dd>{order.shipping_cents === 0 ? "Grátis" : formatBRL(order.shipping_cents)}</dd>
          </div>
          <div className="flex justify-between text-base">
            <dt>Total</dt>
            <dd>{formatBRL(order.total_cents)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleRefresh}
          className="h-11 rounded-sm border border-border px-6 text-sm transition-colors hover:bg-accent"
        >
          Atualizar status
        </button>
        <Link
          to="/conta"
          className="inline-flex h-11 items-center rounded-sm px-6 text-sm text-muted-foreground hover:text-foreground"
        >
          Meus pedidos
        </Link>
      </div>
    </div>
  );
}
