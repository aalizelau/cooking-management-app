-- Add instructions and thoughts columns to recipes table

ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS instructions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thoughts text DEFAULT '';

-- Comment on columns
COMMENT ON COLUMN public.recipes.instructions IS 'List of cooking steps';
COMMENT ON COLUMN public.recipes.thoughts IS 'User thoughts or reflections on the recipe';
