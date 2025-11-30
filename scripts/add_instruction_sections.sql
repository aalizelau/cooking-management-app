-- Add instruction_sections column to recipes table
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS instruction_sections JSONB DEFAULT '[]'::jsonb;
