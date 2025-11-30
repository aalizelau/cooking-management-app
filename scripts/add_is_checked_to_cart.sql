-- Add is_checked column to shopping_cart table

ALTER TABLE public.shopping_cart
ADD COLUMN IF NOT EXISTS is_checked boolean DEFAULT false;

-- Comment on column
COMMENT ON COLUMN public.shopping_cart.is_checked IS 'Whether the item has been checked/bought in the shopping cart';
