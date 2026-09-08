"use client"

/**
 * Completeness organized by the process that needs the field, not as a score.
 *
 * A part with a missing lead time is not a low quality record in the abstract. It is
 * a part that cannot be bought automatically, and that is what the card says.
 */

import { COMPLETENESS_CLOSING, INTEGRITY_TITLE } from "@/data/parts-content"
import type { IntegrityFinding, ProcessCard } from "@/lib/parts"
import { Traced } from "@/components/lineage/Traced"
import { int } from "@/lib/format"

function Bar({ pct }: { pct: number }) {
  const tone = pct >= 95 ? "bg-healthy" : pct >= 80 ? "bg-cyan" : "bg-attention"
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-canvas ring-1 ring-inset ring-hairline">
      <span className={`block h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
    </span>
  )
}

export function CompletenessTab({
  cards,
  findings,
}: {
  cards: ProcessCard[]
  findings: IntegrityFinding[]
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <section
            key={card.id}
            className="card-topbar relative rounded-card border border-hairline bg-surface px-4 pb-3 pt-4 shadow-card"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-navy">{card.title}</h3>
              <span className="text-[10px] text-navy-faint">
                <span className="mono">{int(card.scopeCount)}</span> {card.scopeLabel}
              </span>
            </div>

            <ul className="mt-2 space-y-1">
              {card.fields.map((field) => (
                <li key={field.id}>
                  <Traced sourceKey={field.sourceKey} label={`${card.title} · ${field.label}`} tag="inline" detail="layer" className="w-full">
                    <span className="block w-full">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[11px] text-navy-muted">{field.label}</span>
                        <span className="mono shrink-0 text-[11px] text-navy">{field.completePct}%</span>
                      </span>
                      <Bar pct={field.completePct} />
                      <span className="mt-0.5 block text-[9.5px] text-navy-faint">
                        <span className="mono">{int(field.blockedCount)}</span> parts blocked
                      </span>
                    </span>
                  </Traced>
                </li>
              ))}
            </ul>

            {card.headline && (
              <p className="mt-2 rounded border border-attention/30 bg-attention-soft px-2 py-1.5 text-[11px] leading-snug text-attention">
                {card.headline}
              </p>
            )}
          </section>
        ))}
      </div>

      <section className="min-h-0 rounded-card border border-hairline bg-surface px-4 py-2.5 shadow-card">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-navy-faint">{INTEGRITY_TITLE}</h3>
        <ul className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1">
          {findings.map((finding) => (
            <li key={finding.id} className="flex items-start gap-3 border-b border-hairline pb-1">
              <Traced sourceKey={finding.sourceKey} label={finding.label} tag="inline" detail="layer">
                <span className="mono w-12 shrink-0 text-right text-[15px] font-medium leading-tight text-navy">
                  {int(finding.count)}
                </span>
              </Traced>
              <span className="min-w-0">
                <span className="block text-[11.5px] font-medium leading-tight text-navy">{finding.label}</span>
                <span className="block text-[10.5px] leading-snug text-navy-muted">{finding.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[13px] font-medium text-navy">{COMPLETENESS_CLOSING}</p>
    </div>
  )
}
