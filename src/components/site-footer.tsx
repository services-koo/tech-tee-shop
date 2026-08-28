import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display tracking-[0.3em] text-foreground uppercase">Koodari Lab</p>
          <p className="mt-2 max-w-sm">
            Camisetas em tecido tech, feitas para durar e respirar. Pagamento por Pix, boleto ou
            cartão.
          </p>
        </div>
        <div className="flex gap-8">
          <Link to="/loja" className="transition-colors hover:text-foreground">
            Loja
          </Link>
          <Link to="/tecido" className="transition-colors hover:text-foreground">
            O tecido
          </Link>
          <Link to="/conta" className="transition-colors hover:text-foreground">
            Meus pedidos
          </Link>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Koodari Lab
      </div>
    </footer>
  );
}
