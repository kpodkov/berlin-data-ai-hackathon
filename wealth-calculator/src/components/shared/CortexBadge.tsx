/**
 * Reusable "Powered by Snowflake Cortex AI" badge.
 * Use size="sm" for inline/compact, "md" for cards.
 */

interface CortexBadgeProps {
  size?: 'sm' | 'md'
}

function SnowflakeIcon({ size = 12 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    </svg>
  )
}

export function CortexBadge({ size = 'sm' }: CortexBadgeProps) {
  if (size === 'sm') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-accent-violet dark:text-accent-violet-dark opacity-80">
        <SnowflakeIcon size={10} />
        Snowflake Cortex AI
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-violet/10 dark:bg-accent-violet-dark/10 text-accent-violet dark:text-accent-violet-dark">
      <SnowflakeIcon size={12} />
      Powered by Snowflake Cortex AI
    </span>
  )
}
