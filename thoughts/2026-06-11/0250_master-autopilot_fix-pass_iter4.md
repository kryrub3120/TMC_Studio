# MasterAutopilot - LOOP AGAIN Fix Pass (iter 4)
**Data:** 2026-06-11

## Diff logiki `performAutoSave()`

### Przed
```
saveDocument()
try { await saveToCloud() } catch → cloudSuccess = false
if (cloudSuccess) → thumbnail (throttled 30s)
set({ isDirty: false })  ← ZAWSZE czyści isDirty
setProjectSaveStatus(cloudSuccess ? 'saved' : 'error')
```

### Po
```
saveDocument()  ← zawsze (niezależnie od cloud)

if (isSupabaseEnabled) {
  const ok = await saveToCloud()  ← sprawdza zwróconego boolean
  if (!ok) → cloudSuccess = false  ← NIE tylko catch
}

if (cloudSuccess) {
  thumbnail (throttled 30s)
  set({ isDirty: false })  ← czyści TYLKO przy sukcesie
  setProjectSaveStatus('saved')
} else {
  // isDirty pozostaje true → autosave retry na następnym cyklu 2s
  setProjectSaveStatus('error')
}
```

## Kluczowe zmiany
1. **`saveToCloud()` zwraca `false` dla offline** → wykrywane przez `!ok`, nie tylko przez `catch`
2. **`isDirty` nie jest czyszczone przy cloud failure** → autosave może ponowić próbę za 2s
3. **Thumbnail generowany tylko przy `cloudSuccess`**
4. **`projectSaveStatus = 'saved'` tylko przy sukcesie**, `'error'` przy failure

## Verification
- `pnpm typecheck` — 9/9 PASS
- `pnpm --filter @tmc/web test` — 99/99 PASS

## SprintGate: ACCEPT Sprint G/E/F ✅