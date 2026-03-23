import { useState, useCallback } from 'react'

interface CurrencyInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  placeholder?: string
  min?: number
  max?: number
  hint?: string
}

function formatWithCommas(n: number): string {
  if (isNaN(n)) return ''
  return Math.round(n).toLocaleString('en-US')
}

export function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = '0',
  min = 0,
  max,
  hint,
}: CurrencyInputProps) {
  // Display raw digits while focused, formatted with commas when blurred
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState<string>(String(value))

  const displayValue = focused
    ? raw
    : formatWithCommas(value)

  const handleFocus = useCallback(() => {
    setFocused(true)
    setRaw(String(Math.round(value)))
  }, [value])

  const handleBlur = useCallback(() => {
    setFocused(false)
    const stripped = raw.replace(/,/g, '').replace(/[^0-9.]/g, '')
    const parsed = parseFloat(stripped)
    if (!isNaN(parsed)) {
      const clamped = max !== undefined ? Math.min(parsed, max) : parsed
      const final = Math.max(min, clamped)
      onChange(final)
      setRaw(String(Math.round(final)))
    } else {
      onChange(0)
      setRaw('')
    }
  }, [raw, min, max, onChange])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits, commas, dots while typing
    const val = e.target.value.replace(/[^0-9.,]/g, '')
    setRaw(val)
  }, [])

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
        {label}
      </label>
      <div className="relative">
        <span className="
          absolute left-3 top-1/2 -translate-y-1/2
          text-text-muted dark:text-text-muted-dark
          text-sm font-mono pointer-events-none select-none
        ">
          €
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className="
            w-full pl-7 pr-3 py-2.5 rounded-lg text-sm font-mono
            bg-surface dark:bg-surface-dark
            border border-border dark:border-border-dark
            text-text-primary dark:text-text-primary-dark
            placeholder:text-text-muted dark:placeholder:text-text-muted-dark
            focus:outline-none focus:ring-2 focus:ring-border-focus dark:focus:ring-border-dark-focus
            focus:border-border-focus dark:focus:border-border-dark-focus
            transition-colors duration-150
          "
        />
      </div>
      {hint && (
        <p className="text-xs text-text-muted dark:text-text-muted-dark">{hint}</p>
      )}
    </div>
  )
}
