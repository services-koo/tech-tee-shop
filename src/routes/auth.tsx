import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type AuthSearch = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Entrar — Koodari Lab" },
      { name: "description", content: "Acesse sua conta Koodari Lab para acompanhar seus pedidos." },
      { property: "og:title", content: "Entrar — Koodari Lab" },
      { property: "og:description", content: "Acesse sua conta Koodari Lab." },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/conta";
  return value;
}

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const destination = safePath(search.redirect);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: destination });
    });
  }, [destination, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Enviamos um link de redefinição para o seu e-mail.");
        setMode("signin");
        return;
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}${destination}`,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Confirme seu e-mail para continuar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: destination });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      sessionStorage.setItem("koodari-redirect", destination);
    } catch {
      // ignore
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: destination });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-display text-2xl">{mode === "signin" ? "Entrar" : "Criar conta"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Acompanhe seus pedidos e finalize a compra com rapidez.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === "signup" ? (
          <Field label="Nome completo" value={fullName} onChange={setFullName} required />
        ) : null}
        <Field label="E-mail" type="email" value={email} onChange={setEmail} required />
        <Field label="Senha" type="password" value={password} onChange={setPassword} required />
        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-sm bg-primary text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleGoogle}
        className="mt-4 h-11 w-full rounded-sm border border-border text-sm transition-colors hover:bg-accent"
      >
        Continuar com Google
      </button>

      <button
        type="button"
        className="mt-6 w-full text-center text-xs text-muted-foreground underline"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin" ? "Não tem conta? Criar agora" : "Já tenho conta"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs tracking-[0.15em] text-muted-foreground uppercase">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-sm border border-border bg-card px-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
