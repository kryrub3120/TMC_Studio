# TMC Studio - Documentation Index

Start tutaj! Ten dokument to Twój przewodnik po całej dokumentacji projektu TMC Studio.

---

## 🚀 Quick Start

### Jestem nowym developerem
1. 📖 **[Product Philosophy](PRODUCT_PHILOSOPHY.md)** - Dlaczego budujemy to tak
2. 🏗️ **[Architecture Overview](ARCHITECTURE_OVERVIEW.md)** - Jak system działa
3. 📋 **[Modular Architecture Strategy](MODULAR_ARCHITECTURE_STRATEGY.md)** - Kierunek rozwoju
4. 🎯 **[Module Boundaries](MODULE_BOUNDARIES.md)** - Gdzie dodać nowy kod

### Pracuję nad nowym feature
1. 📋 **[Module Boundaries](MODULE_BOUNDARIES.md)** - Znajdź odpowiedni moduł
2. 🗺️ **[Refactor Roadmap](REFACTOR_ROADMAP.md)** - Sprawdź plan refaktoryzacji
3. 📐 **[Project Rules](../.github/copilot-instructions.md)** - Hard rules

### Pracuję nad refaktoryzacją
1. 📋 **[Refactor Roadmap](REFACTOR_ROADMAP.md)** - Plan implementacji
2. 📐 **[Modular Architecture Strategy](MODULAR_ARCHITECTURE_STRATEGY.md)** - Zasady i anti-patterny
3. 🎯 **[Module Boundaries](MODULE_BOUNDARIES.md)** - Kontrakty modułów

---

## 📚 Core Documentation

### Architecture & Design

| Document | Purpose | Audience |
|----------|---------|----------|
| **[Architecture Overview](ARCHITECTURE_OVERVIEW.md)** | System architecture, data flow, component patterns | All developers |
| **[Modular Architecture Strategy](MODULAR_ARCHITECTURE_STRATEGY.md)** | Strategy rozwoju modułowego, zasady, anti-patterny | Tech leads, całyteam |
| **[Module Boundaries](MODULE_BOUNDARIES.md)** | Granice modułów, publiczne API, kontrakty | Feature developers |
| **[System Architecture](SYSTEM_ARCHITECTURE.md)** | Infrastructure, deployment, backend | DevOps, backend |
| **[Data Model](DATA_MODEL.md)** | Database schema, types, relations | Backend, full-stack |

### Development

| Document | Purpose | Audience |
|----------|---------|----------|
| **[Refactor Roadmap](REFACTOR_ROADMAP.md)** | Detailed refactoring plan with PRs | Active contributors |
| **[Project Rules](../.github/copilot-instructions.md)** | Binding development rules (PR0) | All developers |
| **[Drag Drop Pattern](DRAG_DROP_PATTERN.md)** | Canvas interaction patterns | Frontend |
| **[UX Patterns](UX_PATTERNS.md)** | Modal flows, user journeys | Frontend, UX |
| **[Commands Map](COMMANDS_MAP.md)** | Command palette structure | Frontend |

### Business Logic

| Document | Purpose | Audience |
|----------|---------|----------|
| **[Entitlements](ENTITLEMENTS.md)** | Permission system, plan gating | Full-stack |
| **[Monetization Plan](MONETIZATION_PLAN.md)** | Pricing, subscription tiers | Product, business |
| **[Payment Foundation](PAYMENT_FOUNDATION.md)** | Stripe integration, webhooks | Backend, billing |

---

## 🔧 Feature Modules Documentation

### Board & Canvas
- **[Drag Drop Pattern](DRAG_DROP_PATTERN.md)** - Multi-selection, multi-drag
- **[Commands Map](COMMANDS_MAP.md)** - Board commands structure
- **Module Status:** ⏳ Partial (hooks extracted, needs vm/cmd)

### Animation
- **Module Status:** ❌ TODO (PR-REFACTOR-8)
- **Roadmap:** [PR-REFACTOR-8](REFACTOR_ROADMAP.md#pr-refactor-8-animation-module)

### Projects & Cloud Sync
- **[Autosave and Project Organization](AUTOSAVE_AND_PROJECT_ORGANIZATION.md)**
- **Module Status:** ✅ Done (`useProjectsController`)

### Billing & Subscriptions
- **[Payment Foundation](PAYMENT_FOUNDATION.md)**
-  **[Webhook Test Mode Setup](WEBHOOK_TEST_MODE_SETUP.md)**
- **Module Status:** ✅ Done (`useBillingController`)

### Account & Settings
- **[Settings Integration Plan](SETTINGS_INTEGRATION_PLAN.md)**
- **Module Status:** ✅ Done (`useSettingsController`)

---

## 📖 Completed Features (Historical PRs)

### Payment & Billing
- **[PR-PAY-1](PR-PAY-1-COMPLETE.md)** - Stripe integration foundation
- **[PR-PAY-2](PR-PAY-2-COMPLETE.md)** - Checkout flow
- **[PR-PAY-3](PR-PAY-3-COMPLETE.md)** - Webhook handling
- **[PR-PAY-4](PR-PAY-4-COMPLETE.md)** - Portal session
- **[PR-PAY-5](PR-PAY-5-COMPLETE.md)** - Subscription management
- **[PR-PAY-6](PR-PAY-6-SUBSCRIPTION-REFRESH-FIX.md)** - Real-time subscription refresh

### UX & Polish
- **[PR-UX-1](PR-UX-1-GUEST-LOGIN-SYNC.md)** - Guest/login flow
- **[PR-UX-2](PR-UX-2-LAYER-CONTROL.md)** - Layer visibility controls
- **[PR-UX-3](PR-UX-3-UNIFIED-COLOR-SHORTCUTS.md)** - Color cycling shortcuts
- **[PR-UX-5](PR-UX-5-CONTEXT-MENU-DESIGN.md)** - Canvas context menu

### Refactoring
- **[PR-REFACTOR-1](PR-REFACTOR-1-KEYBOARD-SHORTCUTS-CHECKLIST.md)** - Keyboard shortcuts extraction
- **[PR-REFACTOR-Production-Ready](PR-REFACTOR-PRODUCTION-READY-PLAN.md)** - Initial refactoring plan

### Animation Module
- **[S2 Animation Module Plan](S2_ANIMATION_MODULE_PLAN.md)** - Original animation spec
- **[Animation Code Review](ANIMATION_MODULE_CODE_REVIEW_RESULTS.md)** - Implementation review
- **[Animation UX Polish](ANIMATION_MODULE_UX_POLISH_COMPLETE.md)** - Final polish

---

## 🎯 Product & Planning

### Vision & Strategy
- **[Product Philosophy](PRODUCT_PHILOSOPHY.md)** - Core principles
- **[Roadmap](ROADMAP.md)** - Feature roadmap
- **[Master Development Plan](MASTER_DEVELOPMENT_PLAN.md)** - Long-term plan
- **[Modules](MODULES.md)** - Module breakdown

### Testing & Quality
- **[Beta Testing Plan](BETA_TESTING_PLAN.md)** - Beta program
- **[PR Guest1 QA Checklist](PR_GUEST1_QA_CHECKLIST.md)** - Guest flow QA
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checks

### Team & MVP
- **[Team MVP](TEAM_MVP.md)** - MVP features for team tier
- **[Telemetry](TELEMETRY.md)** - Analytics & tracking

---

## 🔍 Finding the Right Document

### "Jak dodać nowy element board?"
→ **[Module Boundaries](MODULE_BOUNDARIES.md)** (BoardModule)  
→ **[DragDrop Pattern](DRAG_DROP_PATTERN.md)**

### "Jak zaimplementować nowy export format?"
→ **[Module Boundaries](MODULE_BOUNDARIES.md)** (UIModule/ExportCommands)  
→ **[Refactor Roadmap](REFACTOR_ROADMAP.md)** (PR-REFACTOR-10)

### "Jak działa autosave?"
→ **[Architecture Overview](ARCHITECTURE_OVERVIEW.md)** (Services Layer)  
→ **[Autosave and Project Organization](AUTOSAVE_AND_PROJECT_ORGANIZATION.md)**

### "Jak zrobić feature pro-only?"
→ **[Entitlements](ENTITLEMENTS.md)**  
→ **[Architecture Overview](ARCHITECTURE_OVERVIEW.md)** (Entitlements System)

### "Jak zaimplementować nowy subscription tier?"
→ **[Monetization Plan](MONETIZATION_PLAN.md)**  
→ **[Payment Foundation](PAYMENT_FOUNDATION.md)**

### "App.tsx jest za duży, co robić?"
→ **[Modular Architecture Strategy](MODULAR_ARCHITECTURE_STRATEGY.md)**  
→ **[Refactor Roadmap](REFACTOR_ROADMAP.md)**  
→ **[Module Boundaries](MODULE_BOUNDARIES.md)**

---

## 📝 Document Status

### ✅ Aktualny (Current)
- Architecture Overview
- **Modular Architecture Strategy** (NEW)
- **Module Boundaries** (NEW)
- **Refactor Roadmap** (NEW)
- Entitlements
- Product Philosophy
- Project Rules (.github/copilot-instructions.md)

### ⚠️ Wymaga aktualizacji
- System Architecture (dodać info o modułach)
- Modules (zaktualizować o nową strukturę)
- Master Development Plan (zsynchronizować z Roadmap)

### 📦 Archiwalny (Historical)
- PR-PAY-* (completed PRs - reference only)
- PR-UX-* (completed PRs - reference only)
- Animation Module Code Review (completed feature)

---

## 🚦 Status Conventions

| Status | Meaning |
|--------|---------|
| ✅ Done | Feature/PR complete, in production |
| 🔄 NEXT | Currently in progress or next up |
| ⏳ Partial | Started but not complete |
| ❌ TODO | Not started, planned |
| 📦 Archive | Historical, reference only |
| ⚠️ Needs Update | Document exists but outdated |

---

## 🤝 Contributing to Documentation

### Kiedy aktualizować docs?

**ZAWSZE zaktualizuj po:**
- Dodaniu nowego modułu → MODULE_BOUNDARIES.md
- Zakończeniu PR refaktoryzacyjnego → REFACTOR_ROADMAP.md
- Zmianie architektury → ARCHITECTURE_OVERVIEW.md
- Dodaniu nowego entitlement → ENTITLEMENTS.md

**NIGDY nie:**
- Commituj bez update docs (jeśli zmiana architekturalna)
- Twórz nowych docs bez dodania do INDEX.md
- Duplikuj informacji między dokumentami

### Doc writing guidelines

1. **Markdown formatting:**
   - Use headers (H2, H3) for structure
   - Code blocks with language tags
   - Tables for comparisons

2. **Keep it current:**
   - Add "Last Updated" date
   - Mark as archived if obsolete
   - Link to related docs

3. **Be concise:**
   - Developers scan, not read
   - Use bullets and tables
   - Code examples > long explanations

---

## 📞 Questions?

- **Architecture questions:** Check ARCHITECTURE_OVERVIEW.md + MODULAR_ARCHITECTURE_STRATEGY.md
- **"Where do I put this code?":** MODULE_BOUNDARIES.md
- **"How do I refactor this?":** REFACTOR_ROADMAP.md
- **"What are the rules?":** ../.github/copilot-instructions.md

---

**Last Updated:** 2026-01-27  
**Maintained by:** Development Team  
**Review Frequency:** Monthly or after major architecture changes
