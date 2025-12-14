-- Add list_type column to shopping_cart table to distinguish between wishlist and shopping list

-- Add the column (safe to run multiple times)
ALTER TABLE public.shopping_cart
ADD COLUMN IF NOT EXISTS list_type text DEFAULT 'shopping';

-- Add check constraint only if it doesn't exist
-- (PostgreSQL doesn't support IF NOT EXISTS for constraints, so we use a DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'list_type_check'
        AND conrelid = 'public.shopping_cart'::regclass
    ) THEN
        ALTER TABLE public.shopping_cart
        ADD CONSTRAINT list_type_check CHECK (list_type IN ('wishlist', 'shopping'));
    END IF;
END $$;

-- Add index for better query performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_shopping_cart_list_type ON public.shopping_cart(list_type);

-- Add comment on column
COMMENT ON COLUMN public.shopping_cart.list_type IS 'Type of list: wishlist (want to buy) or shopping (final shopping list)';
