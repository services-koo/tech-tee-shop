import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CatalogVariant = {
  id: string;
  size: string;
  color: string;
  stock: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  fabric_description: string;
  price_cents: number;
  image_url: string | null;
  featured: boolean;
  variants: CatalogVariant[];
};

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicSupabase } = await import("./supabase-public.server");
  const supabase = createPublicSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, description, fabric_description, price_cents, image_url, featured, product_variants(id, size, color, stock)",
    )
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({
    ...p,
    variants: (p.product_variants ?? []) as CatalogVariant[],
  })) as CatalogProduct[];
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { createPublicSupabase } = await import("./supabase-public.server");
    const supabase = createPublicSupabase();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        "id, slug, name, description, fabric_description, price_cents, image_url, featured, product_variants(id, size, color, stock)",
      )
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!product) return null;

    return {
      ...product,
      variants: (product.product_variants ?? []) as CatalogVariant[],
    } as CatalogProduct;
  });

export const getShippingSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicSupabase } = await import("./supabase-public.server");
  const supabase = createPublicSupabase();

  const { data, error } = await supabase
    .from("shipping_settings")
    .select("flat_rate_cents, free_above_cents")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? { flat_rate_cents: 2490, free_above_cents: 29900 };
});
