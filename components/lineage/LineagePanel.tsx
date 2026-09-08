"use client"

/**
 * The right side lineage panel, 420px wide.
 *
 * Everything shown comes from /data/nomenclature.ts. The verification chip renders
 * from the verified field and only ever appears here, which means it can never leak
 * into Business view.
 */

import { useEffect } from "react"
import {
  getSource,
  LAYER_LABEL,
  SYSTEM_LABEL,
  VERIFIED_LABEL,
  type SourceRef,
} from "@/data/nomenclature"
import { useDataView } from "@/context/DataViewContext"
import { Chip } from "@/components/ui/Chip"

const LAYER_TONE = { BRONZE: "attention", SILVER: "neutral", GOLD: "cyan" } as const

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-hairline px-5 py-4 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-faint">{label}</p>
      <div className="mt-1.5 text-[13px] leading-relaxed text-navy">{children}</div>
    </div>
  )
}

export function LineagePanel() {
  const { activeKey, activeLabel, closePanel, isDataView } = useDataView()

  useEffect(() => {
    if (!activeKey) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [activeKey, closePanel])

  if (!activeKey || !isDataView) return null

  const source: SourceRef = getSource(activeKey)

  return (
    <aside
      aria-label="Data lineage"
      className="fixed right-0 top-14 z-40 flex h-[calc(100vh-3.5rem)] w-panel flex-col border-l border-hairline bg-surface shadow-panel"
    >
      <header className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan">Where this came from</p>
          <h2 className="mt-0.5 truncate text-[15px] font-semibold text-navy">{activeLabel ?? source.key}</h2>
          <p className="mono mt-1 truncate text-[11px] text-navy-faint">{source.key}</p>
        </div>
        <button
          type="button"
          onClick={closePanel}
          aria-label="Close lineage panel"
          className="rounded border border-hairline px-2 py-1 text-[12px] text-navy-muted transition-colors hover:bg-canvas"
        >
          Close
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <Row label="Source system">
          <span className="font-medium">{SYSTEM_LABEL[source.system]}</span>
        </Row>

        <Row label="Source object">
          <p className="mono break-all text-[13px]">{source.object}</p>
          {source.service && (
            <p className="mt-2">
              <span className="text-navy-muted">SOA service </span>
              <span className="mono break-all">{source.service}</span>
            </p>
          )}
        </Row>

        <Row label="Fields involved">
          <ul className="space-y-2">
            {source.fields.map((field) => (
              <li key={field.name}>
                <p className="mono break-all text-[12px] font-medium text-navy">{field.name}</p>
                <p className="text-[12px] leading-snug text-navy-muted">{field.note}</p>
              </li>
            ))}
          </ul>
        </Row>

        <Row label="Medallion layer">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={LAYER_TONE[source.layer]}>{LAYER_LABEL[source.layer]}</Chip>
            {source.mart && (
              <span className="text-[12px] text-navy-muted">
                mart <span className="mono text-navy">{source.mart}</span>
              </span>
            )}
          </div>
        </Row>

        <Row label="Transform">
          <p>{source.transform}</p>
        </Row>

        {source.assumption && (
          <Row label="Assumption">
            <p className="text-navy-muted">{source.assumption}</p>
          </Row>
        )}

        <Row label="Verification">
          <Chip tone="attention">{VERIFIED_LABEL[source.verified]}</Chip>
          <p className="mt-2 text-[12px] leading-snug text-navy-muted">
            Every mapping in this preview is unverified until a subject matter expert at the
            manufacturer confirms it. All mappings live in one file so that review is a single pass.
          </p>
        </Row>
      </div>
    </aside>
  )
}
