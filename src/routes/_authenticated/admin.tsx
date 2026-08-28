import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAuth";
import { formatBRL, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel — Koodari Lab" },
      { name: "description", content: "Gestão de produtos, estoque, pedidos e frete." },
      { property: "og:title", content: "Painel — Koodari Lab" },
      { property: "og:description", content: "Painel administrativo da Koodari Lab." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "produtos" | "pedidos" | "frete";

function AdminPage() {
  const { isAdmin, loading } = useIsAdmin();
  const [tab, setTab] = useState<Tab>("produtos");

  if (loading) {
    return <p className="mx-auto max-w-5xl px-6 py-20 text-sm text-muted-foreground">Carregando…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é exclusiva para administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-3xl">Painel</h1>

      <div className="mt-8 flex gap-2 border-b border-border">
        {(["produtos", "pedidos", "frete"] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm capitalize transition-colors",
              tab === value ? "border-primary" : "border-transparent text-muted-foreground",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === "produtos" ? <ProductsTab /> : null}
        {tab === "pedidos" ? <OrdersTab /> : null}
        {tab === "frete" ? <ShippingTab /> : null}
      </div>
    </div>
  );
}

function ProductsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price_cents, active, product_variants(id, size, color, stock)")
        .order("name");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  async function updateStock(variantId: string, stock: number) {
    const { error } = await supabase.from("product_variants").update({ stock }).eq("id", variantId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Estoque atualizado.");
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  async function updateProduct(id: string, patch: { price_cents?: number; active?: boolean }) {
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Produto atualizado.");
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-10">
      {data?.map((product) => (
        <section key={product.id} className="rounded-sm border border-border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-base">{product.name}</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Preço (centavos)
                <input
                  type="number"
                  defaultValue={product.price_cents}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (value !== product.price_cents) updateProduct(product.id, { price_cents: value });
                  }}
                  className="h-9 w-28 rounded-sm border border-border bg-card px-2 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => updateProduct(product.id, { active: !product.active })}
                className="h-9 rounded-sm border border-border px-3 text-xs transition-colors hover:bg-accent"
              >
                {product.active ? "Ativo" : "Inativo"}
              </button>
              <span className="text-xs text-muted-foreground">{formatBRL(product.price_cents)}</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {product.product_variants.map((variant) => (
              <label key={variant.id} className="flex items-center justify-between gap-3 rounded-sm border border-border px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  {variant.size} · {variant.color}
                </span>
                <input
                  type="number"
                  min={0}
                  defaultValue={variant.stock}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (value !== variant.stock) updateStock(variant.id, value);
                  }}
                  className="h-8 w-16 rounded-sm border border-border bg-card px-2 text-sm"
                />
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function OrdersTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, customer_name, status, payment_status, payment_method, total_cents")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Pedido atualizado.");
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <ul className="divide-y divide-border border-y border-border">
      {data?.map((order) => (
        <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-5 text-sm">
          <div>
            <p className="font-display">{order.customer_name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString("pt-BR")} ·{" "}
              {PAYMENT_STATUS_LABEL[order.payment_status] ?? order.payment_status}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span>{formatBRL(order.total_cents)}</span>
            <select
              value={order.status}
              onChange={(e) => setStatus(order.id, e.target.value)}
              className="h-9 rounded-sm border border-border bg-card px-2 text-sm"
            >
              {["pending", "paid", "shipped", "delivered", "canceled"].map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABEL[status] ?? status}
                </option>
              ))}
            </select>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ShippingTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-shipping"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_settings")
        .select("id, flat_rate_cents, free_above_cents")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  async function save(patch: { flat_rate_cents?: number; free_above_cents?: number }) {
    if (!data) return;
    const { error } = await supabase.from("shipping_settings").update(patch).eq("id", data.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Frete atualizado.");
    queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
    queryClient.invalidateQueries({ queryKey: ["shipping-settings"] });
  }

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="grid max-w-md gap-4">
      <label className="block text-sm">
        <span className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
          Frete fixo (centavos)
        </span>
        <input
          type="number"
          defaultValue={data.flat_rate_cents}
          onBlur={(e) => save({ flat_rate_cents: Number(e.target.value) })}
          className="mt-2 h-11 w-full rounded-sm border border-border bg-card px-3 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
          Frete grátis acima de (centavos)
        </span>
        <input
          type="number"
          defaultValue={data.free_above_cents}
          onBlur={(e) => save({ free_above_cents: Number(e.target.value) })}
          className="mt-2 h-11 w-full rounded-sm border border-border bg-card px-3 text-sm"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Atual: {formatBRL(data.flat_rate_cents)} · grátis acima de {formatBRL(data.free_above_cents)}
      </p>
    </div>
  );
}
