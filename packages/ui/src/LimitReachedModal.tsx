/**
 * Limit Reached Modal - Explain limits and guide user to next step
 * TMC Studio - Product-Led Growth UX
 */

import { useMemo } from 'react';

type LimitType =
  | 'guest-step'
  | 'guest-project'
  | 'free-step'
  | 'free-project';

interface LimitReachedModalProps {
  isOpen: boolean;
  type: LimitType;
  currentCount: number;
  maxCount: number;
  onSignup: () => void;
  onUpgrade: () => void;
  onClose: () => void;
  onSeePlans: () => void;
}

export function LimitReachedModal({
  isOpen,
  type,
  currentCount,
  maxCount,
  onSignup,
  onUpgrade,
  onClose,
  onSeePlans,
}: LimitReachedModalProps) {
  const content = useMemo(() => {
    const isGuest = type.startsWith('guest');
    const isStep = type.includes('step');
    const resourceName = isStep ? 'steps' : 'projects';
    const resourceNameSingular = isStep ? 'step' : 'project';
    
    // Mikro-kontekst: co dokładnie user zrobił
    const context = currentCount === 1 
      ? `You already have ${currentCount} ${resourceNameSingular} — Guest mode allows only one.`
      : `You've added ${currentCount} ${resourceName} — that's the Guest limit.`;
    
    const freeContext = currentCount === 1
      ? `You already have ${currentCount} ${resourceNameSingular} — Free plan allows ${maxCount}.`
      : `You've created ${currentCount} ${resourceName} — that's the Free plan limit.`;
    
    if (isGuest) {
      return {
        emoji: '🚀',
        title: "You've reached the Guest limit",
        context,
        description: "You're using TMC Studio without an account. Create a free account to keep building and save your work.",
        benefits: [
          'Up to 3 projects',
          '10 steps per project',
          'Cloud sync & backup',
          'PNG export',
        ],
        primaryCTA: 'Continue for free',
        primaryAction: onSignup,
        progressLabel: 'Guest usage',
      };
    } else {
      return {
        emoji: '⭐',
        title: 'Free plan limit reached',
        context: freeContext,
        description: "You've reached the limit of the Free plan. Upgrade to Pro to continue without restrictions.",
        benefits: [
          'Unlimited projects',
          'Unlimited steps',
          'GIF & PDF export',
          'Priority support',
        ],
        primaryCTA: 'Upgrade to Pro',
        primaryAction: onUpgrade,
        progressLabel: 'Free plan',
      };
    }
  }, [type, currentCount, maxCount, onSignup, onUpgrade]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a2e] rounded-xl shadow-2xl w-full max-w-md mx-4 border border-white/10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Emoji */}
          <div className="text-5xl mb-4">{content.emoji}</div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3">
            {content.title}
          </h2>
          
          {/* Mikro-kontekst: co user zrobił */}
          <p className="text-gray-300 text-sm mb-4 font-medium">
            {content.context}
          </p>
          
          {/* Progress indicator */}
          <div className="mb-6 px-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span>{content.progressLabel}</span>
              <span className="font-mono font-semibold">{currentCount} / {maxCount}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 rounded-full"
                style={{ width: `${(currentCount / maxCount) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Description */}
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            {content.description}
          </p>
          
          {/* Benefits */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              What you get:
            </p>
            <ul className="space-y-2">
              {content.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-white text-sm">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* CTAs */}
          <div className="space-y-3">
            {/* Primary CTA */}
            <button
              onClick={content.primaryAction}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              {content.primaryCTA}
            </button>
            
            {/* Secondary CTA */}
            <button
              onClick={onSeePlans}
              className="w-full px-6 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Compare plans
            </button>
            
            {/* Microcopy - reassuring */}
            <p className="text-xs text-gray-500 text-center pt-1">
              Free stays free forever. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
