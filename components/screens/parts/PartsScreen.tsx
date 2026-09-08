"use client"

/**
 * Screen 3. Three tabs over one queue.
 *
 * The frame is a work queue for a small team, not an autonomous cleaner. The top
 * strip is about the team's throughput; every decision is taken by a person and
 * recorded in the session so screen 6 can show what this session actually did.
 */

import { useMemo, useState } from "react"
import type { ClusterRow, IntegrityFinding, ProcessCard } from "@/lib/parts"
import { ClusterTable } from "@/components/screens/parts/ClusterTable"
import { ClusterDetail } from "@/components/screens/parts/ClusterDetail"
import { CompletenessTab } from "@/components/screens/parts/CompletenessTab"
import { useSession } from "@/context/SessionContext"
import { int } from "@/lib/format"

type TabId = "clusters" | "detail" | "completeness"

const TABS: { id: TabId; label: string }[] = [
  { id: "clusters", label: "Duplicate clusters" },
  { id: "detail", label: "Cluster detail" },
  { id: "completeness", label: "Completeness" },
]

function Tile({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="rounded-card border border-hairline bg-surface px-3 py-2 shadow-card">
      <p className="mono text-[19px] font-medium leading-none text-navy">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-navy-muted">{label}</p>
      {note && <p className="text-[9.5px] leading-tight text-navy-faint">{note}</p>}
    </div>
  )
}

export function PartsScreen({
  rows,
  cards,
  findings,
  orgCodes,
  commodities,
  throughputPerDay,
  minutesSavedPerCluster,
}: {
  rows: ClusterRow[]
  cards: ProcessCard[]
  findings: IntegrityFinding[]
  orgCodes: string[]
  commodities: { code: string; name: string }[]
  throughputPerDay: number
  minutesSavedPerCluster: number
}) {
  const { clusterDecisions, selectPart } = useSession()
  const [tab, setTab] = useState<TabId>("clusters")

  // Opening the detail tab directly lands on the strongest case rather than nothing.
  const defaultCluster = useMemo(
    () =>
      rows.find((r) => r.confidence >= 85 && r.evidence.some((e) => e.points < 0)) ??
      rows.find((r) => r.confidence >= 90) ??
      rows[0],
    [rows]
  )
  const [selectedId, setSelectedId] = useState<string>(defaultCluster.clusterId)
  const selected = rows.find((r) => r.clusterId === selectedId) ?? defaultCluster

  const reviewed = Object.keys(clusterDecisions).length
  const open = rows.length - reviewed
  const hoursSaved = (reviewed * minutesSavedPerCluster) / 60
  const daysToClear = Math.ceil(open / throughputPerDay)

  const openCluster = (clusterId: string) => {
    setSelectedId(clusterId)
    setTab("detail")
    const row = rows.find((r) => r.clusterId === clusterId)
    if (row) selectPart(clusterId, `${clusterId} · ${row.partNumbers[0]}`)
  }

  return (
    <div className="flex h-[calc(100vh-184px)] flex-col gap-2.5">
      {/* Queue strip */}
      <div className="grid grid-cols-4 gap-3">
        <Tile value={int(open)} label="Open clusters" note="waiting for a reviewer" />
        <Tile value={int(reviewed)} label="Reviewed this week" note="decided in this session" />
        <Tile
          value={hoursSaved >= 10 ? hoursSaved.toFixed(0) : hoursSaved.toFixed(1)}
          label="Analyst hours saved"
          note={`illustrative · ${minutesSavedPerCluster} min per cluster`}
        />
        <Tile
          value={int(throughputPerDay)}
          label="Clusters per analyst day"
          note={`queue clears in ${int(daysToClear)} analyst days`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-hairline">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={active ? "page" : undefined}
              className={`-mb-px border-b-2 px-3 py-1.5 text-[12px] font-medium transition-colors ${
                active
                  ? "border-cyan text-navy"
                  : "border-transparent text-navy-muted hover:text-navy"
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1">
        {tab === "clusters" && (
          <ClusterTable rows={rows} onOpen={openCluster} orgCodes={orgCodes} commodities={commodities} />
        )}
        {tab === "detail" && <ClusterDetail cluster={selected} />}
        {tab === "completeness" && <CompletenessTab cards={cards} findings={findings} />}
      </div>
    </div>
  )
}
