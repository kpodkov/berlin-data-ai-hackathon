import { useSentiment } from '../../hooks/useCortex';

const colorMap: Record<string, string> = {
  green: 'bg-accent-emerald/15 text-accent-emerald dark:text-accent-emerald-dark',
  amber: 'bg-accent-amber/15 text-accent-amber dark:text-accent-amber-dark',
  red: 'bg-accent-rose/15 text-accent-rose dark:text-accent-rose-dark',
};

const dotColorMap: Record<string, string> = {
  green: 'bg-accent-emerald dark:bg-accent-emerald-dark',
  amber: 'bg-accent-amber dark:bg-accent-amber-dark',
  red: 'bg-accent-rose dark:bg-accent-rose-dark',
};

export function SentimentBadge() {
  const { data, loading } = useSentiment();

  if (loading || !data) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${colorMap[data.color]}`}
      title="Market sentiment · Powered by Snowflake Cortex AI"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[data.color]}`} />
      <span className="capitalize">{data.label}</span>
    </div>
  );
}
