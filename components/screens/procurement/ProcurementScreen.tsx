"use client"

/**
 * Screen 5. Four stages left to right, the active one expanded and the rest collapsed
 * to summary tiles. The presenter walks it in order.
 *
 * The rail on the right names the gold mart each stage reads from. It stays visible in
 * Business view on purpose, so the presenter can point at it without toggling.
 */

import { useEffect, useState } from "react"
import { getSource } from "@/data/nomenclature"
import { STAGES, type ModeSpec, type StageId } from "@/data/procurement-content"
import type { Signal } from "@/lib/mro"
import type { QuoteAnalysis, Recommendation } from "@/lib/procurement"
import { Stage1Intake } from "@/components/screens/procurement/Stage1Intake"
import { Stage2Recommendation } from "@/components/screens/procurement/Stage2Recommendation"
import { Stage3Fork } from "@/components/screens/procurement/Stage3Fork"
import { Stage4Rfq } from "@/components/screens/procurement/Stage4Rfq"
import { useSession } from "@/context/SessionContext"
import { compactMoney } from "@/lib/format"

export function ProcurementScreen({
  signals,
  recommendations,
  analyses,
}: {
  signals: Signal[]
  recommendations: Record<string, Recommendation>
  analyses: Record<string, QuoteAnalysis>
}) {
  const { selectedSignal, selectSignal, logAction } = useSession()
  // Arriving from screen 4 with a signal already chosen opens on the work, not on the
  // intake list the presenter has just come from.
  const [stage, setStage] = useState<StageId>(selectedSignal?.key ? "recommendation" : "intake")
  const [signalId, setSignalId] = useState<string | null>(selectedSignal?.key ?? null)
  const [actedMode, setActedMode] = useState<string | null>(null)
  const [awarded, setAwarded] = useState<{ supplierId: string; justification: string } | null>(null)

  // A signal chosen after this screen mounted, which is possible if the presenter
  // walks back to screen 4 and returns.
  useEffect(() => {
    if (selectedSignal?.key && selectedSignal.key !== signalId) {
      setSignalId(selectedSignal.key)
      setStage("recommendation")
    }
  }, [selectedSignal, signalId])

  const recommendation = signalId ? recommendations[signalId] : undefined
  const analysis = signalId ? analyses[signalId] : undefined

  const chooseSignal = (id: string) => {
    setSignalId(id)
    setActedMode(null)
    setAwarded(null)
    const signal = signals.find((s) => s.signalId === id)
    if (signal && selectedSignal?.key !== id) {
      selectSignal(id, `${signal.assetNumber} · spare ${signal.sparePartNumber}`)
    }
    setStage("recommendation")
  }

  const act = (mode: ModeSpec) => {
    setActedMode(mode.id)
    logAction({
      kind: "REQUISITION_PROPOSED",
      screen: "Automated procurement",
      label: `${mode.name} · ${recommendation?.part.partNumber ?? ""}`,
      detail: signalId ?? undefined,
    })
  }

  const award = (supplierId: string, justification: string) => {
    setAwarded({ supplierId, justification })
    const supplier = analysis?.ranked.find((q) => q.supplierId === supplierId)
    logAction({
      kind: "REQUISITION_RELEASED",
      screen: "Automated procurement",
      label: `Awarded to ${supplier?.supplierName ?? supplierId}`,
      detail: justification || undefined,
    })
  }

  const summaryFor = (id: StageId): string => {
    switch (id) {
      case "intake":
        return signalId ?? `${signals.length} signals`
      case "recommendation":
        return recommendation ? compactMoney(recommendation.lineValue) : "—"
      case "fork":
        return actedMode ? (actedMode === "advisory" ? "Advisory" : "Staged") : "Two modes"
      case "rfq":
        return awarded ? "Awarded" : "Negotiate"
    }
  }

  const canEnter = (id: StageId) => id === "intake" || Boolean(recommendation)

  return (
    <div className="grid h-[calc(100vh-184px)] grid-cols-[1fr_132px] gap-2.5">
      <div className="flex min-h-0 gap-1.5">
        {STAGES.map((spec) => {
          const active = stage === spec.id
          const enabled = canEnter(spec.id)
          if (active) {
            return (
              <section
                key={spec.id}
                className="card-topbar relative flex min-h-0 min-w-0 flex-1 flex-col rounded-card border border-hairline bg-surface px-3 pb-2.5 pt-3.5 shadow-card"
              >
                <p className="mb-2 flex items-baseline gap-2">
                  <span className="mono text-[11px] font-medium text-cyan">0{spec.n}</span>
                  <span className="text-[14px] font-semibold text-navy">{spec.label}</span>
                </p>
                <div className="min-h-0 flex-1">
                  {spec.id === "intake" && (
                    <Stage1Intake signals={signals} selectedId={signalId} onSelect={chooseSignal} />
                  )}
                  {spec.id === "recommendation" && recommendation && (
                    <Stage2Recommendation recommendation={recommendation} />
                  )}
                  {spec.id === "fork" && recommendation && (
                    <Stage3Fork
                      recommendation={recommendation}
                      onNegotiate={() => setStage("rfq")}
                      onAct={act}
                      actedMode={actedMode}
                    />
                  )}
                  {spec.id === "rfq" && recommendation && analysis && (
                    <Stage4Rfq
                      recommendation={recommendation}
                      analysis={analysis}
                      awarded={awarded}
                      onAward={award}
                    />
                  )}
                </div>
              </section>
            )
          }

          return (
            <button
              key={spec.id}
              type="button"
              disabled={!enabled}
              onClick={() => setStage(spec.id)}
              className={`flex w-[86px] shrink-0 flex-col items-center gap-2 rounded-card border px-2 py-3 text-center transition-colors ${
                enabled
                  ? "border-hairline bg-surface shadow-card hover:border-cyan-line"
                  : "cursor-not-allowed border-dashed border-hairline bg-canvas opacity-60"
              }`}
            >
              <span
                className={`mono flex h-5 w-5 items-center justify-center rounded text-[11px] font-medium ${
                  enabled ? "bg-canvas text-navy-muted" : "bg-surface text-navy-faint"
                }`}
              >
                {spec.n}
              </span>
              <span className="text-[11px] font-medium leading-tight text-navy">{spec.short}</span>
              <span className="mono text-[9.5px] leading-tight text-navy-faint">{summaryFor(spec.id)}</span>
            </button>
          )
        })}
      </div>

      {/* Rail: which gold mart each stage reads from. Visible in both views. */}
      <aside className="flex min-h-0 flex-col rounded-card border border-hairline bg-surface px-2.5 py-2 shadow-card">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-navy-faint">Reads from</p>
        <ul className="mt-2 space-y-2.5">
          {STAGES.map((spec) => {
            const source = getSource(spec.martKey)
            const active = stage === spec.id
            return (
              <li key={spec.id}>
                <p className={`text-[10px] font-medium leading-tight ${active ? "text-navy" : "text-navy-faint"}`}>
                  <span className="mono">{spec.n}</span> {spec.short}
                </p>
                <p
                  className={`mono break-all text-[8.5px] leading-[11px] ${
                    active ? "text-cyan" : "text-navy-faint"
                  }`}
                >
                  {source.mart ?? source.object}
                </p>
              </li>
            )
          })}
        </ul>
        <p className="mt-auto text-[9px] leading-snug text-navy-faint">
          Three marts carry all four stages. Nothing here reads a source system directly.
        </p>
      </aside>
    </div>
  )
}
