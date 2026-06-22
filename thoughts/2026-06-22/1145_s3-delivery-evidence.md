# Delivery Evidence — S3: Dług sync z UX-B
**Data:** 2026-06-22 11:45
**Iteracja:** 1

## Co zrobiono

### (a) Beforeunload flush — weryfikacja
**Status: ✅ JUŻ POPRAWNIE WDROŻONE**

Plik: `apps/web/src/store/useUIStore.ts` (linia ~418)

```typescript
window.addEventListener('beforeunload', () => {
  // ...
  fetch(`${SB_URL}/rest/v1/rpc/merge_preferences`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SB_KEY,
    },
    body: JSON.stringify({ p_preferences: batch }),
    keepalive: true,
  }).catch(() => {});
});
```

- Używa **RPC merge_preferences z JSONB-merge** (`COALESCE(preferences, '{}'::jsonb) || p_preferences`)
- **Nie ufa client user_id** — RPC robi `WHERE id = auth.uid()` (SECURITY DEFINER)
- Token pobierany z localStorage (`tmc-auth-token`)
- `keepalive: true` — działa nawet po zamknięciu karty

**Wniosek:** (a) jest już poprawnie zaimplementowane.

### (b) preferences_updated_at — decyzja: USUŃ
**Status: ✅ Wdrożono**

- Kolumna `preferences_updated_at` + trigger NIGDY nie są czytane przez kod aplikacji
- `applyCloudPreferences()` czyta tylko `preferences` JSONB (przez `getPreferences()`)
- Cloud-wins przez atomic JSONB-merge nie potrzebuje timestampów
- Nowa migracja: `20260622120000_drop_preferences_updated_at.sql`

### (c) Version bump + docs
- Wersja 0.8.0 → 0.9.0 (minor — 3 nowe funkcje auth)
- CHANGELOG: nowy release [0.9.0] z S1, S2, S3
- AUTH_FLOW.md: dodano sekcje 12 (Reset hasła) i 13 (Email confirmation)

## Zmienione pliki
- supabase/migrations/20260622120000_drop_preferences_updated_at.sql (NOWY)
- docs/AUTH_FLOW.md (sekcje 12, 13, aktualizacja tabeli 10)
- package.json (root, apps/web, packages/*) — wersja 0.9.0
- CHANGELOG.md — nowy release

## Decyzje
- premissions_updated_at: usuń — jest martwy, cloud-wins przez JSONB-merge nie potrzebuje timestamps
- Beforeunload flush: przechodzi audyt — auth.uid(), brak client user_id, keepalive, atomic merge