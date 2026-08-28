import { Link } from "@tanstack/react-router";
import { ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";

export function SiteHeader() {
  const { count } = useCart();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-display text-sm tracking-[0.35em] uppercase">
          Koodari Lab
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/loja" className="transition-colors hover:text-foreground">
            Loja
          </Link>
          <Link to="/tecido" className="transition-colors hover:text-foreground">
            O tecido
          </Link>
          {isAdmin ? (
            <Link to="/admin" className="transition-colors hover:text-foreground">
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            to={user ? "/conta" : "/auth"}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Minha conta"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <Link
            to="/carrinho"
            className="relative text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {count > 0 ? (
              <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
