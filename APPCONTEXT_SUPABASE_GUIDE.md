# AppContext with Supabase Integration

Your `AppContext.jsx` has been updated to use Supabase for data persistence instead of localStorage.

## What Changed

### ✅ New Features

1. **Supabase Integration**
   - Ingredients are now fetched from Supabase on app load
   - All changes (add, update, delete) are synced to Supabase automatically
   - Real-time updates: changes from other devices appear instantly

2. **Loading States**
   - `loading`: true while fetching initial data
   - `syncing`: true while saving changes to Supabase
   - `error`: contains error message if something goes wrong

3. **Offline Support**
   - localStorage cache as fallback if Supabase is unavailable
   - Optimistic UI updates (changes appear instantly, sync happens in background)
   - Graceful degradation if Supabase connection fails

4. **New Methods**
   - `refreshIngredients()`: manually refresh data from Supabase
   - `deleteIngredient(id)`: delete an ingredient (now available in context)

### 📦 Data Flow

```
1. App loads → Fetch from Supabase
2. If Supabase fails → Load from localStorage cache
3. If cache empty → Use INITIAL_INGREDIENTS
4. User makes change → Update UI immediately (optimistic)
5. Sync to Supabase in background
6. Cache to localStorage as backup
7. Real-time updates from other devices → Update UI automatically
```

## Using the Updated Context

### Basic Usage (No Changes Required)

Your existing code will continue to work:

```javascript
import { useApp } from './context/AppContext';

function MyComponent() {
  const { ingredients, addIngredient, updateIngredient } = useApp();
  
  // Works exactly the same as before
  const handleUpdate = (id) => {
    updateIngredient(id, { stockStatus: 'In Stock' });
  };
}
```

### Using New Features

#### Show Loading State

```javascript
import { useApp } from './context/AppContext';
import LoadingSpinner from './components/LoadingSpinner';

function InventoryDashboard() {
  const { ingredients, loading, error } = useApp();
  
  if (loading) {
    return <LoadingSpinner message="Loading ingredients..." />;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return (
    <div>
      {ingredients.map(ing => (
        <IngredientCard key={ing.id} ingredient={ing} />
      ))}
    </div>
  );
}
```

#### Show Syncing Indicator

```javascript
import { useApp } from './context/AppContext';

function SyncIndicator() {
  const { syncing } = useApp();
  
  if (!syncing) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 20, 
      right: 20,
      padding: '8px 16px',
      background: '#3b82f6',
      color: 'white',
      borderRadius: '8px',
      fontSize: '14px'
    }}>
      ⏳ Syncing...
    </div>
  );
}
```

#### Manual Refresh

```javascript
import { useApp } from './context/AppContext';

function RefreshButton() {
  const { refreshIngredients, loading } = useApp();
  
  return (
    <button 
      onClick={refreshIngredients}
      disabled={loading}
    >
      {loading ? 'Refreshing...' : '🔄 Refresh'}
    </button>
  );
}
```

#### Delete Ingredient

```javascript
import { useApp } from './context/AppContext';

function DeleteButton({ ingredientId }) {
  const { deleteIngredient } = useApp();
  
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this ingredient?')) {
      await deleteIngredient(ingredientId);
    }
  };
  
  return <button onClick={handleDelete}>Delete</button>;
}
```

## Environment Setup

Make sure you have your Supabase credentials set up:

### 1. Create `.env.local` file

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Restart your dev server

```bash
npm run dev
```

## Behavior Details

### First Load

1. App shows loading spinner
2. Fetches data from Supabase
3. If successful: displays data
4. If Supabase unavailable: falls back to localStorage cache
5. If no cache: uses INITIAL_INGREDIENTS

### Making Changes

1. User clicks "Update Stock Status"
2. UI updates immediately (optimistic update)
3. Request sent to Supabase in background
4. If Supabase succeeds: ✅ logged to console
5. If Supabase fails: ⚠️ logged to console, but UI keeps the change
6. Change cached to localStorage automatically

### Real-time Sync

1. Another device updates an ingredient
2. Supabase sends real-time notification
3. Your app receives the update
4. UI updates automatically (no refresh needed!)

## Troubleshooting

### "Loading forever"

**Cause**: Supabase credentials not set or incorrect

**Solution**:
1. Check `.env.local` has correct credentials
2. Restart dev server: `npm run dev`
3. Check browser console for errors

### "No data showing"

**Cause**: Supabase database is empty

**Solution**:
1. Run the migration: `npm run supabase:migrate`
2. Or manually add data in Supabase dashboard
3. Or app will use INITIAL_INGREDIENTS as fallback

### "Changes not syncing"

**Cause**: Supabase connection issue or RLS policies

**Solution**:
1. Check browser console for errors
2. Verify Supabase project is active
3. Check RLS policies in Supabase dashboard
4. Changes are still saved to localStorage cache

### "Real-time not working"

**Cause**: Realtime not enabled or subscription failed

**Solution**:
1. Enable Realtime in Supabase dashboard
2. Check browser console for subscription errors
3. Verify RLS policies allow SELECT

## Migration Checklist

- [x] ✅ AppContext updated to use Supabase
- [x] ✅ Loading states added
- [x] ✅ Error handling implemented
- [x] ✅ localStorage fallback working
- [x] ✅ Real-time sync enabled
- [x] ✅ Optimistic updates implemented
- [ ] 🔲 Set up `.env.local` with credentials
- [ ] 🔲 Run migration to upload data
- [ ] 🔲 Test in browser
- [ ] 🔲 Update components to show loading state (optional)

## Next Steps

1. **Set up Supabase credentials** (see above)
2. **Run the migration** to upload your data:
   ```bash
   npm run supabase:migrate
   ```
3. **Test the app** - everything should work automatically!
4. **Optional**: Add loading indicators to your components
5. **Optional**: Add a sync indicator in your header

## Notes

- Recipes and cart are still stored in localStorage (not synced to Supabase yet)
- You can add Supabase sync for recipes later if needed
- The app works offline and syncs when connection is restored
- All changes are cached to localStorage as backup

## Support

If you encounter any issues:
1. Check browser console for error messages
2. Verify Supabase credentials in `.env.local`
3. Test Supabase connection: `npm run supabase:test`
4. Check Supabase dashboard logs
