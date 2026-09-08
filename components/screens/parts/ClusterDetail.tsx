"use client"

/**
 * Side by side comparison of the members of one cluster, with the score itemised
 * beside it and three actions beneath.
 *
 * The evidence panel states what was compared, what was found and what it
 * contributed, including contributions that subtract. Each action opens a
 * confirmation naming what would change and in which system. Nothing here writes to
 * a production system, and the wording says so.
 */

import { useState } from "react"
import { SYSTEM_LABEL } from "@/data/nomenclature"
import {
  ACTIONS,
  ORACLE_ATTRIBUTES,
  REVISION_HISTORY_NOTE,
  TEAMCENTER_ATTRIBUTES,
  type ActionSpec,
  type AttributeSpec,
} from "@/data/parts-content"
import type { ClusterRow } from "@/lib/parts"
import { Traced } from "@/components/lineage/Traced"
import { useSession } from "@/context/SessionContext"
import { compactMoney } from "@/lib/format"

function AttributeGroup({
  title,
  attributes,
  cluster,
  side,
}: {
  title: string
  attributes: AttributeSpec[]
  cluster: ClusterRow
  side: "oracle" | "teamcenter"
}) {
  return (
    <>
      <tr>
        <td
          colSpan={cluster.members.length + 1}
          className="border-y border-hairline bg-canvas px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy-muted"
        >
          {title}
        </td>
      </tr>
      {attributes.map((attribute) => {
        const values = cluster.members.map((m) => m[side][attribute.id])
        const first = values[0]?.text
        const allMatch = values.every((v) => v?.text === first)
        return (
          <tr key={attribute.id} className="border-b border-hairline/60 align-top last:border-b-0">
            <td className="w-[168px] px-2 py-1 text-[11px] leading-tight text-navy-muted">
              <Traced sourceKey={attribute.sourceKey} label={attribute.label} tag="inline" detail="layer">
                <span>{attribute.label}</span>
              </Traced>
            </td>
            {values.map((value, i) => (
              <td
                key={cluster.members[i].partKey}
                className={`px-2 py-1 text-[11px] leading-tight ${
                  value?.missing
                    ? "italic text-navy-faint"
                    : allMatch
                      ? "text-navy-muted"
                      : "bg-attention-soft font-medium text-attention"
                }`}
              >
                <span className={attribute.id === "description" ? "" : "mono"}>{value?.text ?? "—"}</span>
              </td>
            ))}
          </tr>
        )
      })}
    </>
  )
}

function Confirmation({
  action,
  cluster,
  onCancel,
  onConfirm,
}: {
  action: ActionSpec
  cluster: ClusterRow
  onCancel: () => void
  onConfirm: () => void
}) {
  const lines = action.lines({
    survivor: cluster.survivorPartNumber,
    others: cluster.memberCount - 1,
    oracle: SYSTEM_LABEL.ORACLE_EBS,
    teamcenter: SYSTEM_LABEL.TEAMCENTER,
  })

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/20 p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={action.confirmTitle}
        className="w-[520px] rounded-card border border-hairline bg-surface shadow-panel"
      >
        <header className="border-b border-hairline px-5 py-3">
          <h3 className="text-[14px] font-semibold text-navy">{action.confirmTitle}</h3>
          <p className="mono mt-0.5 text-[11px] text-navy-faint">{cluster.clusterId}</p>
        </header>

        <ul className="space-y-2 px-5 py-4">
          {lines.map((line) => (
            <li key={line} className="flex gap-2 text-[12px] leading-snug text-navy">
              <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-cyan" aria-hidden />
              {line}
            </li>
          ))}
        </ul>

        <p className="mx-5 mb-4 rounded border border-attention/30 bg-attention-soft px-3 py-2 text-[11px] leading-snug text-attention">
          {action.assurance}
        </p>

        <footer className="flex justify-end gap-2 border-t border-hairline px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-hairline px-3 py-1.5 text-[12px] text-navy-muted hover:bg-canvas"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-navy px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#163a5e]"
          >
            {action.label}
          </button>
        </footer>
      </div>
    </div>
  )
}

export function ClusterDetail({ cluster }: { cluster: ClusterRow }) {
  const { decideCluster, clusterDecisions } = useSession()
  const [pending, setPending] = useState<ActionSpec | null>(null)
  const decision = clusterDecisions[cluster.clusterId]

  return (
    <div className="grid h-full grid-cols-[1fr_312px] gap-3">
      {/* Comparison */}
      <div className="flex min-h-0 flex-col rounded-card border border-hairline bg-surface">
        <header className="flex items-center justify-between gap-3 border-b border-hairline px-3 py-2">
          <div className="flex items-baseline gap-3">
            <span className="mono text-[13px] font-medium text-navy">{cluster.clusterId}</span>
            <span className="text-[11px] text-navy-muted">
              <span className="mono">{cluster.memberCount}</span> members ·{" "}
              <span className="mono">{cluster.orgCodes.join(", ")}</span>
            </span>
            {cluster.revisionAnomaly && (
              <span className="rounded border border-attention bg-attention-soft px-1.5 py-px text-[10px] font-semibold text-attention">
                revision anomaly
              </span>
            )}
          </div>
          <span className="text-[11px] text-navy-muted">
            Proposed survivor <span className="mono text-navy">{cluster.survivorPartNumber}</span>
          </span>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-hairline">
                <th className="w-[168px] px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-navy-faint">
                  Attribute
                </th>
                {cluster.members.map((m) => (
                  <th key={m.partKey} className="px-2 py-1.5 text-left">
                    <span className="mono block text-[11px] font-medium text-navy">{m.partNumber}</span>
                    <span className="mono block text-[9.5px] font-normal text-navy-faint">
                      {m.orgCode}
                      {m.isSurvivorCandidate ? " · proposed survivor" : ""}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AttributeGroup title={SYSTEM_LABEL.ORACLE_EBS} attributes={ORACLE_ATTRIBUTES} cluster={cluster} side="oracle" />
              <AttributeGroup title={SYSTEM_LABEL.TEAMCENTER} attributes={TEAMCENTER_ATTRIBUTES} cluster={cluster} side="teamcenter" />
            </tbody>
          </table>
        </div>

        <p className="border-t border-hairline px-3 py-1 text-[10px] text-navy-faint">{REVISION_HISTORY_NOTE}</p>
      </div>

      {/* Evidence and actions */}
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex min-h-0 flex-1 flex-col rounded-card border border-hairline bg-surface">
          <header className="flex items-baseline justify-between border-b border-hairline px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-faint">Score</span>
            <Traced sourceKey="DUP.CLUSTER_MEMBERSHIP" label="Confidence score" tag="inline" detail="layer">
              <span className="mono text-[18px] font-medium leading-none text-navy">{cluster.confidence}</span>
            </Traced>
          </header>

          <ul className="min-h-0 flex-1 divide-y divide-hairline overflow-y-auto">
            {cluster.evidence.map((item) => (
              <li key={item.code} className="px-3 py-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-medium text-navy">{item.label}</span>
                  <span
                    className={`mono shrink-0 text-[11px] font-medium ${
                      item.points < 0 ? "text-blocked" : "text-healthy"
                    }`}
                  >
                    {item.points > 0 ? `+${item.points}` : item.points}
                  </span>
                </div>
                <p className="text-[10.5px] leading-snug text-navy-muted">{item.finding}</p>
              </li>
            ))}
          </ul>

          <div className="border-t border-hairline px-3 py-1.5 text-[10.5px] text-navy-muted">
            Impact <span className="mono text-navy">{compactMoney(cluster.estimatedImpact)}</span> a year ·
            carrying <span className="mono">{compactMoney(cluster.carryingCost)}</span> · volume leverage{" "}
            <span className="mono">{compactMoney(cluster.leverageLoss)}</span>
            <span className="block text-[9.5px] text-navy-faint">Illustrative figures on illustrative rates</span>
          </div>
        </div>

        <div className="rounded-card border border-hairline bg-surface px-3 py-2">
          {decision ? (
            <p className="text-[11px] text-navy-muted">
              Decided in this session:{" "}
              <span className="font-medium text-navy">
                {ACTIONS.find((a) => a.id === decision)?.label}
              </span>
              . Screen 6 reflects it.
            </p>
          ) : (
            <div className="flex gap-1.5">
              {ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setPending(action)}
                  className={`flex-1 whitespace-nowrap rounded border px-1.5 py-1.5 text-[11px] font-medium transition-colors ${
                    action.tone === "cyan"
                      ? "border-cyan bg-cyan text-white hover:bg-[#0090ad]"
                      : action.tone === "attention"
                        ? "border-attention/40 bg-attention-soft text-attention hover:border-attention"
                        : "border-hairline bg-surface text-navy-muted hover:border-navy-faint"
                  }`}
                >
                  {action.id === "ROUTED_TO_ENGINEERING" ? "To engineering" : action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {pending && (
        <Confirmation
          action={pending}
          cluster={cluster}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            decideCluster(cluster.clusterId, pending.id, `${cluster.clusterId} · ${pending.label}`)
            setPending(null)
          }}
        />
      )}
    </div>
  )
}
