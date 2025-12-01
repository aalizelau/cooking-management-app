ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

COMMENT ON COLUMN public.ingredients.notes IS 'Personal notes about the ingredient (e.g., characteristics, usage tips)';
