import { Link } from "@tanstack/react-router";
import type { CatalogProduct } from "@/lib/catalog.functions";
import { formatBRL } from "@/lib/format";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const soldOut = product.variants.every((v) => v.stock <= 0);

  return (
    <Link to="/produto/$slug" params={{ slug: product.slug }} className="group block">
      <div className="bg-muted aspect-4/5 overflow-hidden rounded-sm">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            width={1024}
            height={1280}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-sm">{product.name}</h3>
        <span className="text-sm text-muted-foreground">{formatBRL(product.price_cents)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {soldOut ? "Esgotado" : product.variants.map((v) => v.size).join(" · ")}
      </p>
    </Link>
  );
}
