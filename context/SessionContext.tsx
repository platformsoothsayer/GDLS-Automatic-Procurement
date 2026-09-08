"use client"

/**
 * Cross module session state.
 *
 * Holds the part the presenter selected, the MRO signal they selected and a log of
 * every action taken during the walkthrough. Screens 5 and 6 read from this so the
 * populated fabric reflects what actually happened in the session rather than a set
 * of fixed numbers.
 *
 * State lives here only. No localStorage, no sessionStorage, nothing persisted.
 * Reloading the page starts a clean demonstration, which is what a presenter wants.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

export type ActionKind =
  | "PROBLEM_SELECTED"
  | "PART_SELECTED"
  | "SIGNAL_SELECTED"
  | "CLUSTER_REVIEWED"
  | "REQUISITION_PROPOSED"
  | "REQUISITION_RELEASED"
  | "LINEAGE_INSPECTED"
  | "NOTE"

export type SessionAction = {
  id: number
  kind: ActionKind
  screen: string
  label: string
  detail?: string
}

export type Selection = { key: string; label: string } | null

type SessionValue = {
  selectedProblemId: string | null
  selectProblem: (id: string, label: string) => void

  selectedPart: Selection
  selectPart: (key: string, label: string) => void

  selectedSignal: Selection
  selectSignal: (key: string, label: string) => void

  actions: SessionAction[]
  logAction: (action: Omit<SessionAction, "id">) => void
  actionCount: number
  resetSession: () => void
}

const SessionCtx = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null)
  const [selectedPart, setSelectedPart] = useState<Selection>(null)
  const [selectedSignal, setSelectedSignal] = useState<Selection>(null)
  const [actions, setActions] = useState<SessionAction[]>([])

  const logAction = useCallback((action: Omit<SessionAction, "id">) => {
    setActions((current) => [...current, { ...action, id: current.length + 1 }])
  }, [])

  const selectProblem = useCallback(
    (id: string, label: string) => {
      setSelectedProblemId(id)
      logAction({ kind: "PROBLEM_SELECTED", screen: "Problem selection", label })
    },
    [logAction]
  )

  const selectPart = useCallback(
    (key: string, label: string) => {
      setSelectedPart({ key, label })
      logAction({ kind: "PART_SELECTED", screen: "Part master intelligence", label, detail: key })
    },
    [logAction]
  )

  const selectSignal = useCallback(
    (key: string, label: string) => {
      setSelectedSignal({ key, label })
      logAction({ kind: "SIGNAL_SELECTED", screen: "MRO signals", label, detail: key })
    },
    [logAction]
  )

  const resetSession = useCallback(() => {
    setSelectedProblemId(null)
    setSelectedPart(null)
    setSelectedSignal(null)
    setActions([])
  }, [])

  const value = useMemo<SessionValue>(
    () => ({
      selectedProblemId,
      selectProblem,
      selectedPart,
      selectPart,
      selectedSignal,
      selectSignal,
      actions,
      logAction,
      actionCount: actions.length,
      resetSession,
    }),
    [selectedProblemId, selectProblem, selectedPart, selectPart, selectedSignal, selectSignal, actions, logAction, resetSession]
  )

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error("useSession must be used inside SessionProvider")
  return ctx
}
