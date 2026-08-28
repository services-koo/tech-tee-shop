import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Koodari Lab" },
      { name: "description", content: "Crie uma nova senha para sua conta Koodari Lab." },
      { property: "og:title", content: "Redefinir senha — Koodari Lab" },
      { property: "og:description", content: "Crie uma nova senha para sua conta Koodari Lab." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso.");
      navigate({ to: "/conta" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-display text-2xl">Nova senha</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {ready
          ? "Defina a nova senha da sua conta."
          : "Abra esta página pelo link enviado no e-mail de redefinição."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-xs tracking-[0.15em] text-muted-foreground uppercase">Nova senha</span>
          <input
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 h-11 w-full rounded-sm border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-xs tracking-[0.15em] text-muted-foreground uppercase">Confirmar senha</span>
          <input
            type="password"
            value={confirm}
            required
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-2 h-11 w-full rounded-sm border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !ready}
          className="h-11 w-full rounded-sm bg-primary text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Aguarde..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
