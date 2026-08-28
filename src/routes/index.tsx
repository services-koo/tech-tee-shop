import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/product-card";

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Koodari Lab — Camisetas em tecido tech" },
      {
        name: "description",
        content:
          "Camisetas minimalistas em tecido tech: secagem rápida, proteção UV e antiodor. Compre com Pix, boleto ou cartão.",
      },
      { property: "og:title", content: "Koodari Lab — Camisetas em tecido tech" },
      {
        property: "og:description",
        content: "Camisetas minimalistas em tecido tech, feitas para durar e respirar.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Home,
});

function Home() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const featured = products.filter((p) => p.featured).slice(0, 3);
  const hero = products[0];

  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Tecido tech · Brasil
          </p>
          <h1 className="font-display mt-6 text-4xl leading-tight font-medium md:text-6xl">
            A camiseta que some no corpo e aparece no detalhe.
          </h1>
          <p className="mt-6 max-w-md text-muted-foreground">
            Peças mínimas em malha tecnológica: leve, respirável, com secagem rápida e acabamento
            que não amassa. Menos peças, mais uso.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/loja"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-primary px-8 text-sm text-primary-foreground transition-opacity hover:opacity-90"
            >
              Ver coleção
            </Link>
            <Link
              to="/tecido"
              className="inline-flex h-11 items-center justify-center rounded-sm border border-border px-8 text-sm transition-colors hover:bg-accent"
            >
              Conhecer o tecido
            </Link>
          </div>
        </div>

        {hero?.image_url ? (
          <div className="bg-muted overflow-hidden rounded-sm">
            <img
              src={hero.image_url}
              alt={hero.name}
              width={1024}
              height={1280}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          {[
            { title: "Secagem rápida", text: "Fibra tech que dispersa a umidade em minutos." },
            { title: "Antiodor", text: "Tratamento que mantém a peça fresca no dia inteiro." },
            { title: "Proteção UV 50+", text: "Barreira solar direto na malha, sem perder o toque." },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-base">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl">Destaques</h2>
            <Link to="/loja" className="text-sm text-muted-foreground hover:text-foreground">
              Ver tudo
            </Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
