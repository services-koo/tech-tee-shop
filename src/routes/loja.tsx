import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/loja")({
  head: () => ({
    meta: [
      { title: "Loja — Koodari Lab" },
      {
        name: "description",
        content:
          "Todas as camisetas em tecido tech da Koodari Lab: grade P ao GG, cores neutras e envio para todo o Brasil.",
      },
      { property: "og:title", content: "Loja — Koodari Lab" },
      {
        property: "og:description",
        content: "Camisetas em tecido tech, grade P ao GG, cores neutras.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Loja,
});

function Loja() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);

  const sizes = [...new Set(products.flatMap((p) => p.variants.map((v) => v.size)))];
  const colors = [...new Set(products.flatMap((p) => p.variants.map((v) => v.color)))];

  const filtered = products.filter((p) => {
    const matchesSize = !size || p.variants.some((v) => v.size === size && v.stock > 0);
    const matchesColor = !color || p.variants.some((v) => v.color === color);
    return matchesSize && matchesColor;
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-3xl">Coleção</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "peça" : "peças"} em tecido tech
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-8 border-y border-border py-4 text-sm">
        <FilterGroup label="Tamanho" options={sizes} value={size} onChange={setSize} />
        <FilterGroup label="Cor" options={colors} value={color} onChange={setColor} />
      </div>

      <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          Nenhuma peça encontrada com esses filtros.
        </p>
      ) : null}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(value === option ? null : option)}
          className={cn(
            "rounded-sm border px-3 py-1 text-xs transition-colors",
            value === option
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-accent",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
