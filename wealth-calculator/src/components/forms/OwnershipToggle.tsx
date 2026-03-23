import type { HousingStatus } from '../../types'

interface OwnershipToggleProps {
  value: HousingStatus
  onChange: (v: HousingStatus) => void
}

const OPTIONS: { value: HousingStatus; label: string }[] = [
  { value: 'rent', label: 'Rent' },
  { value: 'own',  label: 'Own' },
]

export function OwnershipToggle({ value, onChange }: OwnershipToggleProps) {
  const handleKeyDown = (e: React.KeyboardEvent, current: HousingStatus) => {
    const idx = OPTIONS.findIndex((o) => o.value === current)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = OPTIONS[(idx + 1) % OPTIONS.length]
      onChange(next.value)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = OPTIONS[(idx - 1 + OPTIONS.length) % OPTIONS.length]
      onChange(prev.value)
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
        Rent or Own
      </label>
      <div
        role="radiogroup"
        aria-label="Housing status"
        className="
          flex rounded-lg border border-border dark:border-border-dark
          bg-surface dark:bg-surface-dark
          overflow-hidden
          divide-x divide-border dark:divide-border-dark
          w-40
        "
      >
        {OPTIONS.map((opt) => {
          const selected = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => handleKeyDown(e, opt.value)}
              className={`
                flex-1 py-2 px-3 text-xs font-medium transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-inset focus:ring-border-focus dark:focus:ring-border-dark-focus
                ${selected
                  ? 'bg-accent-blue dark:bg-accent-blue-dark text-white'
                  : 'text-text-secondary dark:text-text-secondary-dark hover:bg-surface-raised dark:hover:bg-surface-dark-raised'
                }
              `}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
