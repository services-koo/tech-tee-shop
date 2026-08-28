import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Koodari Lab" },
      { name: "description", content: "Veja seus pedidos e acompanhe entregas e pagamentos." },
      { property: "og:title", content: "Minha conta — Koodari Lab" },
      { property: "og:description", content: "Seus pedidos na Koodari Lab." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status, payment_status, total_cents")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl">Minha conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
          className="text-sm text-muted-foreground underline"
        >
          Sair
        </button>
      </div>

      <h2 className="font-display mt-14 text-lg">Meus pedidos</h2>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>
      ) : !orders || orders.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Você ainda não tem pedidos.{" "}
          <Link to="/loja" className="underline">
            Ver coleção
          </Link>
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div>
                <Link
                  to="/pedido/$id"
                  params={{ id: order.id }}
                  className="font-display text-sm underline-offset-4 hover:underline"
                >
                  Pedido {order.id.slice(0, 8)}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("pt-BR")} ·{" "}
                  {ORDER_STATUS_LABEL[order.status] ?? order.status} ·{" "}
                  {PAYMENT_STATUS_LABEL[order.payment_status] ?? order.payment_status}
                </p>
              </div>
              <span className="text-sm">{formatBRL(order.total_cents)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
