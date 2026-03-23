import { useState, useCallback } from 'react'

interface NumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  hint?: string
  suffix?: string
}

export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  hint,
  suffix,
}: NumberInputProps) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState<string>(value > 0 ? String(value) : '')

  const displayValue = focused ? raw : (value !== 0 ? String(value) : '0')

  const handleFocus = useCallback(() => {
    setFocused(true)
    setRaw(String(value))
  }, [value])

  const handleBlur = useCallback(() => {
    setFocused(false)
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed)) {
      const clamped = max !== undefined ? Math.min(parsed, max) : parsed
      onChange(Math.max(min, clamped))
    } else {
      onChange(0)
    }
  }, [raw, min, max, onChange])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setRaw(val)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (min >= 0 && (e.key === '-' || e.key === '+')) {
      e.preventDefault()
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={String(min)}
          className="
            w-full px-3 py-2.5 rounded-lg text-sm font-mono
            bg-surface dark:bg-surface-dark
            border border-border dark:border-border-dark
            text-text-primary dark:text-text-primary-dark
            placeholder:text-text-muted dark:placeholder:text-text-muted-dark
            focus:outline-none focus:ring-2 focus:ring-border-focus dark:focus:ring-border-dark-focus
            focus:border-border-focus dark:focus:border-border-dark-focus
            transition-colors duration-150
          "
        />
        {suffix && (
          <span className="
            absolute right-3 top-1/2 -translate-y-1/2
            text-text-muted dark:text-text-muted-dark
            text-sm pointer-events-none select-none
          ">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-xs text-text-muted dark:text-text-muted-dark">{hint}</p>
      )}
    </div>
  )
}
