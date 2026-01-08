/**
 * Welcome Overlay - Landing/marketing screen for new visitors
 * Shows features and encourages sign up
 */

import { useState } from 'react';

interface WelcomeOverlayProps {
  isVisible: boolean;
  onGetStarted: () => void;
  onSignIn: () => void;
  onDismiss: () => void;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: '⚽',
    title: 'Tactical Board',
    description: 'Create professional football tactics with drag & drop players, arrows, and zones',
  },
  {
    icon: '🎬',
    title: 'Animation',
    description: 'Animate your plays step-by-step with smooth transitions and export as GIF',
  },
  {
    icon: '📱',
    title: 'Multi-Sport',
    description: 'Football, basketball, hockey, rugby - switch sports instantly',
  },
  {
    icon: '☁️',
    title: 'Cloud Sync',
    description: 'Save to cloud, access from anywhere, collaborate with your team',
  },
  {
    icon: '📤',
    title: 'Export Pro',
    description: 'Export PNG, PDF, GIF, SVG - perfect for presentations and analysis',
  },
  {
    icon: '⌨️',
    title: 'Keyboard First',
    description: 'Command palette (⌘K) and shortcuts for blazing fast workflow',
  },
];

export function WelcomeOverlay({
  isVisible,
  onGetStarted,
  onSignIn,
  onDismiss,
}: WelcomeOverlayProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
      {/* Backdrop with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg to-accent/20" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative max-w-5xl w-full">
        {/* Skip button */}
        <button
          onClick={onDismiss}
          className="absolute -top-2 right-0 p-2 text-muted hover:text-text transition-colors"
        >
          <span className="text-sm">Skip intro →</span>
        </button>

        {/* Hero */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent/60 shadow-lg shadow-accent/30 mb-6">
            <span className="text-4xl">⚽</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            TMC Studio
          </h1>
          
          <p className="text-xl text-muted max-w-2xl mx-auto mb-2">
            Professional tactical board for coaches and analysts
          </p>
          
          <p className="text-accent font-medium">
            Create • Animate • Share
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`p-5 rounded-xl transition-all duration-300 cursor-default ${
                hoveredFeature === index
                  ? 'bg-accent/10 border-accent/30 scale-105'
                  : 'bg-surface/50 border-border/50'
              } border backdrop-blur-sm`}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-text mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl shadow-lg shadow-accent/30 transition-all hover:scale-105 active:scale-95 min-w-[200px]"
          >
            Create Free Account
          </button>
          
          <button
            onClick={onSignIn}
            className="px-8 py-4 bg-surface hover:bg-surface2 border border-border text-text font-medium rounded-xl transition-all min-w-[200px]"
          >
            Sign In
          </button>
          
          <button
            onClick={onDismiss}
            className="px-8 py-4 text-muted hover:text-text transition-colors"
          >
            Try without account
          </button>
        </div>

        {/* Social proof */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted mb-3">Trusted by coaches worldwide</p>
          <div className="flex items-center justify-center gap-6 text-muted/50">
            <span className="text-xs">⭐ 4.9/5 rating</span>
            <span className="text-xs">•</span>
            <span className="text-xs">10,000+ tactics created</span>
            <span className="text-xs">•</span>
            <span className="text-xs">Free forever plan</span>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted">
            Press <kbd className="px-2 py-0.5 bg-surface rounded text-text">Space</kbd> to dismiss
          </p>
        </div>
      </div>
    </div>
  );
}
