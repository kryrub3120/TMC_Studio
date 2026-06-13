/**
 * EmptyStateOverlay - Shows when board has no elements
 * Provides quick CTAs to get started with animated formation preview
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from './i18n.js';

export interface EmptyStateOverlayProps {
  isVisible: boolean;
  onAddPlayer: () => void;
  onAddBall: () => void;
  onAddArrow: () => void;
  onOpenPalette: () => void;
  /** Show celebration confetti effect (first element added) */
  showCelebration?: boolean;
}

/** Confetti particles for first element celebration */
const CelebrationConfetti: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (isVisible) {
      const colors = ['#2EE6A6', '#e63946', '#457b9d', '#ffd60a', '#f97316'];
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 20,
        color: colors[i % colors.length],
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timer);
    }
    setParticles([]);
  }, [isVisible]);

  if (!isVisible || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full animate-fade-in"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animation: `confettiDrop 1.5s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
};

/** Animated formation preview — subtle 4-3-3 that fades in/out */
const AnimatedFormationPreview: React.FC = () => {
  const [phase, setPhase] = useState(0);
  const players = [
    // GK
    { cx: 50, cy: 85, label: '1', team: 'home' },
    // Defenders (4)
    { cx: 20, cy: 62, label: '2', team: 'home' },
    { cx: 37, cy: 65, label: '4', team: 'home' },
    { cx: 63, cy: 65, label: '5', team: 'home' },
    { cx: 80, cy: 62, label: '3', team: 'home' },
    // Midfielders (3)
    { cx: 30, cy: 42, label: '6', team: 'home' },
    { cx: 50, cy: 38, label: '8', team: 'home' },
    { cx: 70, cy: 42, label: '7', team: 'home' },
    // Forwards (3)
    { cx: 30, cy: 18, label: '11', team: 'home' },
    { cx: 50, cy: 12, label: '9', team: 'home' },
    { cx: 70, cy: 18, label: '10', team: 'home' },
    // Away players
    { cx: 45, cy: 22, label: '9', team: 'away' },
    { cx: 30, cy: 58, label: '4', team: 'away' },
    { cx: 60, cy: 58, label: '5', team: 'away' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((p) => (p + 1) % 3);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.06] dark:opacity-[0.08]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Pitch outline */}
        <rect x="5" y="5" width="90" height="90" rx="3" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="0.3" />
        {/* Goal areas */}
        <rect x="30" y="5" width="40" height="15" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <rect x="30" y="80" width="40" height="15" fill="none" stroke="currentColor" strokeWidth="0.3" />

        {/* Players with fade animation */}
        {players.map((p, i) => {
          const opacity = phase === 0 ? 1 : phase === 1 ? 0.4 + (i % 3) * 0.3 : 0.7 - (i % 2) * 0.3;
          const isHome = p.team === 'home';
          const r = phase === 2 ? 3.2 : 2.8;
          return (
            <g key={i} style={{ transition: 'all 0.8s ease-in-out', opacity }}>
              <circle cx={p.cx} cy={p.cy} r={r} fill={isHome ? '#e63946' : '#457b9d'} />
              <text x={p.cx} y={p.cy + 0.8} textAnchor="middle" fill="#fff" fontSize="2.5" fontWeight="bold">
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Empty state card with quick actions
 * Shows when elements.length === 0
 */
export const EmptyStateOverlay: React.FC<EmptyStateOverlayProps> = ({
  isVisible,
  onAddPlayer,
  onAddBall,
  onAddArrow,
  onOpenPalette,
  showCelebration,
}) => {
  const { t } = useTranslation();

  if (!isVisible && !showCelebration) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      {/* Celebration confetti on first element */}
      <CelebrationConfetti isVisible={!!showCelebration && !isVisible} />

      {/* Animated formation preview (only when empty) */}
      {isVisible && <AnimatedFormationPreview />}

      {isVisible && (
      <div className="bg-surface/90 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl p-8 max-w-md pointer-events-auto animate-slide-up">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-text mb-2">
            {t('emptyState.title')}
          </h2>
          <p className="text-sm text-muted">
            {t('emptyState.subtitle')}
          </p>
        </div>

        {/* Quick CTAs */}
        <div className="space-y-3 mb-4">
          <button
            onClick={onAddPlayer}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg bg-surface2 border border-border hover:border-accent hover:bg-accent/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
              <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="7" r="4" />
                <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-text">{t('emptyState.addPlayer')}</div>
              <div className="text-xs text-muted">{t('emptyState.addPlayerHint')}</div>
            </div>
            <kbd className="px-2 py-1 rounded bg-surface border border-border text-xs text-accent font-mono">
              P
            </kbd>
          </button>

          <button
            onClick={onAddBall}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg bg-surface2 border border-border hover:border-accent hover:bg-accent/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
              <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-text">{t('emptyState.addBall')}</div>
              <div className="text-xs text-muted">{t('emptyState.addBallHint')}</div>
            </div>
            <kbd className="px-2 py-1 rounded bg-surface border border-border text-xs text-accent font-mono">
              B
            </kbd>
          </button>

          <button
            onClick={onAddArrow}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg bg-surface2 border border-border hover:border-accent hover:bg-accent/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
              <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-text">{t('emptyState.addArrow')}</div>
              <div className="text-xs text-muted">{t('emptyState.addArrowHint')}</div>
            </div>
            <kbd className="px-2 py-1 rounded bg-surface border border-border text-xs text-accent font-mono">
              A
            </kbd>
          </button>
        </div>

        {/* Secondary CTA */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={onOpenPalette}
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border hover:border-accent hover:bg-accent/5 transition-all text-sm text-text flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8m-4-4h8" />
            </svg>
            <span>{t('emptyState.commandPalette')}</span>
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-surface2 border border-border text-xs text-muted font-mono">
              ⌘K
            </kbd>
          </button>
        </div>
        </div>
      )}
    </div>
  );
};

export default EmptyStateOverlay;
