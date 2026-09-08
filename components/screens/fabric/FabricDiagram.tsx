"use client"

/**
 * The fabric screen. One component, shown twice.
 *
 *   /fabric        populated false, at the start of the session
 *   /fabric/live   populated true, at the end, reading what the session produced
 *
 * The diagram is the same object in both states. Nothing is rebuilt between them and
 * nothing is rebuilt when the accretion slider moves, so the room sees one thing
 * filling in rather than two different pictures.
 */

import { useState } from "react"
import { SYSTEM_LABEL } from "@/data/nomenclature"
import {
  ACCRETION_STEPS,
  CLOSING_LINE,
  CONFORMED,
  DORMANT_NOTE,
  DORMANT_SOURCES,
  EMPTY_LINE,
  ENGAGEMENT_SYSTEMS,
  GOVERNANCE_LABELS,
  LAYER_ONE_CAPTION,
  PIPELINE,
  RESIDENCY_OPTIONS,
  RESOLVE_CAPTION,
} from "@/data/fabric-content"
import type { FabricFigures } from "@/lib/fabric"
import { useSession } from "@/context/SessionContext"
import { Traced } from "@/components/lineage/Traced"
import { FederationPanel } from "@/components/screens/fabric/FederationPanel"
import { int } from "@/lib/format"

/** Lets a snake_case identifier wrap at its underscores instead of mid word. */
function MartName({ name }: { name: string }) {
  const parts = name.split("_")
  return (
    <span className="mono block min-w-0 text-[8px] leading-[9px] text-navy">
      {parts.map((part, i) => (
        <span key={`${part}-${i}`}>
          {part}
          {i < parts.length - 1 && (
            <>
              _<wbr />
            </>
          )}
        </span>
      ))}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * Small pieces
 * ------------------------------------------------------------------ */

function LayerLabel({ n, title }: { n: number; title: string }) {
  return (
    <p className="mb-1.5 flex items-baseline gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-faint">
      <span className="mono">L{n}</span>
      <span>{title}</span>
    </p>
  )
}

const LAYER_CHIP = {
  Bronze: "border-attention/30 bg-attention-soft text-attention",
  Silver: "border-hairline bg-canvas text-navy-muted",
  Gold: "border-cyan-line bg-cyan-soft text-navy",
} as const

/** One line inside a pipeline stage. */
function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-1 leading-[13px]">
      <span className="truncate text-navy-muted">{label}</span>
      {value !== undefined && <span className="mono shrink-0 text-navy">{value}</span>}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Diagram
 * ------------------------------------------------------------------ */

export function FabricDiagram({
  populated,
  figures,
}: {
  populated: boolean
  figures: FabricFigures
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const [residencyId, setResidencyId] = useState(RESIDENCY_OPTIONS[0].id)
  const { countOf } = useSession()

  const step = ACCRETION_STEPS[stepIndex]
  const residency = RESIDENCY_OPTIONS.find((o) => o.id === residencyId)!
  const activeDormant = new Set(step.activates)

  const [oracle, teamcenter] = figures.sources
  const { resolution, marts } = figures

  /* ---------------- pipeline stage bodies ---------------- */

  const stageBody = (id: string): React.ReactNode => {
    if (!populated) return null

    switch (id) {
      case "sources":
        return (
          <>
            <Traced sourceKey={oracle.sourceKey} label="Oracle rows extracted" tag="inline" detail="layer" className="w-full">
              <Row label={SYSTEM_LABEL[oracle.system]} value={int(oracle.rows)} />
            </Traced>
            <Traced sourceKey={teamcenter.sourceKey} label="Teamcenter rows extracted" tag="inline" detail="layer" className="w-full">
              <Row label={SYSTEM_LABEL[teamcenter.system]} value={int(teamcenter.rows)} />
            </Traced>
          </>
        )
      case "extract":
        return (
          <>
            <Row label={SYSTEM_LABEL[oracle.system]} />
            <p className="mono mb-1 text-navy">{oracle.method}</p>
            <Row label={SYSTEM_LABEL[teamcenter.system]} />
            <p className="mono text-navy">{teamcenter.method}</p>
          </>
        )
      case "land":
        return (
          <>
            <Row label="objects" value={int(figures.bronze.objects)} />
            <Row label="rows" value={int(figures.bronze.rows)} />
            <Row label={SYSTEM_LABEL[oracle.system]} value={int(oracle.objects)} />
            <Row label={SYSTEM_LABEL[teamcenter.system]} value={int(teamcenter.objects)} />
          </>
        )
      case "conform":
        return (
          <ul className="space-y-[3px] leading-[13px] text-navy-muted">
            {CONFORMED.map((c) => (
              <li key={c} className="truncate">
                {c}
              </li>
            ))}
          </ul>
        )
      case "resolve":
        return (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <Traced sourceKey="DUP.CLUSTER_MEMBERSHIP" label="Parts resolved" tag="inline" detail="layer" className="col-span-2 w-full">
              <Row
                label="parts"
                value={
                  <>
                    {int(resolution.partsIn)} <span className="text-navy-faint">→</span> {int(resolution.partsOut)}
                  </>
                }
              />
            </Traced>
            <Traced sourceKey="SUP.SITE" label="Suppliers resolved" tag="inline" detail="layer" className="col-span-2 w-full">
              <Row
                label="suppliers"
                value={
                  <>
                    {int(resolution.supplierSites)} <span className="text-navy-faint">→</span> {int(resolution.suppliers)}
                  </>
                }
              />
            </Traced>
            <SessionStat label="merged" value={countOf("CLUSTER_MERGED")} />
            <SessionStat label="to engineering" value={countOf("CLUSTER_ROUTED_TO_ENGINEERING")} />
          </div>
        )
      case "publish":
        return (
          <ul className="space-y-[2px]">
            {marts.map((m) => (
              <li key={m.sourceKey}>
                <Traced sourceKey={m.sourceKey} label={m.mart} tag="inline" detail="layer" className="w-full">
                  <span className="flex w-full items-end justify-between gap-1">
                    <MartName name={m.mart} />
                    <span className="mono shrink-0 text-[8px] leading-[9px] text-navy-muted">
                      {int(m.rows)}
                    </span>
                  </span>
                </Traced>
              </li>
            ))}
          </ul>
        )
      case "consume":
        return (
          <ul className="space-y-[3px]">
            {ENGAGEMENT_SYSTEMS.map((sys) => (
              <li key={sys.id}>
                <span className="block truncate text-[9px] leading-[11px] text-navy">{sys.label}</span>
                <span className="mono block truncate text-[8px] leading-[10px] text-navy-faint">
                  {marts[sys.martIndex].mart}
                </span>
              </li>
            ))}
          </ul>
        )
      default:
        return null
    }
  }

  const totalWeight = PIPELINE.reduce((s, st) => s + st.weight, 0)

  return (
    <div className="flex flex-col gap-2 [@media(max-height:860px)]:gap-1.5">
      {/* ---------------- The three layers ---------------- */}
      <div className="flex flex-col gap-1.5 [@media(max-height:860px)]:gap-1">
        {/* Layer 3 */}
        <section className="rounded-card border border-hairline bg-surface px-4 py-2 [@media(max-height:860px)]:py-1 shadow-card">
          <LayerLabel n={3} title="Systems of engagement" />
          <div className="grid grid-cols-3 gap-3">
            {ENGAGEMENT_SYSTEMS.map((sys) => {
              const count = countOf(...sys.countKinds)
              return (
                <div
                  key={sys.id}
                  className={`flex h-[38px] [@media(max-height:860px)]:h-[32px] items-center justify-between gap-2 rounded border px-3 transition-colors duration-500 ${
                    populated ? "border-cyan-line bg-cyan-soft" : "border-hairline bg-canvas"
                  }`}
                >
                  <span className={`text-[12px] font-medium ${populated ? "text-navy" : "text-navy-faint"}`}>
                    {sys.label}
                  </span>
                  {populated && (
                    <span className="shrink-0 text-right">
                      <span className="mono text-[15px] font-medium leading-none text-cyan">{count}</span>
                      <span className="mt-0.5 block text-[9px] leading-none text-navy-faint">
                        {count === 1 ? sys.unit.replace(/s$/, "") : sys.unit}
                      </span>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Layer 2 */}
        <section className="card-topbar relative rounded-card border border-hairline bg-surface px-4 pb-2.5 pt-3.5 [@media(max-height:860px)]:pb-1.5 [@media(max-height:860px)]:pt-2.5 shadow-card">
          <LayerLabel n={2} title="The fabric" />

          <div className="flex items-stretch gap-1.5">
            {PIPELINE.map((stage, i) => (
              <div key={stage.id} className="contents">
                <div
                  style={{ flex: `${stage.weight} 1 0%` }}
                  className={`relative min-w-0 rounded border px-2 py-1.5 transition-colors duration-300 ${
                    stage.anchor
                      ? "border-cyan bg-cyan-soft"
                      : populated
                        ? "border-hairline bg-surface"
                        : "border-hairline bg-surface"
                  }`}
                >
                  <p className="mb-1 flex items-center gap-1">
                    <span
                      className={`text-[11px] font-semibold leading-none ${
                        stage.anchor ? "text-cyan" : "text-navy"
                      }`}
                    >
                      {stage.name}
                    </span>
                    {stage.layer && (
                      <span
                        className={`rounded-sm border px-1 text-[8px] font-medium uppercase leading-[12px] ${
                          LAYER_CHIP[stage.layer]
                        }`}
                      >
                        {stage.layer}
                      </span>
                    )}
                  </p>
                  <div className="h-[88px] overflow-hidden text-[9.5px]">{stageBody(stage.id)}</div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <span className="self-center text-[11px] leading-none text-navy-faint" aria-hidden>
                    ›
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Anchor caption, positioned under the resolve stage. */}
          <div className="mt-1 flex gap-1.5" aria-hidden={false}>
            {PIPELINE.map((stage, i) => (
              <div key={stage.id} className="contents">
                <div style={{ flex: `${stage.weight} 1 0%` }} className="min-w-0">
                  {stage.anchor && (
                    <p className="text-center text-[9.5px] leading-[11px] text-cyan">{RESOLVE_CAPTION}</p>
                  )}
                </div>
                {i < PIPELINE.length - 1 && <span className="w-[7px]" />}
              </div>
            ))}
          </div>
          <span className="sr-only">{`Pipeline weight total ${totalWeight}`}</span>

          {/* Governance bar */}
          <div className="mt-2 [@media(max-height:860px)]:mt-1 flex items-center gap-3 rounded border border-hairline bg-canvas px-3 py-1">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-navy-muted">
              Governance and ownership
            </span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-navy">
              {GOVERNANCE_LABELS.map((label) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="inline-block h-1 w-1 rounded-full bg-healthy" aria-hidden />
                  {label}
                </span>
              ))}
            </span>
          </div>

          {/* Security and residency bar */}
          <div className="mt-1.5 [@media(max-height:860px)]:mt-1 rounded border border-hairline bg-canvas px-3 py-1.5">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-navy-muted">
                Security and residency
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {RESIDENCY_OPTIONS.map((option) => {
                  const active = option.id === residencyId
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setResidencyId(option.id)}
                      aria-pressed={active}
                      className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
                        active
                          ? "border-cyan bg-cyan text-white"
                          : "border-hairline bg-surface text-navy-muted hover:border-cyan-line"
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-navy-muted">{residency.line}</p>
          </div>
        </section>

        {/* Layer 1 */}
        <section className="rounded-card border border-hairline bg-surface px-4 py-1.5 [@media(max-height:860px)]:py-1 shadow-card">
          <LayerLabel n={1} title="Systems of record" />
          <div className="flex items-start gap-4">
            <div className="flex shrink-0 gap-2">
              {[oracle, teamcenter].map((source) => (
                <span
                  key={source.system}
                  className="rounded bg-navy px-3 py-1.5 text-[12px] font-medium text-white"
                >
                  {SYSTEM_LABEL[source.system]}
                </span>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5">
                {DORMANT_SOURCES.map((source) => {
                  const active = activeDormant.has(source.id)
                  return (
                    <span
                      key={source.id}
                      className={`rounded border px-2 py-1 text-[11px] transition-colors duration-500 ${
                        active
                          ? "border-navy bg-navy text-white"
                          : "border-dashed border-hairline bg-canvas text-navy-faint"
                      }`}
                    >
                      {source.label}
                    </span>
                  )
                })}
              </div>
              <p className="mt-0.5 text-[10px] text-navy-faint">{DORMANT_NOTE}</p>
            </div>
          </div>
          <p className="mt-1 border-t border-hairline pt-1 text-[11.5px] italic text-navy-muted">
            {LAYER_ONE_CAPTION}
          </p>
        </section>
      </div>

      {/* ---------------- Accretion and federation ---------------- */}
      <div className="grid grid-cols-[1fr_400px] gap-3 [@media(max-height:860px)]:gap-2">
        <AccretionSlider stepIndex={stepIndex} onChange={setStepIndex} />
        <FederationPanel />
      </div>

      <p
        className={
          populated
            ? "text-[15px] font-semibold leading-snug text-navy [@media(max-height:860px)]:text-[13px]"
            : "text-[12px] text-navy-muted"
        }
      >
        {populated ? CLOSING_LINE : EMPTY_LINE}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Session driven figure inside the resolve stage
 * ------------------------------------------------------------------ */

function SessionStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm bg-surface/70 px-1.5 py-0.5 ring-1 ring-inset ring-cyan-line">
      <span className="mono block text-[13px] font-medium leading-none text-navy">{value}</span>
      <span className="block truncate text-[8.5px] leading-tight text-navy-faint">{label} · session</span>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Accretion slider
 * ------------------------------------------------------------------ */

function AccretionSlider({
  stepIndex,
  onChange,
}: {
  stepIndex: number
  onChange: (index: number) => void
}) {
  const step = ACCRETION_STEPS[stepIndex]

  // Every entity chip stays mounted at every position. Later ones fade and expand in
  // rather than being added to the DOM, so the list grows instead of being rebuilt.
  const entities = ACCRETION_STEPS.flatMap((s, i) =>
    s.entitiesGained.map((label) => ({ label, availableAt: i }))
  )

  return (
    <section className="flex flex-col rounded-card border border-hairline bg-surface px-4 py-3 [@media(max-height:860px)]:py-2 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-faint">Accretion</p>
        <p className="text-[11px] text-navy-muted">{step.summary}</p>
      </div>

      <div
        role="radiogroup"
        aria-label="Accretion horizon"
        className="relative mt-3 flex items-start justify-between"
      >
        <span className="absolute left-[6%] right-[6%] top-[5px] h-0.5 rounded bg-hairline" aria-hidden />
        <span
          className="absolute left-[6%] top-[5px] h-0.5 rounded bg-cyan transition-all duration-500"
          style={{ width: `${(stepIndex / (ACCRETION_STEPS.length - 1)) * 88}%` }}
          aria-hidden
        />
        {ACCRETION_STEPS.map((s, i) => {
          const active = i === stepIndex
          const reached = i <= stepIndex
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(i)}
              className="relative z-10 flex w-1/3 flex-col items-center gap-1.5"
            >
              <span
                className={`h-3 w-3 rounded-full border-2 transition-colors duration-300 ${
                  reached ? "border-cyan bg-cyan" : "border-hairline bg-surface"
                }`}
              />
              <span
                className={`text-[11px] leading-none transition-colors ${
                  active ? "font-semibold text-navy" : "text-navy-muted"
                }`}
              >
                {s.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1">
        {entities.map((entity) => {
          const on = entity.availableAt <= stepIndex
          return (
            <span
              key={entity.label}
              className={`overflow-hidden whitespace-nowrap rounded border px-1.5 text-[10px] leading-[17px] transition-all duration-500 ${
                on
                  ? "max-w-[200px] border-cyan-line bg-cyan-soft text-navy opacity-100"
                  : "max-w-0 border-transparent px-0 opacity-0"
              }`}
            >
              {entity.label}
            </span>
          )
        })}
      </div>

      <p className="mt-auto pt-2 text-[11px] leading-snug text-navy-muted">{step.caption}</p>
    </section>
  )
}
