interface TierUnlockButtonProps {
  onClick: () => void
  label?: string
}

export function TierUnlockButton({ onClick, label = 'Add more detail' }: TierUnlockButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-1 text-sm font-medium
        text-accent-blue dark:text-accent-blue-dark
        hover:underline transition-colors duration-150
        focus:outline-none focus:underline
      "
    >
      {label}
      <span aria-hidden="true">→</span>
    </button>
  )
}
