"use client"

/**
 * Three ways to get a fabric, with a verdict on each.
 *
 * The first row has to be fair. Off the shelf products are genuinely better where
 * the problem is operational technology and sensor data, and saying so is what makes
 * the second row credible.
 */

import { FEDERATION_OPTIONS } from "@/data/fabric-content"
import { Chip } from "@/components/ui/Chip"

export function FederationPanel() {
  return (
    <section className="rounded-card border border-hairline bg-surface px-4 py-2 [@media(max-height:860px)]:py-1.5 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-faint">
        How the fabric gets built
      </p>

      <ul className="mt-1 divide-y divide-hairline">
        {FEDERATION_OPTIONS.map((option) => (
          <li key={option.id} className="flex items-start gap-2.5 py-[3px] first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold leading-tight text-navy">{option.title}</p>
              <p className="mt-0.5 text-[10px] leading-[13px] text-navy-muted">{option.body}</p>
            </div>
            <Chip tone={option.tone} className="mt-0.5 shrink-0">
              {option.verdict}
            </Chip>
          </li>
        ))}
      </ul>
    </section>
  )
}
