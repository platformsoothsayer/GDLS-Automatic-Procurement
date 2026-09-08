import type { Screen } from "@/lib/routes"
import { Card } from "@/components/ui/Card"
import { Chip } from "@/components/ui/Chip"
import { Traced } from "@/components/lineage/Traced"
import type { SourceKey } from "@/data/nomenclature"
import { DATASET } from "@/lib/dataset"
import { int } from "@/lib/format"

/**
 * Scaffolding only.
 *
 * Screen content is not built yet. This renders the frame for a screen and a small
 * shell check so the navigation, the design system and the data view overlay can be
 * confirmed working before any screen is designed. It is meant to be deleted screen
 * by screen as the real content lands.
 */
export function ScreenPlaceholder({
  screen,
  intent,
  sourceChecks,
}: {
  screen: Screen
  intent: string
  sourceChecks: { key: SourceKey; label: string; value: string }[]
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan">
            Step <span className="mono">{String(screen.step).padStart(2, "0")}</span>
          </p>
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-navy">
            {screen.label}
          </h1>
          <p className="mt-1.5 max-w-[64ch] text-[14px] leading-relaxed text-navy-muted">{intent}</p>
        </div>
        <Chip tone="attention" className="mt-2 shrink-0">
          Screen content not yet built
        </Chip>
      </div>

      <Card
        primary
        title="Shell check"
        subtitle="Switch to Data view in the top bar, then click an outlined value to open its lineage."
      >
        <dl className="grid grid-cols-3 gap-x-6 gap-y-5">
          {sourceChecks.map((check) => (
            <div key={check.key}>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-navy-faint">
                {check.label}
              </dt>
              <dd className="mt-2">
                <Traced sourceKey={check.key} label={check.label}>
                  <span className="mono text-[20px] font-medium text-navy">{check.value}</span>
                </Traced>
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Dataset in place" subtitle="Generated deterministically at build time from a fixed seed.">
        <ul className="grid grid-cols-3 gap-x-6 gap-y-3 text-[13px]">
          {Object.entries(DATASET.meta.counts).map(([label, count]) => (
            <li key={label} className="flex items-baseline justify-between gap-3 border-b border-hairline pb-2">
              <span className="text-navy-muted">
                {label.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
              </span>
              <span className="mono font-medium text-navy">{int(count)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
