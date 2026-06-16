/**
 * helpFaqData - FAQ data for HelpSidebar
 * Role-aware: categories and questions filtered per plan (guest/free/pro/team)
 */

import type { Plan } from './tutorialSteps.js';

export interface FaqCta {
  labelKey: string;
  action: 'pricing' | 'teamPanel' | 'settings' | 'export' | 'save' | 'signup';
}

export interface FaqItem {
  id: string;
  questionKey: string;
  answerKey: string;
  /** Optional CTA button at the bottom of the answer */
  cta?: FaqCta;
  /** Only show for these plans. Omit = show for all. */
  visibleForPlans?: Plan[];
}

export interface FaqCategory {
  id: string;
  titleKey: string;
  icon: string;
  /** Which plans see this category. Omit = show for all. */
  visibleForPlans?: Plan[];
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  // ─── Getting Started ─────────────────────────────────────────────
  {
    id: 'getting-started',
    titleKey: 'faq.categories.gettingStarted',
    icon: '🚀',
    visibleForPlans: ['guest', 'free'],
    items: [
      {
        id: 'add-player',
        questionKey: 'faq.items.addPlayer.question',
        answerKey: 'faq.items.addPlayer.answer',
      },
      {
        id: 'add-arrow',
        questionKey: 'faq.items.addArrow.question',
        answerKey: 'faq.items.addArrow.answer',
      },
      {
        id: 'save-project',
        questionKey: 'faq.items.saveProject.question',
        answerKey: 'faq.items.saveProject.answer',
        cta: { labelKey: 'faq.items.saveProject.cta', action: 'save' },
      },
      {
        id: 'free-plan',
        questionKey: 'faq.items.freePlan.question',
        answerKey: 'faq.items.freePlan.answer',
        cta: { labelKey: 'faq.items.freePlan.cta', action: 'pricing' },
      },
    ],
  },

  // ─── Pro Features ────────────────────────────────────────────────
  {
    id: 'pro-features',
    titleKey: 'faq.categories.proFeatures',
    icon: '⭐',
    visibleForPlans: ['free', 'pro', 'team'],
    items: [
      {
        id: 'export-gif-pdf',
        questionKey: 'faq.items.exportGifPdf.question',
        answerKey: 'faq.items.exportGifPdf.answer',
        visibleForPlans: ['free'],
        cta: { labelKey: 'faq.items.exportGifPdf.cta', action: 'pricing' },
      },
      {
        id: 'unlimited-projects',
        questionKey: 'faq.items.unlimitedProjects.question',
        answerKey: 'faq.items.unlimitedProjects.answer',
        visibleForPlans: ['free'],
        cta: { labelKey: 'faq.items.unlimitedProjects.cta', action: 'pricing' },
      },
      {
        id: 'manage-subscription',
        questionKey: 'faq.items.manageSubscription.question',
        answerKey: 'faq.items.manageSubscription.answer',
        visibleForPlans: ['pro', 'team'],
        cta: { labelKey: 'faq.items.manageSubscription.cta', action: 'settings' },
      },
      {
        id: 'squad-slots',
        questionKey: 'faq.items.squadSlots.question',
        answerKey: 'faq.items.squadSlots.answer',
        visibleForPlans: ['free'],
        cta: { labelKey: 'faq.items.squadSlots.cta', action: 'pricing' },
      },
    ],
  },

  // ─── Club Premium ────────────────────────────────────────────────
  {
    id: 'club-premium',
    titleKey: 'faq.categories.clubPremium',
    icon: '👥',
    visibleForPlans: ['team'],
    items: [
      {
        id: 'add-members',
        questionKey: 'faq.items.addMembers.question',
        answerKey: 'faq.items.addMembers.answer',
        cta: { labelKey: 'faq.items.addMembers.cta', action: 'teamPanel' },
      },
      {
        id: 'manage-billing',
        questionKey: 'faq.items.manageBilling.question',
        answerKey: 'faq.items.manageBilling.answer',
        cta: { labelKey: 'faq.items.manageBilling.cta', action: 'settings' },
      },
      {
        id: 'remove-member',
        questionKey: 'faq.items.removeMember.question',
        answerKey: 'faq.items.removeMember.answer',
      },
    ],
  },

  // ─── Troubleshooting ─────────────────────────────────────────────
  {
    id: 'troubleshooting',
    titleKey: 'faq.categories.troubleshooting',
    icon: '🔧',
    items: [
      {
        id: 'save-failed',
        questionKey: 'faq.items.saveFailed.question',
        answerKey: 'faq.items.saveFailed.answer',
        cta: { labelKey: 'faq.items.saveFailed.cta', action: 'save' },
      },
      {
        id: 'changes-not-visible',
        questionKey: 'faq.items.changesNotVisible.question',
        answerKey: 'faq.items.changesNotVisible.answer',
      },
      {
        id: 'export-not-working',
        questionKey: 'faq.items.exportNotWorking.question',
        answerKey: 'faq.items.exportNotWorking.answer',
      },
    ],
  },

  // ─── Account & Billing ───────────────────────────────────────────
  {
    id: 'account-billing',
    titleKey: 'faq.categories.accountBilling',
    icon: '⚙️',
    items: [
      {
        id: 'change-plan',
        questionKey: 'faq.items.changePlan.question',
        answerKey: 'faq.items.changePlan.answer',
        cta: { labelKey: 'faq.items.changePlan.cta', action: 'pricing' },
      },
      {
        id: 'cancel-subscription',
        questionKey: 'faq.items.cancelSubscription.question',
        answerKey: 'faq.items.cancelSubscription.answer',
        visibleForPlans: ['pro', 'team'],
        cta: { labelKey: 'faq.items.cancelSubscription.cta', action: 'settings' },
      },
      {
        id: 'guest-register',
        questionKey: 'faq.items.guestRegister.question',
        answerKey: 'faq.items.guestRegister.answer',
        visibleForPlans: ['guest'],
        cta: { labelKey: 'faq.items.guestRegister.cta', action: 'signup' },
      },
    ],
  },
];

/**
 * Get FAQ categories filtered by plan.
 * Categories/questions with no visibleForPlans are shown to everyone.
 */
export function getFaqForPlan(plan: Plan): FaqCategory[] {
  return FAQ_CATEGORIES
    .filter((cat) => !cat.visibleForPlans || cat.visibleForPlans.includes(plan))
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) => !item.visibleForPlans || item.visibleForPlans.includes(plan)
      ),
    }))
    .filter((cat) => cat.items.length > 0);
}

/**
 * Search FAQ by query string (matches question + answer keys via i18n).
 * Returns filtered categories with matching items.
 */
export function searchFaq(
  categories: FaqCategory[],
  query: string
): FaqCategory[] {
  if (!query.trim()) return categories;
  const q = query.toLowerCase();
  return categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.questionKey.toLowerCase().includes(q) ||
          item.answerKey.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
      ),
    }))
    .filter((cat) => cat.items.length > 0);
}