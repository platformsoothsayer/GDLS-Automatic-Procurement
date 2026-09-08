"use client"

import { usePathname } from "next/navigation"
import { screenFor } from "@/lib/routes"
import { useDataView } from "@/context/DataViewContext"
import { ViewModeToggle } from "@/components/ViewModeToggle"

export function TopBar() {
  const pathname = usePathname()
  const screen = screenFor(pathname)
  const { isDataView } = useDataView()

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-hairline bg-surface px-6">
      <div className="flex items-baseline gap-3">
        <span className="text-[15px] font-semibold tracking-tight text-navy">Industrial Data Fabric</span>
        <span className="text-[13px] text-navy-faint">Preview for the manufacturer</span>
      </div>

      <div className="flex items-center gap-4">
        {screen && (
          <span className="text-[12px] text-navy-muted">
            <span className="mono">{String(screen.step).padStart(2, "0")}</span>
            <span className="px-1.5 text-navy-faint">/</span>
            <span>{screen.label}</span>
          </span>
        )}
        {isDataView && (
          <span className="hidden items-center gap-1.5 text-[11px] text-cyan lg:inline-flex">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan" aria-hidden />
            Click any outlined value to see where it came from
          </span>
        )}
        <ViewModeToggle />
      </div>
    </header>
  )
}
