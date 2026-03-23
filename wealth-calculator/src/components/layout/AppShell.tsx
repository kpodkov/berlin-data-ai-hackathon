import { ReactNode } from 'react'

interface AppShellProps {
  inputPanel: ReactNode
  resultsPanel: ReactNode
}

export function AppShell({ inputPanel, resultsPanel }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Two-panel layout on lg+, stacked on mobile */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Left: Input Panel — fixed 380px on desktop, full width on mobile */}
        <aside
          className="
            w-full lg:w-[380px] lg:flex-shrink-0
            border-b lg:border-b-0 lg:border-r border-border dark:border-border-dark
            overflow-y-auto
            lg:h-[calc(100vh-57px)]
          "
        >
          <div className="p-6">
            {inputPanel}
          </div>
        </aside>

        {/* Right: Results Panel — flex 1 */}
        <main
          className="
            flex-1 min-w-0
            overflow-y-auto
            lg:h-[calc(100vh-57px)]
          "
        >
          <div className="p-6">
            {resultsPanel}
          </div>
        </main>
      </div>
    </div>
  )
}
