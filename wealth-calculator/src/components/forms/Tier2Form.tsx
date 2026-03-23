import type { Tier2Inputs } from '../../types'
import { CurrencyInput } from './CurrencyInput'
import { RiskToggle } from './RiskToggle'
import { OwnershipToggle } from './OwnershipToggle'

interface Tier2FormProps {
  value: Tier2Inputs
  onChange: (v: Tier2Inputs) => void
}

export function Tier2Form({ value, onChange }: Tier2FormProps) {
  const update = <K extends keyof Tier2Inputs>(key: K, val: Tier2Inputs[K]) => {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-4">
      <CurrencyInput
        label="Current Savings"
        value={value.currentSavings}
        onChange={(v) => update('currentSavings', v)}
        placeholder="10,000"
        min={0}
        hint="Total saved across checking, savings, and investments"
      />

      <RiskToggle
        value={value.riskTolerance}
        onChange={(v) => update('riskTolerance', v)}
      />

      <OwnershipToggle
        value={value.housingStatus}
        onChange={(v) => update('housingStatus', v)}
      />

      <CurrencyInput
        label="Monthly Housing Cost"
        value={value.monthlyHousingCost}
        onChange={(v) => update('monthlyHousingCost', v)}
        placeholder="1,500"
        min={0}
        hint="Rent, mortgage, or housing payment per month"
      />

      <CurrencyInput
        label="Credit Card Debt"
        value={value.creditCardDebt}
        onChange={(v) => update('creditCardDebt', v)}
        placeholder="0"
        min={0}
        hint="Total outstanding balance across all cards"
      />

      <CurrencyInput
        label="Other Debt"
        value={value.otherDebt}
        onChange={(v) => update('otherDebt', v)}
        placeholder="0"
        min={0}
        hint="Student loans, personal loans, auto loans, etc."
      />
    </div>
  )
}
