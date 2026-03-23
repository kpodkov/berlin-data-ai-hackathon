interface RealVsNominalToggleProps {
  value: 'nominal' | 'real'
  onChange: (v: 'nominal' | 'real') => void
}

export function RealVsNominalToggle({ value, onChange }: RealVsNominalToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-raised dark:bg-surface-dark-raised w-fit">
      <button
        type="button"
        onClick={() => onChange('nominal')}
        className={`
          px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150
          ${value === 'nominal'
            ? 'bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm'
            : 'text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark'
          }
        `}
      >
        Nominal
      </button>
      <button
        type="button"
        onClick={() => onChange('real')}
        className={`
          px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150
          ${value === 'real'
            ? 'bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm'
            : 'text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark'
          }
        `}
      >
        Real (inflation-adjusted)
      </button>
    </div>
  )
}
