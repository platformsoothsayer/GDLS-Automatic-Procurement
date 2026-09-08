"use client"

/**
 * The queue. Rows are clusters, not parts.
 *
 * Framed as work for a small team: everything here is a decision waiting for a
 * person, and the status column is the only thing that moves.
 */

import { useMemo, useState } from "react"
import type { ClusterRow } from "@/lib/parts"
import type { EvidenceCode } from "@/lib/domain"
import { CHIP_EVIDENCE, EVIDENCE_LABEL } from "@/data/parts-content"
import { Traced } from "@/components/lineage/Traced"
import { useSession, type ClusterDecision } from "@/context/SessionContext"
import { compactMoney, int } from "@/lib/format"

const STATUS_LABEL: Record<ClusterDecision | "OPEN", string> = {
  OPEN: "Open",
  MERGED: "Merged",
  KEPT_SEPARATE: "Kept separate",
  ROUTED_TO_ENGINEERING: "Routed to engineering",
}

const STATUS_STYLE: Record<ClusterDecision | "OPEN", string> = {
  OPEN: "border-hairline bg-canvas text-navy-muted",
  MERGED: "border-healthy/30 bg-healthy-soft text-healthy",
  KEPT_SEPARATE: "border-hairline bg-surface text-navy-faint",
  ROUTED_TO_ENGINEERING: "border-attention/30 bg-attention-soft text-attention",
}

const BANDS = [
  { id: "all", label: "All confidence", test: () => true },
  { id: "high", label: "90 and above", test: (c: number) => c >= 90 },
  { id: "mid", label: "70 to 89", test: (c: number) => c >= 70 && c < 90 },
  { id: "low", label: "Below 70", test: (c: number) => c < 70 },
]

function ConfidenceCell({ value }: { value: number }) {
  const tone = value >= 90 ? "bg-healthy" : value >= 70 ? "bg-cyan" : "bg-attention"
  return (
    <span className="flex items-center gap-2">
      <span className="mono w-6 text-right text-[12px] font-medium text-navy">{value}</span>
      <span className="h-1 w-14 overflow-hidden rounded-full bg-canvas ring-1 ring-inset ring-hairline">
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </span>
    </span>
  )
}

export function ClusterTable({
  rows,
  onOpen,
  orgCodes,
  commodities,
}: {
  rows: ClusterRow[]
  onOpen: (clusterId: string) => void
  orgCodes: string[]
  commodities: { code: string; name: string }[]
}) {
  const { clusterDecisions } = useSession()
  const [band, setBand] = useState("all")
  const [evidence, setEvidence] = useState<EvidenceCode | null>(null)
  const [revisionOnly, setRevisionOnly] = useState(false)
  const [org, setOrg] = useState("all")
  const [commodity, setCommodity] = useState("all")
  const [sort, setSort] = useState<{ by: "confidence" | "impact"; dir: "asc" | "desc" }>({
    by: "impact",
    dir: "desc",
  })

  const filtered = useMemo(() => {
    const bandTest = BANDS.find((b) => b.id === band)!.test
    const out = rows.filter(
      (r) =>
        bandTest(r.confidence) &&
        (!revisionOnly || r.revisionAnomaly) &&
        (!evidence || r.evidenceCodes.includes(evidence)) &&
        (org === "all" || r.orgCodes.includes(org)) &&
        (commodity === "all" || r.commodity === commodity)
    )
    const key = sort.by === "confidence" ? (r: ClusterRow) => r.confidence : (r: ClusterRow) => r.estimatedImpact
    return out.sort((a, b) => (sort.dir === "desc" ? key(b) - key(a) : key(a) - key(b)))
  }, [rows, band, evidence, revisionOnly, org, commodity, sort])

  const sortButton = (by: "confidence" | "impact", label: string) => (
    <button
      type="button"
      onClick={() => setSort((s) => ({ by, dir: s.by === by && s.dir === "desc" ? "asc" : "desc" }))}
      className="flex items-center gap-1 text-left hover:text-navy"
    >
      {label}
      <span className={`text-[8px] ${sort.by === by ? "text-cyan" : "text-navy-faint/40"}`}>
        {sort.by === by && sort.dir === "asc" ? "▲" : "▼"}
      </span>
    </button>
  )

  const select = (value: string, onChange: (v: string) => void, options: { value: string; label: string }[]) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-hairline bg-surface px-2 py-1 text-[11px] text-navy-muted"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )

  return (
    <div className="flex h-full flex-col">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {select(band, setBand, BANDS.map((b) => ({ value: b.id, label: b.label })))}
        {select(evidence ?? "all", (v) => setEvidence(v === "all" ? null : (v as EvidenceCode)), [
          { value: "all", label: "All evidence" },
          ...CHIP_EVIDENCE.map((c) => ({ value: c, label: EVIDENCE_LABEL[c] })),
        ])}
        {select(org, setOrg, [
          { value: "all", label: "All organizations" },
          ...orgCodes.map((c) => ({ value: c, label: c })),
        ])}
        {select(commodity, setCommodity, [
          { value: "all", label: "All commodities" },
          ...commodities.map((c) => ({ value: c.code, label: c.name })),
        ])}

        <button
          type="button"
          onClick={() => setRevisionOnly((v) => !v)}
          aria-pressed={revisionOnly}
          className={`rounded border px-2 py-1 text-[11px] font-medium transition-colors ${
            revisionOnly
              ? "border-attention bg-attention text-white"
              : "border-hairline bg-surface text-navy-muted hover:border-attention hover:text-attention"
          }`}
        >
          Revision used to bypass item creation
        </button>

        <span className="ml-auto text-[11px] text-navy-faint">
          <span className="mono text-navy-muted">{int(filtered.length)}</span> of{" "}
          <span className="mono text-navy-muted">{int(rows.length)}</span> clusters
        </span>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-hairline bg-surface">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-hairline text-[10px] font-semibold uppercase tracking-wider text-navy-faint">
              <th className="px-3 py-2 text-left">Cluster</th>
              <th className="px-3 py-2 text-left">Part numbers</th>
              <th className="px-2 py-2 text-right">Members</th>
              <th className="px-3 py-2 text-left">{sortButton("confidence", "Confidence")}</th>
              <th className="px-3 py-2 text-left">Evidence</th>
              <th className="w-[104px] whitespace-nowrap px-3 py-2 text-right">{sortButton("impact", "Impact / yr")}</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const status = clusterDecisions[row.clusterId] ?? "OPEN"
              const chips = row.evidenceCodes.filter((c) => CHIP_EVIDENCE.includes(c)).slice(0, 4)
              const shown = row.partNumbers.slice(0, 3)
              const extra = row.partNumbers.length - shown.length
              return (
                <tr
                  key={row.clusterId}
                  onClick={() => onOpen(row.clusterId)}
                  className={`cursor-pointer border-b border-hairline last:border-b-0 hover:bg-cyan-soft/50 ${
                    row.revisionAnomaly ? "bg-attention-soft/30" : ""
                  }`}
                >
                  <td className="px-3 py-1.5">
                    <span className="mono text-navy">{row.clusterId}</span>
                  </td>
                  <td className="w-[268px] max-w-[268px] px-3 py-1.5">
                    <span className="mono block truncate text-[11px] text-navy-muted">
                      {shown.join("  ")}
                      {extra > 0 && <span className="ml-1.5 text-navy-faint">+{extra}</span>}
                    </span>
                  </td>
                  <td className="mono px-2 py-1.5 text-right text-navy-muted">{row.memberCount}</td>
                  <td className="px-3 py-1.5">
                    <Traced sourceKey="DUP.CLUSTER_MEMBERSHIP" label={`${row.clusterId} confidence`} tag="inline" detail="layer">
                      <ConfidenceCell value={row.confidence} />
                    </Traced>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="flex flex-wrap gap-1">
                      {chips.map((code) => (
                        <span
                          key={code}
                          className={`rounded border px-1 py-px text-[9.5px] leading-4 ${
                            code === "REVISION_ANOMALY"
                              ? "border-attention bg-attention-soft font-semibold text-attention"
                              : code === "SAME_ASSEMBLY"
                                ? "border-blocked/25 bg-blocked-soft text-blocked"
                                : "border-hairline bg-canvas text-navy-muted"
                          }`}
                        >
                          {code === "SAME_ASSEMBLY" ? "− " : ""}
                          {EVIDENCE_LABEL[code]}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="mono px-3 py-1.5 text-right text-navy">{compactMoney(row.estimatedImpact)}</td>
                  <td className="px-3 py-1.5">
                    <span className={`rounded border px-1.5 py-px text-[10px] ${STATUS_STYLE[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
