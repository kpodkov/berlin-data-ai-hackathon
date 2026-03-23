import type { Tier3Inputs } from '../../types'
import { CurrencyInput } from './CurrencyInput'

interface Tier3FormProps {
  value: Tier3Inputs
  onChange: (v: Tier3Inputs) => void
}

export function Tier3Form({ value, onChange }: Tier3FormProps) {
  const update = <K extends keyof Tier3Inputs>(key: K, val: Tier3Inputs[K]) => {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-4">
      <CurrencyInput
        label="Monthly Food Spend"
        value={value.monthlyFood}
        onChange={(v) => update('monthlyFood', v)}
        placeholder="600"
        min={0}
        hint="Groceries, dining out, and food delivery"
      />
      <CurrencyInput
        label="Monthly Transport Spend"
        value={value.monthlyTransport}
        onChange={(v) => update('monthlyTransport', v)}
        placeholder="300"
        min={0}
        hint="Gas, public transit, ride-shares, car payments"
      />
      <CurrencyInput
        label="Monthly Healthcare Spend"
        value={value.monthlyHealthcare}
        onChange={(v) => update('monthlyHealthcare', v)}
        placeholder="200"
        min={0}
        hint="Premiums, prescriptions, and out-of-pocket costs"
      />
      <CurrencyInput
        label="Monthly Education Spend"
        value={value.monthlyEducation}
        onChange={(v) => update('monthlyEducation', v)}
        placeholder="100"
        min={0}
        hint="Tuition, books, courses, and childcare"
      />
      <CurrencyInput
        label="Monthly Energy / Utilities Spend"
        value={value.monthlyEnergy}
        onChange={(v) => update('monthlyEnergy', v)}
        placeholder="150"
        min={0}
        hint="Electricity, gas, water, and internet"
      />
    </div>
  )
}
