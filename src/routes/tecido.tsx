import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tecido")({
  head: () => ({
    meta: [
      { title: "O tecido tech — Koodari Lab" },
      {
        name: "description",
        content:
          "Entenda a malha tech da Koodari Lab: secagem rápida, proteção UV 50+, antiodor e alta recuperação de forma.",
      },
      { property: "og:title", content: "O tecido tech — Koodari Lab" },
      {
        property: "og:description",
        content: "Malha tech com secagem rápida, proteção UV 50+ e tratamento antiodor.",
      },
    ],
  }),
  component: Tecido,
});

function Tecido() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-3xl">O tecido</h1>
      <p className="mt-6 text-muted-foreground">
        Trabalhamos com duas malhas tech desenvolvidas para uso diário e treino leve. Ambas têm
        gramatura média, caimento estruturado e não ficam transparentes.
      </p>

      <div className="mt-12 space-y-10">
        <section>
          <h2 className="font-display text-lg">Poliamida tech 88% + elastano 12%</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Toque seco e leve elasticidade nos quatro sentidos. Secagem rápida, proteção UV 50+ e
            tratamento antiodor permanente.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg">Poliéster tech reciclado 92% + elastano 8%</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Alta respirabilidade e recuperação de forma. Fio reciclado, costura plana e barra
            arredondada.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg">Cuidados</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Lave à máquina em água fria, do avesso. Não use amaciante nem secadora. Secagem à
            sombra em poucos minutos.
          </p>
        </section>
      </div>

      <Link
        to="/loja"
        className="mt-14 inline-flex h-11 items-center rounded-sm bg-primary px-8 text-sm text-primary-foreground transition-opacity hover:opacity-90"
      >
        Ver coleção
      </Link>
    </div>
  );
}
