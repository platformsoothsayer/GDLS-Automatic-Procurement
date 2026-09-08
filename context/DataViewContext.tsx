"use client"

/**
 * The data view overlay.
 *
 * Business view is the client's own view of the screen. Data view puts every data
 * bearing element behind a thin cyan dotted outline with a small monospace tag, and
 * opens a lineage panel describing exactly where the value came from.
 *
 * This is the shared component the whole demonstration rests on. Nothing in the
 * codebase should show source system detail except through this context.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { SourceKey } from "@/data/nomenclature"

export type ViewMode = "business" | "data"

type DataViewValue = {
  mode: ViewMode
  isDataView: boolean
  setMode: (mode: ViewMode) => void
  toggleMode: () => void
  activeKey: SourceKey | null
  activeLabel: string | null
  openSource: (key: SourceKey, label?: string) => void
  closePanel: () => void
}

const DataViewCtx = createContext<DataViewValue | null>(null)

export function DataViewProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>("business")
  const [activeKey, setActiveKey] = useState<SourceKey | null>(null)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)

  const closePanel = useCallback(() => {
    setActiveKey(null)
    setActiveLabel(null)
  }, [])

  const openSource = useCallback((key: SourceKey, label?: string) => {
    setActiveKey(key)
    setActiveLabel(label ?? null)
  }, [])

  const toggleMode = useCallback(() => {
    setMode((current) => {
      const next = current === "business" ? "data" : "business"
      // Leaving data view must never leave the lineage panel stranded on screen.
      if (next === "business") {
        setActiveKey(null)
        setActiveLabel(null)
      }
      return next
    })
  }, [])

  const value = useMemo<DataViewValue>(
    () => ({
      mode,
      isDataView: mode === "data",
      setMode,
      toggleMode,
      activeKey,
      activeLabel,
      openSource,
      closePanel,
    }),
    [mode, toggleMode, activeKey, activeLabel, openSource, closePanel]
  )

  return <DataViewCtx.Provider value={value}>{children}</DataViewCtx.Provider>
}

export function useDataView(): DataViewValue {
  const ctx = useContext(DataViewCtx)
  if (!ctx) throw new Error("useDataView must be used inside DataViewProvider")
  return ctx
}
