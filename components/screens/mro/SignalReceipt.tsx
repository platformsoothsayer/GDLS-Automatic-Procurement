"use client"

/**
 * The other half of the handoff.
 *
 * Screen 4 writes a signal into the session and navigates here. This is what says it
 * arrived. It stays until screen 5 is built, at which point the real screen reads the
 * same session value.
 */

import { buildSignals } from "@/lib/mro"
import type { Signal } from "@/lib/mro"
import { useSession } from "@/context/SessionContext"
import { compactMoney, int } from "@/lib/format"

export function SignalReceipt({ signals }: { signals: Signal[] }) {
  const { selectedSignal } = useSession()
  if (!selectedSignal) return null

  const signal = signals.find((s) => s.signalId === selectedSignal.key)
  if (!signal) return null

  return (
    <section className="card-topbar relative mb-4 rounded-card border border-cyan-line bg-cyan-soft px-5 pb-4 pt-5 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan">
        Received from MRO signals
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[13px]">
        <span className="mono font-medium text-navy">{signal.signalId}</span>
        <span className="text-navy-muted">
          asset <span className="mono text-navy">{signal.assetNumber}</span>
        </span>
        <span className="text-navy-muted">
          criticality <span className="mono text-navy">{signal.criticality}</span>
        </span>
        <span className="text-navy-muted">
          spare <span className="mono text-navy">{signal.sparePartNumber}</span>
        </span>
        <span className="text-navy-muted">
          proposes <span className="mono text-navy">{int(signal.estimatedOrderQty)}</span> at{" "}
          <span className="mono text-navy">{compactMoney(signal.estimatedValue)}</span>
        </span>
        <span
          className={`rounded border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${
            signal.timingCondition
              ? "border-blocked bg-blocked text-white"
              : "border-attention/40 bg-attention-soft text-attention"
          }`}
        >
          {signal.timingCondition ? "timing" : "stock"}
        </span>
      </div>
      <p className="mt-1.5 text-[12px] leading-snug text-navy-muted">{signal.reason}</p>
    </section>
  )
}

export function signalsForReceipt(): Signal[] {
  return buildSignals()
}
