# Settings & Billing Integration Plan
**Created:** 2026-01-09  
**Status:** Ready for implementation

## ✅ Co Już Jest Gotowe

### Komponenty UI (packages/ui/src/)
- ✅ `SettingsModal.tsx` - 4 taby (Profile, Security, Billing, Preferences)
- ✅ `UpgradeSuccessModal.tsx` - celebration po upgrade
- ✅ Exported w `index.ts`
- ✅ Built successfully (0 errors)

### Backend 
- ✅ `apps/web/src/lib/supabase.ts`:
  - `updateProfile()` - line ~157
  - `changePassword()` - line ~170
  - `deleteAccount()` - line ~188
- ✅ `netlify/functions/create-portal-session.ts` - Stripe Customer Portal

### TopBar Menu
- ✅ TopBar ma już AccountMenu który wyświetla:
  - "Account & Billing" → wywołuje `onOpenAccount`
  - "Upgrade to Pro" → wywołuje `onUpgrade`
  - "Log Out" → wywołuje `onLogout`

---

## 📋 Co Trzeba Dodać do App.tsx

### 1. Add Imports (line ~25)
```typescript
import {
  // ... existing imports
  SettingsModal,
  UpgradeSuccessModal,
  // ...
} from '@tmc/ui';

import { 
  deleteProject as deleteProjectApi,
  updateProfile,
  changePassword,
  deleteAccount,
  supabase,
} from './lib/supabase';
```

### 2. Add State (line ~58, after pricingModalOpen)
```typescript
const [settingsModalOpen, setSettingsModalOpen] = useState(false);
const [upgradeSuccessModalOpen, setUpgradeSuccessModalOpen] = useState(false);
```

### 3. Add Handlers (after handleCreateFolder, line ~1504)
```typescript
// Settings handlers
const handleUpdateProfile = useCallback(async (updates: { full_name?: string; avatar_url?: string }) => {
  try {
    await updateProfile(updates);
    await useAuthStore.getState().initialize();
    showToast('Profile updated ✓');
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
}, [showToast]);

const handleChangePassword = useCallback(async (currentPassword: string, newPassword: string) => {
  try {
    await changePassword(currentPassword, newPassword);
    showToast('Password changed ✓');
  } catch (error) {
    console.error('Password change error:', error);
    throw error;
  }
}, [showToast]);

const handleDeleteAccount = useCallback(async (password: string) => {
  try {
    await deleteAccount(password);
    setSettingsModalOpen(false);
    showToast('Account deleted. Goodbye! 👋');
  } catch (error) {
    console.error('Account deletion error:', error);
    throw error;
  }
}, [showToast]);

const handleManageBilling = useCallback(async () => {
  try {
    const { data: { session } } = await supabase!.auth.getSession();
    if (!session?.access_token) {
      showToast('Please sign in first');
      return;
    }

    const response = await fetch('/.netlify/functions/create-portal-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ returnUrl: window.location.origin }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to open billing portal');
    if (data.url) window.location.href = data.url;
  } catch (error) {
    console.error('Billing portal error:', error);
    showToast('Failed to open billing portal');
  }
}, [showToast]);
```

### 4. Add Post-Payment useEffect (after handleManageBilling)
```typescript
// Post-payment flow
useEffectReact(() => {
  const params = new URLSearchParams(window.location.search);
  const checkoutStatus = params.get('checkout');
  
  if (checkoutStatus === 'success') {
    console.log('[Payment] Checkout success, refreshing user data...');
    useAuthStore.getState().initialize().then(() => {
      const user = useAuthStore.getState().user;
      if (user?.subscription_tier !== 'free') {
        setUpgradeSuccessModalOpen(true);
        showToast('🎉 Upgrade successful!');
      }
    });
    window.history.replaceState({}, '', window.location.pathname);
  } else if (checkoutStatus === 'cancelled') {
    showToast('Checkout cancelled');
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

### 5. Update TopBar onOpenAccount (line ~1555)
```typescript
onOpenAccount={authIsAuthenticated ? () => setSettingsModalOpen(true) : () => setAuthModalOpen(true)}
```

### 6. Add Modals Before Closing </div> (before line ~1829)
```tsx
{/* Settings Modal */}
<SettingsModal
  isOpen={settingsModalOpen}
  onClose={() => setSettingsModalOpen(false)}
  user={authUser}
  onUpdateProfile={handleUpdateProfile}
  onChangePassword={handleChangePassword}
  onDeleteAccount={handleDeleteAccount}
  onManageBilling={handleManageBilling}
  onUpgrade={() => {
    setSettingsModalOpen(false);
    setPricingModalOpen(true);
  }}
/>

{/* Upgrade Success Modal */}
<UpgradeSuccessModal
  isOpen={upgradeSuccessModalOpen}
  onClose={() => setUpgradeSuccessModalOpen(false)}
  plan={authUser?.subscription_tier === 'team' ? 'team' : 'pro'}
/>
```

---

## ⚠️ Uwagi Techniczne

1. **Dev Server już działa** na http://localhost:3001/
2. **HMR działa** - widać update dla SettingsModal.js i UpgradeSuccessModal.js
3. **TypeScript 0 errors** - packages/ui skompilowane poprawnie
4. **Nie dotykać** ProjectsDrawer.tsx i folder-related code
5. **Ostrożnie z replace_in_file** - jeden błąd i cały plik się uszkadza

---

## 🧪 Test Plan

Po implementacji:
1. Otwórz http://localhost:3001/ w przeglądarce
2. Zaloguj się (lub zarejestruj test account)
3. Kliknij na avatar w prawym górnym rogu
4. Kliknij "Account & Billing" → powinien otworzyć się Settings Modal
5. Testuj taby: Profile, Security, Billing
6. Kliknij "Upgrade to Pro" w menu → Pricing Modal
7. Kliknij "Log Out" → sprawdź w console czy `[Auth] Successfully signed out`

---

## 📄 Pliki Do Zmodyfikowania

1. `apps/web/src/App.tsx` - dodać ~100 linii kodu
   - Imports (5 linii)
   - State (2 linie)
   - Handlers (60 linii)
   - useEffect (15 linii)
   - Update TopBar (1 linia)
   - Render modals (20 linii)

NIE DOTYKAĆ:
- packages/ui/* (już gotowe)
- supabase.ts (już gotowe)
- useAuthStore.ts (już gotowe)
