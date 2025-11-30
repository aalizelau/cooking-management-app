-- Create meal_plan table
CREATE TABLE IF NOT EXISTS public.meal_plan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    slot TEXT NOT NULL CHECK (slot IN ('lunch', 'dinner')),
    recipe_id BIGINT REFERENCES public.recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(date, slot) -- One recipe per slot per day for now
);

-- Enable RLS
ALTER TABLE public.meal_plan ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now as per existing pattern)
CREATE POLICY "Enable read access for all users" ON public.meal_plan FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.meal_plan FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.meal_plan FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.meal_plan FOR DELETE USING (true);
