# Shopping Cart Checked State Migration Instructions

## Overview
This migration adds persistence for the "checked/bought" state in the shopping cart. Previously, this state was only stored in component memory and was lost on page refresh.

## Database Migration Required

Before deploying the code changes, you **MUST** run the SQL migration to add the `is_checked` column to the `shopping_cart` table.

### Steps to Apply Migration:

1. **Connect to your Supabase project**:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to the SQL Editor

2. **Run the migration script**:
   - Copy the contents of `scripts/add_is_checked_to_cart.sql`
   - Paste into the SQL Editor
   - Execute the query

   The migration will:
   - Add an `is_checked` boolean column with a default value of `false`
   - Add a comment describing the column's purpose

3. **Verify the migration**:
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'shopping_cart' AND column_name = 'is_checked';
   ```

   Expected result:
   ```
   column_name | data_type | column_default
   ------------|-----------|---------------
   is_checked  | boolean   | false
   ```

## Code Changes Summary

The following files were modified:

### Backend (Database Layer)
- **`src/lib/supabase.js`**:
  - `fetchCartItems()` now returns `{ingredientId, isChecked}` objects instead of just IDs
  - Added `updateCartItemChecked(ingredientId, isChecked)` function
  - `addToCartDB()` now sets `is_checked: false` by default

### State Management
- **`src/context/AppContext.jsx`**:
  - Cart state changed from `[ingredientId]` array to `[{ingredientId, isChecked}]` array
  - Added `toggleCartItemChecked()` action
  - Updated real-time subscription to handle UPDATE events for checked state
  - Updated all cart operations to work with new structure

### UI
- **`src/pages/ShoppingCart.jsx`**:
  - Removed local `checkedItems` useState
  - Now uses `isChecked` from cart items in context
  - Updated all references to use new cart structure

- **`src/pages/IngredientDetail.jsx`**:
  - Fixed `isInCart` check to use `cart.some()` instead of `cart.includes()`
  - Add/Remove from cart buttons now work correctly

- **`src/components/IngredientCard.jsx`**:
  - Fixed `isInCart` check to use `cart.some()` instead of `cart.includes()`
  - Shopping cart icon now displays correctly

## Testing Checklist

After deploying:

- [ ] Run the SQL migration in Supabase
- [ ] Deploy the updated code
- [ ] Test adding items to cart from inventory page (IngredientCard component)
- [ ] Test adding/removing items to cart from ingredient detail page
- [ ] Test adding items to cart via search in shopping cart page
- [ ] Test checking/unchecking items in shopping cart
- [ ] **Test persistence**: Check items, refresh page, verify they remain checked
- [ ] Test restocking checked items
- [ ] Test real-time sync (open app in two tabs, check item in one, verify it updates in the other)
- [ ] Verify cart badge count displays correctly in header

## Rollback Plan

If issues occur:

1. Revert code changes to previous commit
2. Optionally remove the column:
   ```sql
   ALTER TABLE public.shopping_cart DROP COLUMN IF EXISTS is_checked;
   ```

## Notes

- The migration is backward compatible - existing cart items will have `is_checked = false`
- localStorage cache format has changed, old cache data will be ignored gracefully
- Real-time updates now include the checked state
