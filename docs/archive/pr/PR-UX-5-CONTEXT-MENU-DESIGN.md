# PR-UX-5: Canvas Context Menu - Design Proposals

**Status:** Design Phase  
**Date:** 26.01.2026  
**Mission:** Speed-first, intuitive, context-aware right-click menu for canvas elements

---

## 🎯 Problem Statement

**Current State:**
- Generic menu showing only "Select All" and "Paste" regardless of what's clicked
- No context awareness (player vs zone vs arrow)
- Missing critical actions (change number, switch team, layer control)
- No keyboard shortcuts hints
- Poor discoverability

**Goal:** 
Create a premium, context-aware context menu that accelerates workflow and teaches users shortcuts through passive discovery.

---

## 💡 Option 1: "Contextual Header + Shortcuts" (Recommended)

### Philosophy
- **Context First** - Header shows what you clicked
- **Speed-First** - Most frequent actions on top
- **Passive Learning** - Shortcuts visible inline
- **Flat UI** - Zero delay, instant response

### Visual Design

```
┌─────────────────────────────────────────┐
│ 🎽 Player #7 (Home)              ← header│
├─────────────────────────────────────────┤
│ 🔢 Change Number         double-tap     │  ← Quick actions
│ 🔄 Switch Team              Shift+P     │
│ ◼️ Cycle Shape                    S     │
├─────────────────────────────────────────┤
│ 📄 Copy                         ⌘C     │  ← Edit group
│ 📋 Duplicate                    ⌘D     │
├─────────────────────────────────────────┤
│ ⬆️ Bring to Front                      │  ← Layer group
│ ↗️ Bring Forward                       │
│ ↘️ Send Backward                       │
│ ⬇️ Send to Back                        │
├─────────────────────────────────────────┤
│ 🗑️ Delete                      ⌫/Del  │  ← Danger zone
└─────────────────────────────────────────┘
```

### Context Examples

**Empty Canvas:**
```
┌─────────────────────────────────────────┐
│ 📋 Paste                        ⌘V     │
│ ☑️ Select All                   ⌘A     │
├─────────────────────────────────────────┤
│ 🎽 Add Player                    P     │
│ ⚽ Add Ball                       B     │
│ ➡️ Add Arrow                     A     │
│ 🟦 Add Zone                      Z     │
└─────────────────────────────────────────┘
```

**Zone Element:**
```
┌─────────────────────────────────────────┐
│ 🟦 Zone (Rectangle)                     │
├─────────────────────────────────────────┤
│ ◼️ Cycle Shape                    E     │
│ 🎨 Change Color               Alt+↓     │
├─────────────────────────────────────────┤
│ 📄 Copy                         ⌘C     │
│ 📋 Duplicate                    ⌘D     │
├─────────────────────────────────────────┤
│ ⬆️ Bring to Front                      │
│ ⬇️ Send to Back                        │
├─────────────────────────────────────────┤
│ 🗑️ Delete                      ⌫/Del  │
└─────────────────────────────────────────┘
```

**Arrow Element:**
```
┌─────────────────────────────────────────┐
│ ➡️ Pass Arrow                           │
├─────────────────────────────────────────┤
│ 🔄 Change to Run               click    │
│ 🎨 Change Color               Alt+↓     │
│ 📏 Adjust Width               Alt+→     │
├─────────────────────────────────────────┤
│ 📄 Copy                         ⌘C     │
│ 📋 Duplicate                    ⌘D     │
├─────────────────────────────────────────┤
│ 🗑️ Delete                      ⌫/Del  │
└─────────────────────────────────────────┘
```

### Implementation Complexity
- **Effort:** Medium (2-3h)
- **Risk:** Low
- **Impact:** High

### Pros
✅ Clear context awareness  
✅ Passive shortcut learning  
✅ Familiar pattern (macOS-like)  
✅ Organized sections  

### Cons
❌ Może być za długie dla niektórych elementów  
❌ Shortcuts po prawej mogą być redundantne dla doświadczonych

---

## 💡 Option 2: "Radial/Circular Menu" (Innovativ)

### Philosophy
- **Muscle Memory** - Zawsze ta sama pozycja akcji
- **Visual Grouping** - Sekcje po kręgu
- **Gaming-Inspired** - Quick access jak w Overwatch/Fortnite
- **Speed** - One gesture = action

### Visual Design

```
          Delete
            🗑️
             |
    Copy — 🎽 — Duplicate
   📄      #7      📋
             |
          Layer
           ⬆️⬇️
```

**Radial Sections (clockwise from top):**
- 12 o'clock: Delete (danger)
- 3 o'clock: Duplicate
- 6 o'clock: Layer Control (hover = submenu)
- 9 o'clock: Copy
- Center: Element info

### Element-Specific Sectors

**Player:** Add sector at 1:30 for "Switch Team"  
**Zone:** Add sector at 10:30 for "Cycle Shape"  
**Text:** Add sector at 1:30 for "Edit"

### Implementation Complexity
- **Effort:** High (5-6h)
- **Risk:** Medium (nowy pattern)
- **Impact:** Very High (wow factor)

### Pros
✅ Unikalne i memorable  
✅ Super szybkie dla power users  
✅ Muscle memory development  
✅ Wow factor dla prezentacji  

### Cons
❌ Learning curve dla nowych  
❌ Trudniejsze na touch devices  
❌ Więcej kodu do maintainowania  
❌ Może być overkill dla prostej apki

---

## 💡 Option 3: "Compact Hybrid" (Minimalist)

### Philosophy
- **Minimalism** - Only essentials
- **Smart Defaults** - Context determines top action
- **Keyboard-First** - Menu jako backup dla myszy
- **Flat & Fast** - No headers, straight to action

### Visual Design

```
┌──────────────────────────┐
│ Edit #7          Shift+P │  ← Top action (smart)
│ Switch Team          ⌘T  │
│ Cycle Shape           S  │
├──────────────────────────┤
│ Copy & Delete        ⌘D  │  ← Common pair
├──────────────────────────┤
│ Layer ▶                  │  ← Submenu only
└──────────────────────────┘
```

**Smart Top Action Rules:**
- Player → "Change Number"
- Zone → "Cycle Shape"
- Text → "Edit Text"
- Arrow → "Change Type"
- Empty → "Add Player"

### Layer Submenu (on hover)
```
┌──────────────────────┐
│ To Front            │
│ Forward             │
│ Backward            │
│ To Back             │
└──────────────────────┘
```

### Implementation Complexity
- **Effort:** Low-Medium (2h)
- **Risk:** Very Low
- **Impact:** Medium

### Pros
✅ Najmniej kodu  
✅ Bardzo szybkie (3-4 opcje max)  
✅ Submenu = clean UI  
✅ Smart defaults accelerate workflow  

### Cons
❌ Mniej discoverability  
❌ Submenu może być irritating  
❌ Użytkownik musi znać shortcuts  

---

## 💡 Option 4: "Toolbar-Style Inline" (Canvas-Native)

### Philosophy
- **In-Place** - Menu pojawia się PRZY elemencie (nie przy kursorze)
- **Toolbar Pattern** - Horizontal buttons jak floating toolbar
- **Context Menu = Quick Actions** - Tylko 5-7 najważniejszych
- **Visual** - Ikony > text

### Visual Design

```
  🎽 Player #7
┌─────────────────────────────────────────┐
│  🔢   🔄   📄   📋   ⬆️   ⬇️   🗑️    │
└─────────────────────────────────────────┘
   ↑    ↑    ↑    ↑    ↑    ↑    ↑
  Num Team Copy Dup Front Back Delete
```

**Position:** Above or below element (smart placement)

### Implementation Complexity
- **Effort:** Medium-High (3-4h)
- **Risk:** Medium
- **Impact:** Very High (unique)

### Pros
✅ Bardzo szybki access (przy elemencie)  
✅ Visual context (widzisz co edytujesz)  
✅ Familiar pattern (floating toolbars)  
✅ Clean & modern  

### Cons
❌ Może zakrywać canvas  
❌ Trudne na małych ekranach  
❌ Nie pasuje do traditional right-click mental model  

---

## 🚀 5 Additional Innovative Ideas

### 1. **"Smart Suggestions"** (AI-Inspired)

**Concept:** Top 2 akcje bazują na historii użytkownika

```
┌─────────────────────────────────────────┐
│ 💡 Suggested                            │
├─────────────────────────────────────────┤
│ 🔢 Change Number    (you do this often) │
│ 📋 Duplicate        (last action: ⌘D)   │
├─────────────────────────────────────────┤
│ All Actions ▼                           │
└─────────────────────────────────────────┘
```

**Implementation:**
- Track last 5 actions per element type
- Show 2 most frequent at top
- Falls back to defaults for new users

**Pros:** Personalized, learns user workflow  
**Cons:** May be confusing at first, requires analytics

---

### 2. **"Keyboard Overlay Mode"**

**Concept:** Right-click ANYWHERE → full-screen keyboard hint overlay

```
┌──────────────────────────────────────────────┐
│                                              │
│     P - Add Player     A - Arrow            │
│     B - Add Ball       Z - Zone             │
│     T - Add Text       D - Drawing          │
│                                              │
│     ⌘D - Duplicate    ⌘C - Copy             │
│     Del - Delete      ⌘A - Select All       │
│                                              │
│     [Press ESC to close]                    │
│                                              │
└──────────────────────────────────────────────┘
```

**Use Case:** Training mode or quick reference

**Pros:** Great for learning, single source of truth  
**Cons:** Blocks canvas, may be annoying for power users

---

### 3. **"Command Palette Hybrid"**

**Concept:** Right-click → small command palette at cursor

```
┌─────────────────────────────────────┐
│ Type action...              ⌘K     │
├─────────────────────────────────────┤
│ 🔢 Change Number                   │
│ 🔄 Switch Team                     │
│ 📋 Duplicate                       │
│ 🗑️ Delete                          │
└─────────────────────────────────────┘
```

**Features:**
- Fuzzy search
- Context-filtered suggestions
- Keyboard navigation (↑↓ Enter)
- Falls back to full command palette on ⌘K

**Pros:** Power user friendly, searchable, extensible  
**Cons:** Learning curve, może być slow dla prostych akcji

---

### 4. **"Gesture Hints"**

**Concept:** Menu pokazuje gesture shortcuts

```
┌─────────────────────────────────────────┐
│ 🎽 Player #7                            │
├─────────────────────────────────────────┤
│ 🔢 Change Number      [double-tap]     │
│ 🔄 Switch Team        [drag to team]   │
│ ◼️ Cycle Shape        [rotate icon ⟲]  │
├─────────────────────────────────────────┤
│ 📋 Duplicate          [Alt+drag]       │
│ 🗑️ Delete             [drag to ×]      │
└─────────────────────────────────────────┘
```

**Integration:** Shows mouse gestures, not just keyboard

**Pros:** Teaches multiple interaction methods  
**Cons:** Cluttered, gestures hard to implement reliably

---

### 5. **"Context Bar" (Persistent Alternative)**

**Concept:** Rezygnacja z right-click menu na rzecz persistent context bar

```
Canvas Top:
┌──────────────────────────────────────────────────┐
│ Selected: Player #7 (Home)                       │
│ [🔢 Number] [🔄 Team] [📋 Dup] [⬆️ Front] [🗑️]  │
└──────────────────────────────────────────────────┘
```

**Behavior:**
- Appears at top/bottom when element selected
- Context changes with selection
- Always visible (no right-click needed)
- Can be pinned/unpinned

**Pros:** Always accessible, no right-click needed, clear visibility  
**Cons:** Takes canvas space, redundant with inspector panel

---

## 📊 Comparison Matrix

| Option | Speed | Learning Curve | Innovation | Effort | Mission Fit |
|--------|-------|----------------|------------|--------|-------------|
| 1. Contextual Header | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Medium | ⭐⭐⭐⭐⭐ |
| 2. Radial Menu | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | High | ⭐⭐⭐⭐ |
| 3. Compact Hybrid | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Low | ⭐⭐⭐ |
| 4. Toolbar Inline | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | High | ⭐⭐⭐⭐ |

| Bonus Idea | Innovation | Complexity | Value |
|------------|------------|------------|-------|
| Smart Suggestions | ⭐⭐⭐⭐⭐ | Medium | ⭐⭐⭐⭐ |
| Keyboard Overlay | ⭐⭐⭐ | Low | ⭐⭐⭐⭐⭐ |
| Command Hybrid | ⭐⭐⭐⭐ | Medium | ⭐⭐⭐⭐ |
| Gesture Hints | ⭐⭐⭐⭐ | High | ⭐⭐⭐ |
| Context Bar | ⭐⭐⭐ | Medium | ⭐⭐⭐ |

---

## 🎯 Recommendation

**Primary:** Option 1 (Contextual Header)
- Best balance speed/discoverability
- Familiar pattern
- Easy to implement & maintain
- Perfect mission fit

**With Bonus:** Add "Smart Suggestions" (Idea #1)
- Personalization boost
- Minimal complexity increase
- High wow factor

**Alternative:** Option 4 (Toolbar Inline) IF user feedback shows frustration with traditional right-click

---

## 🔄 Next Steps

1. ✅ Document created with all options
2. ⏳ Await decision from team/user
3. ⏳ Implement chosen option
4. ⏳ Test & iterate based on feedback

---

## 📝 Notes

- All options maintain existing `ContextMenuItem` interface
- Implementation will fix current bugs (element detection, missing handlers)
- Any option can be combined with bonus ideas
- Performance priority: <50ms menu open time

**Last Updated:** 26.01.2026 20:05
