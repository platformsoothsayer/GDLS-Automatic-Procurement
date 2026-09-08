"use client"

/**
 * Stage 1. Three signal sources, one of them live.
 *
 * The two outlined tiles are the point: a staged build rather than an all at once
 * promise. The loop does not change when they are added.
 */

import { INTAKE_LINE, SIGNAL_SOURCES } from "@/data/procurement-content"
import type { Signal } from "@/lib/mro"
import { compactMoney, int } from "@/lib/format"

export function Stage1Intake({
  signals,
  selectedId,
  onSelect,
}: {
  signals: Signal[]
  selectedId: string | null
  onSelect: (signalId: string) => void
}) {
  const timing = signals.filter((s) => s.timingCondition).length

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="grid grid-cols-3 gap-2.5">
        {SIGNAL_SOURCES.map((source) => {
          const live = source.status === "LIVE"
          return (
            <div
              key={source.id}
              className={`rounded-card px-3 py-2 ${
                live
                  ? "border border-cyan bg-cyan-soft"
                  : "border border-dashed border-hairline bg-canvas"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[12px] font-semibold ${live ? "text-navy" : "text-navy-faint"}`}>
                  {source.label}
                </span>
                <span
                  className={`shrink-0 rounded border px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${
                    live
                      ? "border-cyan bg-cyan text-white"
                      : "border-hairline bg-surface text-navy-faint"
                  }`}
                >
                  {source.status === "LIVE" ? "live" : source.status === "PHASE_2" ? "phase 2" : "phase 3"}
                </span>
              </div>
              <p className={`mt-0.5 text-[10.5px] leading-snug ${live ? "text-navy-muted" : "text-navy-faint"}`}>
                {live ? (
                  <>
                    <span className="mono text-navy">{int(signals.length)}</span> signals ·{" "}
                    <span className="mono text-blocked">{int(timing)}</span> on timing
                  </>
                ) : (
                  source.note
                )}
              </p>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-navy-muted">{INTAKE_LINE}</p>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-hairline bg-surface">
        <table className="w-full border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-hairline text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint">
              <th className="px-2.5 py-1.5 text-left">Signal</th>
              <th className="px-2.5 py-1.5 text-left">Asset</th>
              <th className="px-1.5 py-1.5 text-center">Crit</th>
              <th className="px-2.5 py-1.5 text-left">Spare</th>
              <th className="px-2.5 py-1.5 text-left">Condition</th>
              <th className="px-2.5 py-1.5 text-right">Slack</th>
              <th className="px-2.5 py-1.5 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal) => (
              <tr
                key={signal.signalId}
                onClick={() => onSelect(signal.signalId)}
                className={`cursor-pointer border-b border-hairline/70 last:border-b-0 ${
                  selectedId === signal.signalId
                    ? "bg-cyan-soft"
                    : signal.timingCondition
                      ? "bg-blocked-soft/40 hover:bg-blocked-soft/60"
                      : "hover:bg-canvas"
                }`}
              >
                <td className="mono whitespace-nowrap px-2.5 py-1 text-navy">{signal.signalId}</td>
                <td className="max-w-[168px] truncate px-2.5 py-1 text-navy-muted">
                  <span className="mono">{signal.assetNumber}</span> {signal.assetDescription}
                </td>
                <td className="mono px-1.5 py-1 text-center text-navy-muted">{signal.criticality}</td>
                <td className="mono whitespace-nowrap px-2.5 py-1 text-navy-muted">{signal.sparePartNumber}</td>
                <td className="px-2.5 py-1">
                  <span
                    className={`rounded border px-1 py-px text-[9px] font-semibold uppercase ${
                      signal.timingCondition
                        ? "border-blocked bg-blocked text-white"
                        : "border-attention/40 bg-attention-soft text-attention"
                    }`}
                  >
                    {signal.timingCondition ? "timing" : "stock"}
                  </span>
                </td>
                <td
                  className={`mono px-2.5 py-1 text-right ${
                    signal.slackDays < 0 ? "font-semibold text-blocked" : "text-navy-muted"
                  }`}
                >
                  {signal.slackDays}d
                </td>
                <td className="mono px-2.5 py-1 text-right text-navy-muted">
                  {compactMoney(signal.estimatedValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
