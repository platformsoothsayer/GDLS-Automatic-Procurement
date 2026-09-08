"use client"

import { useDataView } from "@/context/DataViewContext"

/**
 * The global Business view / Data view control. One click, always in the same place.
 */
export function ViewModeToggle() {
  const { mode, setMode } = useDataView()

  const option = (value: "business" | "data", label: string) => {
    const active = mode === value
    return (
      <button
        key={value}
        type="button"
        onClick={() => setMode(value)}
        aria-pressed={active}
        className={`rounded px-3 py-1 text-[12px] font-medium transition-colors ${
          active ? "bg-cyan text-white shadow-sm" : "text-navy-muted hover:text-navy"
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-hairline bg-canvas p-0.5">
      {option("business", "Business view")}
      {option("data", "Data view")}
    </div>
  )
}
