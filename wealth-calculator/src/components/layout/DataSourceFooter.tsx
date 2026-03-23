export function DataSourceFooter() {
  return (
    <footer className="px-6 py-4 border-t border-border dark:border-border-dark">
      <p className="text-xs text-text-muted dark:text-text-muted-dark text-center">
        Economic data from{' '}
        <a
          href="https://fred.stlouisfed.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-text-secondary dark:hover:text-text-secondary-dark transition-colors"
        >
          FRED
        </a>
        {' '}(Federal Reserve Bank of St. Louis).{' '}
        <span className="font-medium">Not financial advice.</span>
      </p>
    </footer>
  )
}
