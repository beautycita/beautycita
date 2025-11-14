# Favorites Feature - Implementation Guide

## Status: ✅ Complete

**What's Done:**
- ✅ Backend API (`backend/src/routes/favorites.js`)
- ✅ Favorites service (`frontend/src/services/favoritesService.ts`)
- ✅ useFavorites hook (`frontend/src/hooks/useFavorites.ts`)
- ✅ FavoriteButton component (`frontend/src/components/favorites/FavoriteButton.tsx`)
- ✅ FavoritesPage (`frontend/src/pages/FavoritesPage.tsx`)

**What's Needed:**
- Add FavoriteButton to stylist cards on StylistsPage
- Add FavoriteButton to StylistProfilePage
- Optional: Add favorites count to navbar

---

## How to Use the Favorites System

### 1. Import the Hook and Component

```typescript
import { useFavorites } from '@/hooks/useFavorites';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
```

### 2. Use in Your Component

```typescript
export default function StylistsPage() {
  const { isFavorite, toggleFavorite, loading } = useFavorites();

  return (
    <div>
      {/* Your stylist cards */}
      <div className="stylist-card">
        <h3>Stylist Name</h3>

        {/* Add favorite button */}
        <FavoriteButton stylistId={stylist.id} />
      </div>
    </div>
  );
}
```

---

## FavoriteButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stylistId` | number | *required* | ID of the stylist |
| `size` | 'sm' \| 'md' \| 'lg' | 'md' | Size of the heart icon |
| `showLabel` | boolean | false | Show "Favorite" / "Favorited" label |
| `className` | string | '' | Additional CSS classes |

### Examples

**Small button (for cards):**
```tsx
<FavoriteButton stylistId={123} size="sm" />
```

**Large button with label (for profile page):**
```tsx
<FavoriteButton stylistId={123} size="lg" showLabel={true} />
```

**Custom styling:**
```tsx
<FavoriteButton
  stylistId={123}
  className="absolute top-4 right-4 bg-white shadow-lg"
/>
```

---

## Integration Examples

### Example 1: Add to StylistsPage

**File:** `frontend/src/pages/StylistsPage.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';

export default function StylistsPage() {
  const [stylists, setStylists] = useState([]);

  // ... your existing code

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stylists.map(stylist => (
        <div key={stylist.id} className="relative bg-white rounded-3xl shadow-sm p-6">
          {/* Add favorite button to top-right corner */}
          <div className="absolute top-4 right-4 z-10">
            <FavoriteButton stylistId={stylist.id} />
          </div>

          {/* Rest of stylist card */}
          <img loading="lazy" src={stylist.profile_picture} alt={stylist.business_name} />
          <h3>{stylist.business_name}</h3>
          <p>{stylist.location_city}, {stylist.location_state}</p>

          {/* ... rest of card content */}
        </div>
      ))}
    </div>
  );
}
```

---

### Example 2: Add to StylistCard Component

**File:** `frontend/src/components/home/StylistCard.tsx`

```typescript
import React from 'react';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';

interface StylistCardProps {
  stylist: any;
}

export const StylistCard: React.FC<StylistCardProps> = ({ stylist }) => {
  return (
    <div className="relative bg-white rounded-3xl shadow-sm overflow-hidden">
      {/* Favorite button in top-right */}
      <div className="absolute top-4 right-4 z-10">
        <FavoriteButton
          stylistId={stylist.id}
          className="bg-white/80 backdrop-blur-sm shadow-md"
        />
      </div>

      {/* Image */}
      <img loading="lazy"
        src={stylist.profile_picture}
        alt={stylist.business_name}
        className="w-full h-48 object-cover"
      />

      {/* Content */}
      <div className="p-6">
        <h3 className="font-semibold text-lg">{stylist.business_name}</h3>
        <p className="text-gray-600">{stylist.location_city}</p>
      </div>
    </div>
  );
};
```

---

### Example 3: Add to StylistProfilePage

**File:** `frontend/src/pages/StylistProfilePage.tsx`

```typescript
import React from 'react';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';

export default function StylistProfilePage() {
  const { id } = useParams();
  const [stylist, setStylist] = useState(null);

  // ... fetch stylist data

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero section with favorite button */}
      <div className="bg-white rounded-3xl shadow-lg p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold">{stylist?.business_name}</h1>
            <p className="text-gray-600 text-lg">{stylist?.location_city}</p>
          </div>

          {/* Large favorite button with label */}
          <FavoriteButton
            stylistId={parseInt(id)}
            size="lg"
            showLabel={true}
            className="shadow-sm"
          />
        </div>

        {/* ... rest of profile content */}
      </div>
    </div>
  );
}
```

---

### Example 4: useFavorites Hook (Advanced)

For more control, use the hook directly:

```typescript
import { useFavorites } from '@/hooks/useFavorites';

export default function MyComponent() {
  const {
    favorites,        // Array of all favorited stylists
    loading,          // Loading state
    error,            // Error message (if any)
    isFavorite,       // Function: check if stylist is favorited
    addFavorite,      // Function: add stylist to favorites
    removeFavorite,   // Function: remove stylist from favorites
    toggleFavorite,   // Function: toggle favorite status
    count,            // Number of favorites
  } = useFavorites();

  // Check if stylist is favorited
  const favorited = isFavorite(stylistId);

  // Toggle favorite
  const handleToggle = async () => {
    await toggleFavorite(stylistId);
  };

  // Display favorites count
  return (
    <div>
      <p>You have {count} favorite stylists</p>
      <button onClick={handleToggle}>
        {favorited ? 'Unfavorite' : 'Favorite'}
      </button>
    </div>
  );
}
```

---

## API Endpoints

The favorites system uses these endpoints:

```typescript
// Get all favorites
GET /api/favorites
Response: { success: true, data: { favorites: [...] } }

// Add favorite
POST /api/favorites/:stylistId
Response: { success: true, message: 'Added to favorites' }

// Remove favorite
DELETE /api/favorites/:stylistId
Response: { success: true, message: 'Removed from favorites' }
```

---

## Database Schema

**Table:** `client_favorite_stylists`

```sql
CREATE TABLE client_favorite_stylists (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(client_id, stylist_id)
);
```

---

## Features

### ✅ Implemented

1. **Add/Remove Favorites** - Heart icon toggles favorite status
2. **Favorites Page** - View all favorited stylists
3. **Optimistic Updates** - UI updates immediately
4. **Toast Notifications** - Success/error messages
5. **Authentication Check** - Redirects to login if not authenticated
6. **Animated Heart** - Scale animation on click
7. **Filled/Outline Icon** - Visual feedback for favorited state
8. **Responsive Design** - Works on all screen sizes

### 🔄 Optional Enhancements

1. **Favorites Count Badge** - Show count in navbar
2. **Favorites Filter** - Filter stylists by favorites on StylistsPage
3. **Recently Favorited** - Show recently added favorites
4. **Favorite Notes** - Add notes to favorites (backend supports it)
5. **Favorite Notifications** - Notify when favorite has availability
6. **Share Favorites** - Share favorite list with friends
7. **Favorite Collections** - Organize favorites into collections

---

## Add Favorites Count to Navbar

**File:** `frontend/src/components/Navbar.tsx`

```typescript
import { useFavorites } from '@/hooks/useFavorites';
import { HeartIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { count } = useFavorites();

  return (
    <nav>
      {/* ... other nav items */}

      <Link to="/favorites" className="relative">
        <HeartIcon className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </Link>
    </nav>
  );
}
```

---

## Testing Checklist

- [ ] Add favorite from StylistsPage
- [ ] Remove favorite from StylistsPage
- [ ] View favorites on FavoritesPage
- [ ] Remove favorite from FavoritesPage
- [ ] Heart icon fills when favorited
- [ ] Heart icon empties when unfavorited
- [ ] Toast notification shows on add
- [ ] Toast notification shows on remove
- [ ] Redirects to login if not authenticated
- [ ] Favorites persist after page refresh
- [ ] Works on mobile (touch interactions)
- [ ] Animation plays on toggle
- [ ] Count updates in navbar (if implemented)

---

## Troubleshooting

### Issue: "Please login to add favorites" even when logged in

**Solution:** Check `authStore` is properly initialized and `isAuthenticated` is true.

```typescript
import { useAuthStore } from '@/store/authStore';

const { isAuthenticated, user } = useAuthStore();
console.log('Authenticated:', isAuthenticated, 'User:', user);
```

### Issue: Favorites not loading

**Solution:** Check API endpoint and authentication token:

```bash
# Check favorites endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" https://beautycita.com/api/favorites
```

### Issue: API returns 401 Unauthorized

**Solution:** Ensure JWT token is included in requests. Check `apiClient` configuration.

### Issue: Favorites endpoint returns 404

**Solution:** Verify the favorites route is mounted in backend:

```javascript
// backend/src/server.js
app.use('/api/favorites', authenticate, favoritesRoutes);
```

---

## Performance Notes

- Favorites are loaded once on mount
- Toggling favorites uses optimistic updates (immediate UI feedback)
- API calls run in background
- No refetching on every render
- Favorites cached in component state

---

## Next Steps

1. **Integrate FavoriteButton into StylistsPage**
   - Add to stylist cards
   - Position in top-right corner

2. **Add to StylistProfilePage**
   - Large button with label
   - Prominent placement

3. **Optional: Add Navbar Badge**
   - Show favorites count
   - Link to FavoritesPage

4. **Test End-to-End**
   - Create account
   - Add favorites
   - View favorites page
   - Remove favorites

---

**Implementation Time:** ~6 hours
**Status:** ✅ Infrastructure complete, ready for integration
**Next Action:** Add `<FavoriteButton />` to stylist cards in StylistsPage.tsx
