import { useState } from 'react'
import { createPortal } from 'react-dom'

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function PrivacyModal({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Privacy information"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="
        relative z-10 w-full max-w-md
        bg-surface dark:bg-surface-dark
        border border-border dark:border-border-dark
        rounded-2xl shadow-xl p-6
      ">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-privacy-badge-text)' }}>
              <LockIcon />
            </span>
            <h2 className="text-base font-semibold text-text-primary dark:text-text-primary-dark">
              Your data stays with you
            </h2>
          </div>
          <button
            onClick={onClose}
            className="
              text-text-muted dark:text-text-muted-dark
              hover:text-text-primary dark:hover:text-text-primary-dark
              transition-colors
            "
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-3 text-sm text-text-secondary dark:text-text-secondary-dark">
          <p>
            Every number you enter is used only for calculations that run directly in your
            browser. Nothing is transmitted to a server, stored in a database, or shared
            with anyone.
          </p>
          <p>
            Economic benchmarks are fetched once from public FRED data when the page loads.
            Your personal inputs never leave your device.
          </p>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-accent-amber/10 dark:bg-accent-amber-dark/10 border border-accent-amber/20 dark:border-accent-amber-dark/20">
          <p className="text-xs text-text-secondary dark:text-text-secondary-dark leading-relaxed">
            <span className="font-semibold text-accent-amber dark:text-accent-amber-dark">Disclaimer:</span> This tool is for educational and informational purposes only. It does not constitute financial, investment, or tax advice. Projections are based on historical data and do not guarantee future results. Please consult a qualified financial advisor before making any financial decisions.
          </p>
        </div>

        <button
          onClick={onClose}
          className="
            mt-5 w-full py-2 rounded-lg text-sm font-medium
            bg-accent-blue dark:bg-accent-blue-dark text-white
            hover:opacity-90 transition-opacity
          "
        >
          Got it
        </button>
      </div>
    </div>,
    document.body
  )
}

export function PrivacyBadge() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="
          flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          transition-colors duration-150
          cursor-pointer hover:opacity-80
        "
        style={{
          backgroundColor: 'var(--color-privacy-badge-bg)',
          color: 'var(--color-privacy-badge-text)',
        }}
        aria-label="Privacy information"
      >
        <LockIcon />
        <span>Your data stays in your browser</span>
      </button>

      {open && <PrivacyModal onClose={() => setOpen(false)} />}
    </>
  )
}
