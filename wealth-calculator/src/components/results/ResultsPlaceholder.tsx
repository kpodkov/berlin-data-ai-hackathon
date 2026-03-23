function ChartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

export function ResultsPlaceholder() {
  return (
    <div className="
      flex flex-col items-center justify-center
      min-h-[400px] rounded-xl
      border-2 border-dashed border-border dark:border-border-dark
      text-center p-8
    ">
      <div className="text-text-muted dark:text-text-muted-dark mb-4">
        <ChartIcon />
      </div>
      <h3 className="text-base font-semibold text-text-primary dark:text-text-primary-dark mb-2">
        Your wealth trajectory will appear here
      </h3>
      <p className="text-sm text-text-secondary dark:text-text-secondary-dark max-w-xs leading-relaxed">
        Enter your age, annual income, and monthly investment amount to see your projected wealth
        across conservative, moderate, and aggressive growth scenarios.
      </p>
    </div>
  )
}
