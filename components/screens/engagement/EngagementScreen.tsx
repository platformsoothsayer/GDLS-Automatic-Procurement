"use client"

/**
 * Screen 7. What it would take to make this real.
 *
 * No new demonstration content: the architecture reads the same derived figures the
 * fabric screen uses, and the roadmap bands are the accretion horizons from screen 6.
 * No pricing, no logos, no testimonials, and no recommendation on deployment.
 */

import {
  DEPLOYMENT_COLUMNS,
  DEPLOYMENT_NOTE,
  DEPLOYMENT_ROWS,
  ROADMAP,
  ROADMAP_NOTE,
  STAFFING,
  STAFFING_NOTE,
  UNCHANGED_ACROSS_OPTIONS,
  WHAT_WE_NEED,
} from "@/data/engagement-content"
import { ACCRETION_STEPS } from "@/data/fabric-content"
import type { FabricFigures } from "@/lib/fabric"
import { ArchitectureDiagram } from "@/components/screens/engagement/ArchitectureDiagram"

function Section({
  n,
  title,
  aside,
  children,
}: {
  n: number
  title: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-card border border-hairline bg-surface px-4 py-2 shadow-card">
      <header className="mb-1.5 flex items-baseline justify-between gap-4">
        <h2 className="flex items-baseline gap-2 text-[12px] font-semibold text-navy">
          <span className="mono text-[10px] text-cyan">0{n}</span>
          {title}
        </h2>
        {aside && (
          <p className="max-w-[52ch] text-right text-[10px] leading-tight text-navy-faint">{aside}</p>
        )}
      </header>
      {children}
    </section>
  )
}

export function EngagementScreen({ figures }: { figures: FabricFigures }) {
  return (
    <div className="flex flex-col gap-2">
      <Section n={1} title="End to end architecture" aside="Extraction through write back">
        <ArchitectureDiagram figures={figures} />
      </Section>

      <Section n={2} title="Deployment options" aside={DEPLOYMENT_NOTE}>
        <table className="w-full border-collapse text-[9.5px]">
          <thead>
            <tr>
              <th className="w-[150px] py-1 text-left text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint" />
              {DEPLOYMENT_COLUMNS.map((column) => (
                <th key={column.id} className="px-2 py-0.5 text-left text-[10.5px] font-semibold text-navy">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-y border-hairline bg-canvas">
              <th className="py-0.5 text-left align-top text-[9px] font-semibold uppercase tracking-wide text-navy-muted">
                Pipeline stages
              </th>
              <td colSpan={3} className="px-2 py-0.5 text-[10px] text-navy">
                <span className="font-medium">Identical in all three.</span> {UNCHANGED_ACROSS_OPTIONS}
              </td>
            </tr>
            {DEPLOYMENT_ROWS.map((row) => (
              <tr key={row.id} className="border-b border-hairline/70 align-top last:border-b-0">
                <th className="py-1 pr-2 text-left text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint">
                  {row.label}
                </th>
                {DEPLOYMENT_COLUMNS.map((column) => (
                  <td key={column.id} className="px-2 py-0.5 leading-[12px] text-navy-muted">
                    {column[row.id]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section n={3} title="What we need from you">
        <ul className="grid grid-cols-5 gap-2">
          {WHAT_WE_NEED.map((ask) => (
            <li key={ask.title} className="rounded border border-hairline bg-canvas px-2 py-1">
              <p className="text-[10px] font-semibold leading-tight text-navy">{ask.title}</p>
              <p className="mt-0.5 text-[9px] leading-[11px] text-navy-muted">{ask.detail}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section n={4} title="Roadmap" aside={ROADMAP_NOTE}>
        <div className="space-y-1">
          {ROADMAP.map((band) => {
            const step = ACCRETION_STEPS.find((s) => s.id === band.accretionId)
            const provisional = band.confidence === "PROVISIONAL"
            return (
              <div
                key={band.accretionId}
                className={`grid grid-cols-[138px_150px_1fr_212px] gap-3 rounded border px-2.5 py-1 ${
                  provisional ? "border-dashed border-hairline bg-canvas" : "border-cyan-line bg-cyan-soft/50"
                }`}
              >
                <div>
                  <p className="text-[10px] font-semibold leading-tight text-navy">{band.label}</p>
                  <p className="mt-0.5 text-[8.5px] leading-[11px] text-navy-faint">{band.duration}</p>
                  {step && <p className="mono mt-0.5 text-[8.5px] text-navy-faint">{step.label}</p>}
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-navy-faint">Sources added</p>
                  <p className="text-[9.5px] leading-[11px] text-navy-muted">{band.sourcesAdded}</p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-navy-faint">Problems addressed</p>
                  <ul className="space-y-px">
                    {band.problemsUnlocked.map((item) => (
                      <li key={item} className="text-[9.5px] leading-[11px] text-navy-muted">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-navy-faint">
                    Decision at the end
                  </p>
                  <p className="text-[9.5px] leading-[11px] text-navy">{band.decisionPoint}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      <Section n={5} title="How we would staff it">
        <ul className="grid grid-cols-4 gap-2">
          {STAFFING.map((role) => (
            <li key={role.role} className="rounded border border-hairline bg-canvas px-2 py-1">
              <p className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-navy">{role.role}</span>
                <span className="text-[9px] text-navy-faint">{role.commitment}</span>
              </p>
              <p className="mt-0.5 text-[9px] leading-[11px] text-navy-muted">{role.does}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-[92ch] text-[11px] leading-snug text-navy">{STAFFING_NOTE}</p>
      </Section>

      {/* Clearance so the last card never sits under the fixed end of walkthrough marker. */}
      <div className="h-10" aria-hidden />
    </div>
  )
}
