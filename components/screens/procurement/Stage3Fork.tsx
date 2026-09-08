"use client"

/**
 * Stage 3. Two modes, side by side, presented as equal options.
 *
 * This is the change management answer. Neither mode may look like the real one and
 * both end at a person, so the two panels are the same size, carry the same field
 * values, and each states plainly where it stops.
 */

import { useState } from "react"
import { getSource, SYSTEM_LABEL } from "@/data/nomenclature"
import {
  APPROVAL_HIERARCHY,
  MODES,
  MODE_ASSURANCE,
  NEGOTIATE_LABEL,
  type ModeSpec,
} from "@/data/procurement-content"
import type { Recommendation } from "@/lib/procurement"
import { Traced } from "@/components/lineage/Traced"
import { money } from "@/lib/format"

function FieldForm({
  recommendation,
  staged,
}: {
  recommendation: Recommendation
  staged: boolean
}) {
  return (
    <div className={`rounded border ${staged ? "border-cyan-line bg-cyan-soft/40" : "border-hairline bg-canvas"}`}>
      {staged && (
        <p className="flex items-center justify-between border-b border-cyan-line/60 px-2 py-1 text-[9.5px]">
          <span className="font-semibold uppercase tracking-wide text-navy-muted">Staged document</span>
          <span className="rounded border border-attention bg-attention-soft px-1 py-px font-semibold uppercase text-attention">
            incomplete · pending approval
          </span>
        </p>
      )}
      <dl className="divide-y divide-hairline/70">
        {recommendation.requisitionFields.map((field) => (
          <div key={field.name} className="grid grid-cols-[128px_1fr] gap-1.5 px-2 py-[2px]">
            <dt className="mono truncate text-[9px] leading-[13px] text-navy-faint">{field.name}</dt>
            <dd className="mono truncate text-[10px] leading-[13px] text-navy">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ModePanel({
  mode,
  recommendation,
  focused,
  onFocus,
  onAct,
  acted,
}: {
  mode: ModeSpec
  recommendation: Recommendation
  focused: boolean
  onFocus: () => void
  onAct: () => void
  acted: boolean
}) {
  const staged = mode.id === "prepopulated"
  const [copied, setCopied] = useState(false)

  const copyValues = async () => {
    const text = recommendation.requisitionFields
      .map((field) => `${field.name}\t${field.value}`)
      .join("\n")
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // A blocked clipboard must not break the walkthrough.
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }
  const integration = mode.integrationKey ? getSource(mode.integrationKey) : null
  const routes = APPROVAL_HIERARCHY.filter(
    (level) => level.threshold === null || recommendation.lineValue <= level.threshold
  )

  return (
    <section
      onClick={onFocus}
      className={`flex min-h-0 cursor-pointer flex-col rounded-card border bg-surface px-3 py-2 transition-colors ${
        focused ? "border-cyan ring-1 ring-cyan" : "border-hairline hover:border-cyan-line"
      }`}
    >
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint">{mode.name}</p>
      <h3 className="mt-0.5 text-[12.5px] font-semibold leading-snug text-navy">{mode.headline}</h3>
      <p className="mt-1 text-[10.5px] leading-snug text-navy-muted">{mode.body}</p>

      <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
        <FieldForm recommendation={recommendation} staged={staged} />

        {integration && (
          <p className="mt-1.5 text-[10px] leading-snug text-navy-muted">
            Integration mechanism{" "}
            <Traced sourceKey={mode.integrationKey!} label="Integration mechanism" tag="inline" detail="layer">
              <span className="mono text-navy">{integration.object}</span>
            </Traced>{" "}
            in {SYSTEM_LABEL[integration.system]}. The document is created in an unapproved state and no
            commitment exists until a person approves it.
          </p>
        )}

        {!staged && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              void copyValues()
            }}
            className={`mt-1.5 w-full rounded border px-2 py-1 text-[10.5px] font-medium transition-colors ${
              copied
                ? "border-healthy/40 bg-healthy-soft text-healthy"
                : "border-hairline bg-canvas text-navy-muted hover:border-cyan-line hover:text-navy"
            }`}
          >
            {copied ? "Values copied to the clipboard" : "Copy values"}
          </button>
        )}

        {staged && (
          <div className="mt-1.5 rounded border border-hairline bg-canvas px-2 py-1.5">
            <p className="text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint">
              Approval hierarchy it would route through
            </p>
            <ol className="mt-1 space-y-0.5">
              {routes.map((level, i) => (
                <li key={level.role} className="flex items-baseline gap-1.5 text-[9.5px] leading-[13px] text-navy-muted">
                  <span className="mono text-navy-faint">{i + 1}</span>
                  <span className="text-navy">{level.role}</span>
                  {level.threshold !== null && (
                    <span className="mono text-navy-faint">to {money(level.threshold)}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

      </div>

      <div className="mt-1.5 border-t border-hairline pt-1.5">
        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint">Requires</p>
        <ul className="mt-0.5 flex flex-wrap gap-1">
          {mode.requires.map((item) => (
            <li
              key={item}
              className="rounded border border-hairline bg-canvas px-1.5 py-px text-[9.5px] text-navy-muted"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[10px] leading-snug text-navy">{mode.endsAt}</p>
        {mode.footnote && <p className="mt-0.5 text-[9.5px] italic text-navy-faint">{mode.footnote}</p>}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAct()
          }}
          className={`mt-1.5 w-full rounded px-2 py-1 text-[11px] font-medium transition-colors ${
            acted
              ? "border border-healthy/40 bg-healthy-soft text-healthy"
              : "bg-navy text-white hover:bg-[#163a5e]"
          }`}
        >
          {acted ? "Recorded in this session" : mode.actionLabel}
        </button>
      </div>
    </section>
  )
}

export function Stage3Fork({
  recommendation,
  onNegotiate,
  onAct,
  actedMode,
}: {
  recommendation: Recommendation
  onNegotiate: () => void
  onAct: (mode: ModeSpec) => void
  actedMode: string | null
}) {
  const [focused, setFocused] = useState<string>(MODES[0].id)

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-md border border-hairline bg-canvas p-0.5">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setFocused(mode.id)}
              aria-pressed={focused === mode.id}
              className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                focused === mode.id ? "bg-cyan text-white shadow-sm" : "text-navy-muted hover:text-navy"
              }`}
            >
              {mode.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onNegotiate}
          className="rounded border border-attention bg-attention-soft px-2.5 py-1 text-[11px] font-medium text-attention transition-colors hover:bg-attention hover:text-white"
        >
          {NEGOTIATE_LABEL} →
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5">
        {MODES.map((mode) => (
          <ModePanel
            key={mode.id}
            mode={mode}
            recommendation={recommendation}
            focused={focused === mode.id}
            onFocus={() => setFocused(mode.id)}
            onAct={() => onAct(mode)}
            acted={actedMode === mode.id}
          />
        ))}
      </div>

      <p className="rounded border border-hairline bg-canvas px-2.5 py-1 text-[10.5px] text-navy">
        {MODE_ASSURANCE}
      </p>
    </div>
  )
}
