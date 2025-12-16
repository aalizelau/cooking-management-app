-- Add custom_text column to meal_plan table
-- This allows users to add custom meal descriptions that aren't linked to recipes

-- Add the custom_text column (nullable)
ALTER TABLE public.meal_plan ADD COLUMN IF NOT EXISTS custom_text TEXT;

-- Add constraint: must have either recipe_id OR custom_text (not both, not neither)
-- This ensures data integrity - every meal plan entry must have content
ALTER TABLE public.meal_plan DROP CONSTRAINT IF EXISTS meal_plan_content_check;
ALTER TABLE public.meal_plan ADD CONSTRAINT meal_plan_content_check
CHECK (
    (recipe_id IS NOT NULL AND custom_text IS NULL) OR
    (recipe_id IS NULL AND custom_text IS NOT NULL)
);

-- Update the comment on the table to reflect the new functionality
COMMENT ON COLUMN public.meal_plan.custom_text IS 'Custom meal description for entries not linked to recipes';
