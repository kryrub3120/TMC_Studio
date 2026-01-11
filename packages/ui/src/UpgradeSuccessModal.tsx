/**
 * Upgrade Success Modal - Celebration after successful upgrade
 * Shows confetti and highlights new Pro features
 */

interface UpgradeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: 'pro' | 'team';
}

const proFeatures = [
  { icon: '📦', text: 'Unlimited projects' },
  { icon: '🎬', text: 'Export animated GIFs' },
  { icon: '📄', text: 'Export multi-page PDFs' },
  { icon: '♾️', text: 'Unlimited steps' },
  { icon: '☁️', text: 'Cloud sync & backup' },
  { icon: '⚡', text: 'Priority support' },
];

const teamFeatures = [
  { icon: '⚡', text: 'Everything in Pro' },
  { icon: '👥', text: '5 team member seats' },
  { icon: '💳', text: 'Centralized billing' },
  { icon: '📚', text: 'Coming: Shared library' },
];

export function UpgradeSuccessModal({
  isOpen,
  onClose,
  plan,
}: UpgradeSuccessModalProps) {
  if (!isOpen) return null;

  const features = plan === 'team' ? teamFeatures : proFeatures;
  const planName = plan === 'team' ? 'Team' : 'Pro';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a2e] rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-white/10">
        {/* Confetti Background Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <div className="absolute top-10 right-1/4 w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-20 left-1/3 w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-5 right-1/3 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative p-8 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 mb-6 animate-bounce">
            <span className="text-4xl">🎉</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to {planName}!
          </h2>
          <p className="text-gray-400 mb-6">
            Your account has been upgraded successfully
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <span className="text-xl">{feature.icon}</span>
                <span className="text-sm text-gray-300 text-left">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Start Creating! 🚀
          </button>

          <p className="mt-4 text-xs text-gray-500">
            All features are now unlocked and ready to use
          </p>
        </div>
      </div>
    </div>
  );
}
