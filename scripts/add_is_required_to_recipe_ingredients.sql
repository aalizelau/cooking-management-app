-- Add is_required column to recipe_ingredients table
-- DEFAULT FALSE for smooth migration (all existing ingredients treated as optional)
-- This ensures existing recipes continue to show as "Available" without breaking changes

-- Add the column (safe to run multiple times)
ALTER TABLE public.recipe_ingredients
ADD COLUMN IF NOT EXISTS is_required boolean DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_is_required
ON public.recipe_ingredients(is_required);

-- Add comment on column
COMMENT ON COLUMN public.recipe_ingredients.is_required
IS 'Whether this ingredient is required (true) or optional (false) for the recipe. Defaults to false for backward compatibility - users can opt-in to marking ingredients as required.';
