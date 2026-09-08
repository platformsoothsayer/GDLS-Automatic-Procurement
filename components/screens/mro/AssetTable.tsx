"use client"

/**
 * The asset register. Rows that are producing a signal are marked, and criticality
 * one rows carry a navy left border so the most important assets are findable
 * without reading the column.
 */

import type { AssetRow } from "@/lib/mro"
import { Traced } from "@/components/lineage/Traced"
import { int, shortDate } from "@/lib/format"

function ConditionDot({ score }: { score: number }) {
  const tone =
    score >= 70 ? "bg-healthy" : score >= 50 ? "bg-cyan" : score >= 30 ? "bg-attention" : "bg-blocked"
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${tone}`} aria-hidden />
}

const TH = "px-1.5 py-1.5 text-left text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint"

export function AssetTable({
  rows,
  selectedAsset,
  onSelect,
}: {
  rows: AssetRow[]
  selectedAsset: string | null
  onSelect: (assetNumber: string) => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-card border border-hairline bg-surface">
      <header className="flex items-baseline justify-between border-b border-hairline px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-faint">
          Maintainable assets
        </span>
        <span className="text-[10px] text-navy-faint">
          <span className="mono text-navy-muted">{int(rows.filter((r) => r.signalId).length)}</span> of{" "}
          <span className="mono text-navy-muted">{int(rows.length)}</span> producing a signal ·
          criticality 1 is the most critical
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[10.5px]">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-hairline">
              <th className={TH}>Asset</th>
              <th className={TH}>Description</th>
              <th className={TH}>Loc</th>
              <th className={`${TH} text-center`} title="Criticality 1 to 4. 1 is the most critical">
                Crit
              </th>
              <th className={TH}>Cond</th>
              <th className={TH}>Last svc</th>
              <th className={TH}>Next svc</th>
              <th className={TH}>Spare</th>
              <th className={`${TH} text-right`}>On hand / ROP</th>
              <th className={`${TH} text-right`}>Lead</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const signalling = Boolean(row.signalId)
              const selected = selectedAsset === row.assetNumber
              return (
                <tr
                  key={row.assetNumber}
                  onClick={() => onSelect(row.assetNumber)}
                  className={`cursor-pointer border-b border-hairline/70 last:border-b-0 ${
                    row.criticality === 1 ? "border-l-[3px] border-l-navy" : "border-l-[3px] border-l-transparent"
                  } ${
                    selected
                      ? "bg-cyan-soft"
                      : row.timingCondition
                        ? "bg-blocked-soft/45 hover:bg-blocked-soft/70"
                        : signalling
                          ? "bg-attention-soft/40 hover:bg-attention-soft/70"
                          : "hover:bg-canvas"
                  }`}
                >
                  <td className="mono whitespace-nowrap px-1.5 py-1 text-navy">{row.assetNumber}</td>
                  <td className="max-w-[112px] truncate px-1.5 py-1 text-navy-muted">{row.description}</td>
                  <td className="mono whitespace-nowrap px-1.5 py-1 text-navy-faint">{row.location}</td>
                  <td className="px-1.5 py-1 text-center">
                    <Traced sourceKey="MRO.ASSET_CRITICALITY" label={`${row.assetNumber} criticality`} tag="inline" detail="layer">
                      <span className={`mono ${row.criticality === 1 ? "font-semibold text-navy" : "text-navy-muted"}`}>
                        {row.criticality}
                      </span>
                    </Traced>
                  </td>
                  <td className="px-1.5 py-1">
                    <Traced sourceKey="GOLD.REPLENISHMENT_SIGNAL" label={`${row.assetNumber} condition`} tag="inline" detail="layer">
                      <span className="flex items-center gap-1.5">
                        <ConditionDot score={row.conditionScore} />
                        <span className="mono text-navy-muted">{row.conditionScore.toFixed(0)}</span>
                      </span>
                    </Traced>
                  </td>
                  <td className="mono whitespace-nowrap px-1.5 py-1 text-navy-faint">{shortDate(row.lastServicedOn)}</td>
                  <td className="mono whitespace-nowrap px-1.5 py-1 text-navy-muted">{shortDate(row.nextServiceDueOn)}</td>
                  <td className="mono whitespace-nowrap px-1.5 py-1 text-navy-muted">{row.sparePartNumber}</td>
                  <td className="mono whitespace-nowrap px-1.5 py-1 text-right">
                    <span className={row.stockCondition ? "font-semibold text-attention" : "text-navy-muted"}>
                      {int(row.onHandQty)}
                    </span>
                    <span className="text-navy-faint"> / {int(row.reorderPoint)}</span>
                  </td>
                  <td className="mono px-1.5 py-1 text-right text-navy-muted">{row.leadTimeDays}d</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
