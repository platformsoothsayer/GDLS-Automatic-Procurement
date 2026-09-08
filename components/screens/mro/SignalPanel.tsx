"use client"

/**
 * Active signals, each carrying enough context to act on without leaving the screen.
 *
 * Timing signals are drawn loudest, because a part that arrives after it was needed
 * is the failure this screen exists to catch. One action per card: send it to
 * procurement.
 */

import { useRouter } from "next/navigation"
import type { Signal } from "@/lib/mro"
import { LeadTimeTimeline } from "@/components/screens/mro/LeadTimeTimeline"
import { Traced } from "@/components/lineage/Traced"
import { useSession } from "@/context/SessionContext"
import { compactMoney, int } from "@/lib/format"

function Fact({ label, value, tone }: { label: string; value: string; tone?: "attention" }) {
  return (
    <span className="min-w-0">
      <span className="block text-[9px] uppercase tracking-wide text-navy-faint">{label}</span>
      <span className={`mono block truncate text-[11px] ${tone === "attention" ? "font-semibold text-attention" : "text-navy"}`}>
        {value}
      </span>
    </span>
  )
}

function SignalCard({
  signal,
  sent,
  selected,
  onSend,
}: {
  signal: Signal
  sent: boolean
  selected: boolean
  onSend: () => void
}) {
  const timing = signal.timingCondition

  return (
    <li
      id={`signal-${signal.assetNumber}`}
      className={`rounded-card border bg-surface shadow-card ${
        selected ? "ring-1 ring-cyan" : ""
      } ${timing ? "border-blocked/40" : "border-hairline"}`}
    >
      <header
        className={`flex items-center justify-between gap-2 rounded-t-card border-b px-3 py-1.5 ${
          timing ? "border-blocked/25 bg-blocked-soft" : "border-hairline bg-canvas"
        }`}
      >
        <span className="flex items-baseline gap-2">
          <span className="mono text-[11.5px] font-medium text-navy">{signal.assetNumber}</span>
          <span className="truncate text-[10.5px] text-navy-muted">{signal.assetDescription}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span
            className={`rounded border px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${
              signal.criticality === 1
                ? "border-navy bg-navy text-white"
                : "border-hairline bg-surface text-navy-muted"
            }`}
          >
            crit {signal.criticality}
          </span>
          <span
            className={`rounded border px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${
              timing ? "border-blocked bg-blocked text-white" : "border-attention/40 bg-attention-soft text-attention"
            }`}
          >
            {timing ? "timing" : "stock"}
          </span>
        </span>
      </header>

      <div className="px-3 py-2">
        <div className="grid grid-cols-4 gap-2">
          <Fact label="Spare" value={signal.sparePartNumber} />
          <Traced sourceKey="PART.ORACLE_ONHAND" label={`${signal.sparePartNumber} on hand`} tag="inline" detail="layer">
            <Fact
              label="On hand"
              value={`${int(signal.onHandQty)}`}
              tone={signal.stockCondition ? "attention" : undefined}
            />
          </Traced>
          <Fact label="Reorder pt" value={int(signal.reorderPoint)} />
          <Traced sourceKey="PART.ORACLE_PLANNING" label={`${signal.sparePartNumber} lead time`} tag="inline" detail="layer">
            <Fact label="Lead time" value={`${signal.leadTimeDays} d`} />
          </Traced>
        </div>

        <p className="mt-1.5 truncate text-[10px] text-navy-faint">
          {signal.location} · <span className="text-navy-muted">{signal.supplierName}</span>
        </p>

        <Traced sourceKey="MRO.CONDITION_SIGNAL" label={`${signal.signalId} reason`} tag="inline" detail="layer" className="mt-1.5 block">
          <p className={`text-[10.5px] leading-snug ${timing ? "text-blocked" : "text-navy-muted"}`}>
            {signal.reason}
          </p>
        </Traced>

        {timing && (
          <LeadTimeTimeline leadTimeDays={signal.leadTimeDays} daysUntilNeed={signal.daysUntilNeed} />
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-navy-faint">
            proposes <span className="mono text-navy-muted">{int(signal.estimatedOrderQty)}</span> ·{" "}
            <span className="mono text-navy-muted">{compactMoney(signal.estimatedValue)}</span>
          </span>
          <button
            type="button"
            onClick={onSend}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              sent
                ? "border border-healthy/40 bg-healthy-soft text-healthy"
                : timing
                  ? "bg-blocked text-white hover:bg-[#a11a1a]"
                  : "bg-navy text-white hover:bg-[#163a5e]"
            }`}
          >
            {sent ? "Sent · open procurement →" : "Send to procurement →"}
          </button>
        </div>
      </div>
    </li>
  )
}

export function SignalPanel({
  signals,
  selectedAsset,
  onSelectAsset,
}: {
  signals: Signal[]
  selectedAsset: string | null
  onSelectAsset: (assetNumber: string) => void
}) {
  const router = useRouter()
  const { selectSignal, selectedSignal } = useSession()

  const send = (signal: Signal) => {
    onSelectAsset(signal.assetNumber)
    selectSignal(
      signal.signalId,
      `${signal.assetNumber} · spare ${signal.sparePartNumber} · ${signal.timingCondition ? "timing" : "stock"}`
    )
    router.push("/procurement")
  }

  const timingCount = signals.filter((s) => s.timingCondition).length

  return (
    <div className="flex h-full min-h-0 flex-col rounded-card border border-hairline bg-canvas">
      <header className="flex items-baseline justify-between border-b border-hairline bg-surface px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-faint">
          Active signals
        </span>
        <span className="text-[10px] text-navy-faint">
          <span className="mono text-blocked">{timingCount}</span> timing ·{" "}
          <span className="mono text-navy-muted">{signals.length - timingCount}</span> stock · values
          illustrative
        </span>
      </header>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {signals.map((signal) => (
          <SignalCard
            key={signal.signalId}
            signal={signal}
            sent={selectedSignal?.key === signal.signalId}
            selected={selectedAsset === signal.assetNumber}
            onSend={() => send(signal)}
          />
        ))}
      </ul>
    </div>
  )
}
