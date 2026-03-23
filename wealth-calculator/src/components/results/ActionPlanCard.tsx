import type { Tier1Inputs, Tier2Inputs, ActionItem } from '../../types';
import { useActionPlan } from '../../hooks/useCortex';

interface ActionPlanCardProps {
  tier1: Tier1Inputs;
  tier2: Tier2Inputs;
}

const BADGE_COLORS: Record<number, { bg: string; text: string }> = {
  1: {
    bg: 'bg-accent-blue/10 dark:bg-accent-blue-dark/10',
    text: 'text-accent-blue dark:text-accent-blue-dark',
  },
  2: {
    bg: 'bg-accent-amber/10 dark:bg-accent-amber-dark/10',
    text: 'text-accent-amber dark:text-accent-amber-dark',
  },
  3: {
    bg: 'bg-accent-emerald/10 dark:bg-accent-emerald-dark/10',
    text: 'text-accent-emerald dark:text-accent-emerald-dark',
  },
};

function SparkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="
        bg-surface dark:bg-surface-dark
        border border-border dark:border-border-dark
        border-l-4 border-l-accent-blue dark:border-l-accent-blue-dark
        rounded-xl p-6 shadow-sm
      "
    >
      <div className="animate-pulse space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-surface-raised dark:bg-surface-dark-raised flex-shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-surface-raised dark:bg-surface-dark-raised rounded w-40" />
            <div className="h-3 bg-surface-raised dark:bg-surface-dark-raised rounded w-64" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-raised dark:bg-surface-dark-raised flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-surface-raised dark:bg-surface-dark-raised rounded w-44" />
              <div className="h-3 bg-surface-raised dark:bg-surface-dark-raised rounded w-full" />
              <div className="h-3 bg-surface-raised dark:bg-surface-dark-raised rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted dark:text-text-muted-dark mt-5">
        Analyzing your financial profile with Cortex AI...
      </p>
    </div>
  );
}

export function ActionPlanCard({ tier1, tier2 }: ActionPlanCardProps) {
  const { data, loading, error, fetchPlan } = useActionPlan();

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div
        className="
          bg-surface dark:bg-surface-dark
          border border-border dark:border-border-dark
          border-l-4 border-l-accent-rose dark:border-l-accent-rose-dark
          rounded-xl p-6 shadow-sm text-center
        "
      >
        <p className="text-sm font-medium text-accent-rose dark:text-accent-rose-dark">
          Unable to generate recommendations
        </p>
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1">{error}</p>
        <button
          onClick={() => fetchPlan(tier1, tier2)}
          className="mt-4 px-4 py-1.5 rounded-lg text-xs font-medium bg-accent-blue dark:bg-accent-blue-dark text-white hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    );
  }

  // Success state — show results with regenerate button
  if (data && data.actions.length > 0) {
    return (
      <div
        className="
          bg-surface dark:bg-surface-dark
          border border-border dark:border-border-dark
          border-l-4 border-l-accent-blue dark:border-l-accent-blue-dark
          rounded-xl p-6 shadow-sm
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-3">
            <SparkleIcon className="text-accent-blue dark:text-accent-blue-dark flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark leading-tight">
                Your Action Plan
              </h2>
              <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">
                Powered by Snowflake Cortex AI · based on your profile + live economic data
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchPlan(tier1, tier2)}
            className="
              flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
              text-text-secondary dark:text-text-secondary-dark
              hover:bg-surface-raised dark:hover:bg-surface-dark-raised
              border border-border dark:border-border-dark
              transition-colors flex-shrink-0
            "
          >
            ↻ Regenerate
          </button>
        </div>

        {/* Action items */}
        <div className="space-y-5">
          {data.actions.map((action: ActionItem) => {
            const colors = BADGE_COLORS[action.priority] ?? BADGE_COLORS[3];
            return (
              <div key={action.priority} className="flex gap-3">
                <div
                  className={`
                    w-8 h-8 rounded-full flex-shrink-0
                    flex items-center justify-center
                    text-sm font-bold font-mono
                    ${colors.bg} ${colors.text}
                  `}
                >
                  {action.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                    {action.title}
                  </h3>
                  <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1 leading-relaxed">
                    {action.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-text-muted dark:text-text-muted-dark mt-5 pt-4 border-t border-border dark:border-border-dark">
          {data.disclaimer}
        </p>
      </div>
    );
  }

  // Initial state — prompt user to ask AI (NO auto-fetch)
  return (
    <div
      className="
        bg-surface dark:bg-surface-dark
        border border-border dark:border-border-dark
        border-l-4 border-l-accent-blue dark:border-l-accent-blue-dark
        rounded-xl p-6 shadow-sm
      "
    >
      <div className="flex items-start gap-3 mb-4">
        <SparkleIcon className="text-accent-blue dark:text-accent-blue-dark flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark leading-tight">
            AI-Powered Action Plan
          </h2>
          <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">
            Get 3 personalized wealth-building recommendations based on your profile and live economic data from FRED.
          </p>
        </div>
      </div>
      <button
        onClick={() => fetchPlan(tier1, tier2)}
        className="
          w-full py-2.5 rounded-lg text-sm font-medium
          bg-accent-blue dark:bg-accent-blue-dark text-white
          hover:opacity-90 transition-opacity
          flex items-center justify-center gap-2
        "
      >
        <SparkleIcon className="text-white w-4 h-4" />
        Generate My Action Plan
      </button>
    </div>
  );
}
