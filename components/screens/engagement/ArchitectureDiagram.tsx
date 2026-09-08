"use client"

/**
 * End to end, extraction through write back.
 *
 * The forward path runs left to right. The write back path runs back underneath it,
 * and the human approval gate on that path is drawn as its own element rather than
 * as a footnote, because it is the part that decides whether any of this is allowed
 * near a production system.
 */

import { getSource, SYSTEM_LABEL } from "@/data/nomenclature"
import { ENGAGEMENT_SYSTEMS } from "@/data/fabric-content"
import type { FabricFigures } from "@/lib/fabric"
import { Traced } from "@/components/lineage/Traced"
import { int } from "@/lib/format"

function Node({
  title,
  lines,
  tone = "plain",
  wide = false,
}: {
  title: string
  lines: React.ReactNode[]
  tone?: "plain" | "navy" | "cyan"
  wide?: boolean
}) {
  return (
    <div
      className={`min-w-0 rounded border px-2 py-1 ${wide ? "flex-[1.4]" : "flex-1"} ${
        tone === "navy"
          ? "border-navy bg-navy text-white"
          : tone === "cyan"
            ? "border-cyan bg-cyan-soft"
            : "border-hairline bg-surface"
      }`}
    >
      <p className={`text-[10px] font-semibold leading-tight ${tone === "navy" ? "text-white" : "text-navy"}`}>
        {title}
      </p>
      <ul className={`mt-0.5 space-y-px ${tone === "navy" ? "text-white/75" : "text-navy-muted"}`}>
        {lines.map((line, i) => (
          <li key={i} className="text-[9px] leading-[11px]">
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

const Arrow = () => (
  <span className="self-center px-0.5 text-[11px] leading-none text-navy-faint" aria-hidden>
    ›
  </span>
)

export function ArchitectureDiagram({ figures }: { figures: FabricFigures }) {
  const [oracle, teamcenter] = figures.sources
  const interfaceObject = getSource("WRITEBACK.REQ_INTERFACE").object

  return (
    <div className="space-y-1">
      <div className="flex items-stretch gap-1">
        <Node
          title="Source systems"
          tone="navy"
          lines={[SYSTEM_LABEL[oracle.system], SYSTEM_LABEL[teamcenter.system]]}
        />
        <Arrow />
        <Node
          title="Extraction"
          lines={[
            <>
              {SYSTEM_LABEL[oracle.system]} <span className="mono">{oracle.method}</span>
            </>,
            <>
              {SYSTEM_LABEL[teamcenter.system]} <span className="mono">{teamcenter.method}</span>
            </>,
          ]}
        />
        <Arrow />
        <Node
          title="Landing zone"
          lines={[
            <>
              Bronze · <span className="mono">{int(figures.bronze.objects)}</span> objects
            </>,
            <>
              <span className="mono">{int(figures.bronze.rows)}</span> rows, unreshaped
            </>,
          ]}
        />
        <Arrow />
        <Node
          title="Conformance and resolution"
          wide
          lines={[
            "Silver · one conformed part record",
            <>
              <span className="mono">{int(figures.resolution.partsIn)}</span> to{" "}
              <span className="mono">{int(figures.resolution.partsOut)}</span> parts,{" "}
              <span className="mono">{int(figures.resolution.supplierSites)}</span> to{" "}
              <span className="mono">{int(figures.resolution.suppliers)}</span> suppliers
            </>,
          ]}
        />
        <Arrow />
        <Node
          title="Gold marts"
          tone="cyan"
          lines={figures.marts.map((m) => (
            <span key={m.mart} className="mono">
              {m.mart}
            </span>
          ))}
        />
        <Arrow />
        <Node
          title="Consuming applications"
          lines={ENGAGEMENT_SYSTEMS.map((sys) => sys.label)}
        />
      </div>

      {/* Write back, running back the other way underneath. */}
      <div className="flex items-stretch gap-1 rounded border border-dashed border-attention/50 bg-attention-soft/40 px-1.5 py-1">
        <span className="self-center whitespace-nowrap px-1 text-[9.5px] font-semibold uppercase tracking-wide text-attention">
          Write back
        </span>
        <span className="self-center text-[11px] leading-none text-attention" aria-hidden>
          ‹
        </span>
        <div className="min-w-0 flex-1 rounded border border-attention bg-surface px-2 py-1">
          <p className="text-[10px] font-semibold leading-tight text-attention">Human approval gate</p>
          <p className="text-[9px] leading-[11px] text-navy-muted">
            A person approves in the source system. Nothing passes this point automatically.
          </p>
        </div>
        <span className="self-center text-[11px] leading-none text-attention" aria-hidden>
          ‹
        </span>
        <div className="min-w-0 flex-1 rounded border border-hairline bg-surface px-2 py-1">
          <p className="text-[10px] font-semibold leading-tight text-navy">Interface mechanism</p>
          <Traced sourceKey="WRITEBACK.REQ_INTERFACE" label="Interface mechanism" tag="inline" detail="layer">
            <span className="mono block text-[9px] leading-[11px] text-navy-muted">
              {interfaceObject}
            </span>
          </Traced>
        </div>
        <span className="self-center text-[11px] leading-none text-attention" aria-hidden>
          ‹
        </span>
        <div className="min-w-0 flex-1 rounded border border-navy bg-navy px-2 py-1">
          <p className="text-[10px] font-semibold leading-tight text-white">
            {SYSTEM_LABEL[oracle.system]}
          </p>
          <p className="text-[9px] leading-[11px] text-white/75">
            Document created unapproved. Approved by a person, in the source system.
          </p>
        </div>
        <span className="self-center whitespace-nowrap px-1 text-[9px] text-attention/80">
          only if the pre-populated mode is in scope
        </span>
      </div>
    </div>
  )
}
