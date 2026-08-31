import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getProductBySlug } from "@/lib/catalog.functions";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { track, toBRL } from "@/lib/analytics";

const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!product) throw notFound();
    return { name: product.name, description: product.description, image: product.image_url };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Produto indisponível — Koodari Lab" }, { name: "robots", content: "noindex" }],
      };
    }
    return {
      meta: [
        { title: `${loaderData.name} — Koodari Lab` },
        { name: "description", content: loaderData.description.slice(0, 155) },
        { property: "og:title", content: `${loaderData.name} — Koodari Lab` },
        { property: "og:description", content: loaderData.description.slice(0, 155) },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-display text-2xl">Peça não encontrada</h1>
      <Link to="/loja" className="mt-6 inline-block text-sm text-muted-foreground underline">
        Voltar para a loja
      </Link>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    track("product_viewed", {
      slug: product.slug,
      name: product.name,
      price: toBRL(product.price_cents),
    });
  }, [product]);

  if (!product) return null;

  const variant = product.variants.find((v) => v.id === variantId) ?? null;

  function handleAdd() {
    if (!product || !variant) {
      toast.error("Escolha um tamanho.");
      return;
    }
    addItem({
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      size: variant.size,
      color: variant.color,
      priceCents: product.price_cents,
      imageUrl: product.image_url,
      quantity: 1,
    });
    track("add_to_cart", {
      variant_id: variant.id,
      slug: product.slug,
      name: product.name,
      size: variant.size,
      color: variant.color,
      quantity: 1,
      price: toBRL(product.price_cents),
    });
    toast.success(`${product.name} (${variant.size}) adicionada ao carrinho`);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-16 md:grid-cols-2">
      <div className="bg-muted overflow-hidden rounded-sm">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            width={1024}
            height={1280}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="md:py-6">
        <h1 className="font-display text-3xl">{product.name}</h1>
        <p className="mt-3 text-lg">{formatBRL(product.price_cents)}</p>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

        <div className="mt-10">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Tamanho</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.variants
              .slice()
              .sort((a, b) => a.size.localeCompare(b.size))
              .map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={v.stock <= 0}
                  onClick={() => setVariantId(v.id)}
                  className={cn(
                    "h-10 min-w-12 rounded-sm border px-3 text-sm transition-colors",
                    v.id === variantId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent",
                    v.stock <= 0 && "cursor-not-allowed opacity-40 line-through",
                  )}
                >
                  {v.size}
                </button>
              ))}
          </div>
          {variant ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Cor {variant.color} · {variant.stock} em estoque
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="mt-10 h-12 w-full rounded-sm bg-primary text-sm text-primary-foreground transition-opacity hover:opacity-90"
        >
          Adicionar ao carrinho
        </button>

        <div className="mt-10 border-t border-border pt-6">
          <h2 className="font-display text-sm">Tecido</h2>
          <p className="mt-2 text-sm text-muted-foreground">{product.fabric_description}</p>
        </div>
      </div>
    </div>
  );
}
