"use client"

/**
 * The collision, drawn.
 *
 * Today on the left, the supplier lead time window as a bar, and the predicted need
 * date as a marker. When the marker falls inside the bar the part arrives after it
 * was needed, and the overdue stretch is drawn in red. That is the whole point of
 * the timing condition, so it has to be readable in a glance.
 */

export function LeadTimeTimeline({
  leadTimeDays,
  daysUntilNeed,
}: {
  leadTimeDays: number
  daysUntilNeed: number
}) {
  const span = Math.max(leadTimeDays, daysUntilNeed) * 1.06 || 1
  const pct = (days: number) => Math.min(100, Math.max(0, (days / span) * 100))

  const arrives = pct(leadTimeDays)
  const need = pct(daysUntilNeed)
  const collides = daysUntilNeed <= leadTimeDays
  const lateBy = leadTimeDays - daysUntilNeed

  return (
    <div className="pt-3">
      <div className="relative h-1.5 w-full rounded-full bg-canvas ring-1 ring-inset ring-hairline">
        {/* Ordering today, the part is in transit up to this point. */}
        <span
          className="absolute inset-y-0 left-0 rounded-l-full bg-cyan/35"
          style={{ width: `${arrives}%` }}
        />
        {/* The stretch after the part was needed but before it can arrive. */}
        {collides && (
          <span
            className="absolute inset-y-0 bg-blocked/60"
            style={{ left: `${need}%`, width: `${Math.max(arrives - need, 1)}%` }}
          />
        )}
        {/* Today */}
        <span className="absolute -top-1 left-0 h-3.5 w-px bg-navy" />
        {/* Predicted need */}
        <span
          className={`absolute -top-1.5 h-4.5 w-[2px] ${collides ? "bg-blocked" : "bg-healthy"}`}
          style={{ left: `${need}%` }}
        />
      </div>

      <div className="relative mt-1 h-7 text-[9px] leading-tight">
        <span className="absolute left-0 text-navy-muted">
          today
          <br />
          <span className="mono">day 0</span>
        </span>
        <span
          className={`absolute -translate-x-1/2 text-center ${collides ? "font-semibold text-blocked" : "text-healthy"}`}
          style={{ left: `${Math.min(Math.max(need, 12), 82)}%` }}
        >
          need
          <br />
          <span className="mono">day {daysUntilNeed}</span>
        </span>
        <span className="absolute right-0 text-right text-navy-muted">
          part arrives
          <br />
          <span className="mono">day {leadTimeDays}</span>
        </span>
      </div>

      {collides && (
        <p className="mono text-[10px] font-medium text-blocked">
          asset waits {lateBy} days if ordered later than today
        </p>
      )}
    </div>
  )
}
