import { useEconomicBriefing } from '../../hooks/useCortex';
import { CortexBadge } from '../shared/CortexBadge';

function SkeletonLine({ width }: { width: string }) {
  return (
    <div
      className="h-2.5 rounded bg-border dark:bg-border-dark animate-pulse"
      style={{ width }}
    />
  );
}

export function EconomicBriefing() {
  const { data, loading, error, refetch } = useEconomicBriefing();

  if (loading) {
    return (
      <div className="
        bg-surface dark:bg-surface-dark
        border border-border dark:border-border-dark
        rounded-lg px-4 py-3
      ">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-3.5 h-3.5 rounded bg-border dark:bg-border-dark animate-pulse" />
          <div className="h-2 w-24 rounded bg-border dark:bg-border-dark animate-pulse" />
        </div>
        <div className="space-y-2">
          <SkeletonLine width="100%" />
          <SkeletonLine width="92%" />
          <SkeletonLine width="78%" />
        </div>
      </div>
    );
  }

  if (error || !data) return null; // silent fail — non-critical

  // Format data date: "2025-12-01" -> "Dec 2025"
  const formattedDate = (() => {
    if (!data.dataDate) return '';
    try {
      const d = new Date(data.dataDate + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return data.dataDate;
    }
  })();

  return (
    <div className="
      bg-surface dark:bg-surface-dark
      border border-border dark:border-border-dark
      rounded-lg px-4 py-3
    ">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          {/* Sparkle / AI icon */}
          <span
            className="text-accent-violet dark:text-accent-violet-dark text-sm mt-0.5 shrink-0"
            aria-hidden="true"
          >
            ✦
          </span>
          <div className="min-w-0">
            <p className="text-xs text-text-secondary dark:text-text-secondary-dark leading-relaxed">
              {data.briefing}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <CortexBadge size="sm" />
              {formattedDate && (
                <span className="text-[10px] text-text-muted dark:text-text-muted-dark">
                  · {formattedDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={refetch}
          className="
            shrink-0 text-xs text-text-muted dark:text-text-muted-dark
            hover:text-text-secondary dark:hover:text-text-secondary-dark
            transition-colors duration-150 mt-0.5
          "
          aria-label="Refresh economic briefing"
          title="Refresh"
        >
          ↺
        </button>
      </div>
    </div>
  );
}
