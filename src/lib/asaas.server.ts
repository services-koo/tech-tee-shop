const SANDBOX_URL = "https://api-sandbox.asaas.com/v3";
const PRODUCTION_URL = "https://api.asaas.com/v3";

function config() {
  const apiKey = process.env["ASAAS_API_KEY"];
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurada");
  const env = (process.env["ASAAS_ENV"] ?? "sandbox").toLowerCase();
  const baseUrl = env === "production" || env === "live" ? PRODUCTION_URL : SANDBOX_URL;
  return { apiKey, baseUrl };
}

export async function asaasFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { apiKey, baseUrl } = config();
  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      "User-Agent": "KoodariLab",
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });


  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const description =
      (payload as { errors?: { description?: string }[] } | null)?.errors?.[0]?.description ??
      (typeof payload === "string" ? payload : JSON.stringify(payload));
    console.error(`Asaas request failed [${response.status}] ${path}: ${description}`);
    throw new Error(description || `Falha na comunicação com a Asaas (${response.status})`);
  }

  return payload as T;
}

export type AsaasCustomer = { id: string };

export async function ensureAsaasCustomer(input: {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string | null;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  province?: string;
}): Promise<string> {
  const existing = await asaasFetch<{ data: AsaasCustomer[] }>(
    `/customers?cpfCnpj=${encodeURIComponent(input.cpfCnpj)}&limit=1`,
  );
  if (existing?.data?.length) return existing.data[0]!.id;

  const created = await asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: {
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj,
      mobilePhone: input.phone ?? undefined,
      postalCode: input.postalCode,
      address: input.address,
      addressNumber: input.addressNumber,
      province: input.province,
    },
  });
  return created.id;
}

export type AsaasPayment = {
  id: string;
  status: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  dueDate?: string;
};

export async function createAsaasPayment(body: Record<string, unknown>): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>("/payments", { method: "POST", body });
}

export async function getAsaasPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${paymentId}`);
}

export async function getAsaasPixQrCode(
  paymentId: string,
): Promise<{ encodedImage?: string; payload?: string }> {
  return asaasFetch(`/payments/${paymentId}/pixQrCode`);
}
