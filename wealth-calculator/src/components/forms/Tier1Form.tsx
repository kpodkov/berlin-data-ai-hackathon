import type { Tier1Inputs } from '../../types'
import { NumberInput } from './NumberInput'
import { CurrencyInput } from './CurrencyInput'

interface Tier1FormProps {
  values: Tier1Inputs
  onChange: (values: Tier1Inputs) => void
}

export function Tier1Form({ values, onChange }: Tier1FormProps) {
  const update = <K extends keyof Tier1Inputs>(key: K, val: Tier1Inputs[K]) => {
    onChange({ ...values, [key]: val })
  }

  return (
    <div className="space-y-4">
      <NumberInput
        label="Your Age"
        value={values.age}
        onChange={(v) => update('age', v)}
        min={18}
        max={80}
        suffix="yrs"
        hint="Between 18 and 80"
      />
      <CurrencyInput
        label="Annual Income"
        value={values.annualIncome}
        onChange={(v) => update('annualIncome', v)}
        placeholder="75,000"
        min={0}
        hint="Gross annual income before tax"
      />
      <CurrencyInput
        label="Monthly Investment"
        value={values.monthlyInvestment}
        onChange={(v) => update('monthlyInvestment', v)}
        placeholder="500"
        min={0}
        hint="Amount you invest each month"
      />
    </div>
  )
}
