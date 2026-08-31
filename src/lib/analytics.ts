import posthog from "posthog-js";

const token = import.meta.env['VITE_LOVABLE_CONNECTOR_POSTHOG_API_KEY'] as string | undefined;
const region = (import.meta.env['VITE_LOVABLE_CONNECTOR_POSTHOG_REGION'] as string | undefined) ?? "eu";

const apiHost = region === "us" ? "https://us.i.posthog.com" : "https://eu.i.posthog.com";

let started = false;

export function initAnalytics() {
  if (started || typeof window === "undefined" || !token) return;
  started = true;
  posthog.init(token, {
    api_host: apiHost,
    capture_exceptions: true,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
    },
  });
}

export function isAnalyticsEnabled() {
  return started;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!started) return;
  posthog.capture(event, properties);
}

export function trackPageview(path: string) {
  if (!started) return;
  posthog.capture("$pageview", { $current_url: window.location.href, path });
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!started) return;
  posthog.identify(userId, properties);
}

/** Envia um erro ao Error tracking do PostHog com rota e contexto. */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!started) return;
  const err =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : "Erro desconhecido");
  posthog.captureException(err, {
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    ...context,
  });
}

export function resetAnalytics() {
  if (!started) return;
  posthog.reset();
}

/** Converte centavos para reais, para leitura direta nos gráficos. */
export function toBRL(cents: number) {
  return Math.round(cents) / 100;
}
