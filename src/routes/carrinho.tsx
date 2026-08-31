import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getShippingSettings } from "@/lib/catalog.functions";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { track, toBRL } from "@/lib/analytics";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Koodari Lab" },
      { name: "description", content: "Revise as peças escolhidas antes de finalizar a compra." },
      { property: "og:title", content: "Carrinho — Koodari Lab" },
      { property: "og:description", content: "Revise seu carrinho na Koodari Lab." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotalCents, setQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const { data: shipping } = useQuery({
    queryKey: ["shipping-settings"],
    queryFn: () => getShippingSettings(),
  });

  const flatRate = shipping?.flat_rate_cents ?? 2490;
  const freeAbove = shipping?.free_above_cents ?? 29900;
  const shippingCents = items.length === 0 || subtotalCents >= freeAbove ? 0 : flatRate;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-3xl">Carrinho</h1>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
          <Link to="/loja" className="mt-6 inline-block text-sm underline">
            Ver coleção
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={item.variantId} className="flex gap-5 py-6">
                <div className="bg-muted h-28 w-22 shrink-0 overflow-hidden rounded-sm">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      width={1024}
                      height={1280}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-display text-sm">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Tamanho {item.size} · {item.color}
                      </p>
                    </div>
                    <p className="text-sm">{formatBRL(item.priceCents * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-sm border border-border">
                      <button
                        type="button"
                        className="h-8 w-8 text-sm"
                        onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                        aria-label="Diminuir quantidade"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        className="h-8 w-8 text-sm"
                        onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                        aria-label="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline"
                      onClick={() => {
                        track("remove_from_cart", {
                          variant_id: item.variantId,
                          slug: item.slug,
                          name: item.name,
                          size: item.size,
                          quantity: item.quantity,
                          price: toBRL(item.priceCents),
                        });
                        removeItem(item.variantId);
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-sm border border-border p-6">
            <h2 className="font-display text-sm">Resumo</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatBRL(subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Frete</dt>
                <dd>{shippingCents === 0 ? "Grátis" : formatBRL(shippingCents)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt>Total</dt>
                <dd>{formatBRL(subtotalCents + shippingCents)}</dd>
              </div>
            </dl>
            {subtotalCents < freeAbove ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Frete grátis em compras acima de {formatBRL(freeAbove)}.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                track("checkout_started", {
                  items: items.length,
                  units: items.reduce((sum, i) => sum + i.quantity, 0),
                  subtotal: toBRL(subtotalCents),
                  shipping: toBRL(shippingCents),
                  total: toBRL(subtotalCents + shippingCents),
                });
                navigate({ to: "/checkout" });
              }}
              className="mt-6 h-11 w-full rounded-sm bg-primary text-sm text-primary-foreground transition-opacity hover:opacity-90"
            >
              Finalizar compra
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
