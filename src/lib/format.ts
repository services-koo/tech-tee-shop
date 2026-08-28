export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    (cents ?? 0) / 100,
  );
}

export function onlyDigits(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  RECEIVED: "Pago",
  CONFIRMED: "Pago",
  RECEIVED_IN_CASH: "Pago",
  OVERDUE: "Vencido",
  REFUNDED: "Estornado",
  REFUND_REQUESTED: "Estorno solicitado",
  CHARGEBACK_REQUESTED: "Chargeback solicitado",
  AWAITING_RISK_ANALYSIS: "Em análise",
  DECLINED: "Recusado",
  CANCELED: "Cancelado",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  canceled: "Cancelado",
  refunded: "Estornado",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão de crédito",
};
