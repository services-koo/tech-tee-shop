CREATE OR REPLACE FUNCTION public.apply_order_stock(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _already boolean;
BEGIN
  SELECT stock_applied INTO _already FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF _already IS NULL OR _already THEN
    RETURN;
  END IF;

  UPDATE public.product_variants v
  SET stock = GREATEST(v.stock - oi.quantity, 0)
  FROM public.order_items oi
  WHERE oi.order_id = _order_id AND oi.variant_id = v.id;

  UPDATE public.orders SET stock_applied = true WHERE id = _order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_order_stock(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_order_stock(uuid) TO service_role;