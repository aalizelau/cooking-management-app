-- Shopping Cart Table Schema
-- Run this in your Supabase SQL Editor to create the cart table

-- Create shopping_cart table
CREATE TABLE IF NOT EXISTS shopping_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on ingredient_id for faster queries
CREATE INDEX IF NOT EXISTS idx_shopping_cart_ingredient_id ON shopping_cart(ingredient_id);

-- Create index on device_id for faster queries
CREATE INDEX IF NOT EXISTS idx_shopping_cart_device_id ON shopping_cart(device_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_shopping_cart_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_shopping_cart_updated_at ON shopping_cart;
CREATE TRIGGER update_shopping_cart_updated_at
    BEFORE UPDATE ON shopping_cart
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_cart_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow all operations for all users
CREATE POLICY "Enable read access for all users" ON shopping_cart
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON shopping_cart
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON shopping_cart
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON shopping_cart
    FOR DELETE USING (true);

-- Add comment
COMMENT ON TABLE shopping_cart IS 'Stores shopping cart items that sync across devices';
