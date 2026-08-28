import { z } from "zod";

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().positive().max(20),
      }),
    )
    .min(1)
    .max(30),
  paymentMethod: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]),
  customer: z.object({
    name: z.string().min(3).max(120),
    email: z.string().email().max(160),
    cpfCnpj: z.string().min(11).max(14),
    phone: z.string().max(20).optional().nullable(),
  }),
  address: z.object({
    zip: z.string().min(8).max(9),
    street: z.string().min(3).max(160),
    number: z.string().min(1).max(20),
    complement: z.string().max(80).optional().nullable(),
    district: z.string().min(2).max(80),
    city: z.string().min(2).max(80),
    state: z.string().min(2).max(2),
  }),
  creditCard: z
    .object({
      holderName: z.string().min(3).max(120),
      number: z.string().min(13).max(19),
      expiryMonth: z.string().min(1).max(2),
      expiryYear: z.string().min(4).max(4),
      ccv: z.string().min(3).max(4),
    })
    .optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
