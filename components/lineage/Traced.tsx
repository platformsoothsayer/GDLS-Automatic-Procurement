"use client"

/**
 * Wraps a data bearing element.
 *
 * Business view  renders the children with no decoration at all.
 * Data view      adds the thin cyan dotted outline and a small monospace tag, and
 *                makes the element open the lineage panel for its source key.
 *
 * Screens never inline a source system name. They pass a key from the nomenclature
 * registry and everything shown comes from there.
 *
 * Two decisions matter for a live demonstration:
 *
 *  - The tag is compact by default, a layer letter and a system mark, because a tag
 *    carrying a full object name is wider than most values and collides with its
 *    neighbours on a dense screen. Pass detail="object" where there is room for it.
 *  - Use tag="inline" on anything dense. An inline tag cannot overlap anything.
 *    Corner tags are for large, isolated figures.
 */

import type { ElementType, ReactNode } from "react"
import { getSource, SYSTEM_SHORT, type SourceKey } from "@/data/nomenclature"
import { useDataView } from "@/context/DataViewContext"

export type TagPosition = "tr" | "tl" | "br" | "bl" | "inline"

const POSITION: Record<Exclude<TagPosition, "inline">, string> = {
  tr: "absolute -top-2 right-0 translate-x-1",
  tl: "absolute -top-2 left-0 -translate-x-1",
  br: "absolute -bottom-2 right-0 translate-x-1",
  bl: "absolute -bottom-2 left-0 -translate-x-1",
}

const LAYER_LETTER = { BRONZE: "B", SILVER: "S", GOLD: "G" } as const
const LAYER_DOT = { BRONZE: "bg-attention", SILVER: "bg-navy-faint", GOLD: "bg-cyan" } as const

type TracedProps = {
  sourceKey: SourceKey
  children: ReactNode
  /** Shown as the panel heading so the presenter knows which value was clicked. */
  label?: string
  as?: ElementType
  tag?: TagPosition
  /** "compact" is a layer letter and a system mark. "object" adds the source object. */
  detail?: "compact" | "object"
  className?: string
}

export function Traced({
  sourceKey,
  children,
  label,
  as: Tag = "span" as ElementType,
  tag = "tr",
  detail = "compact",
  className = "",
}: TracedProps) {
  const { isDataView, openSource, activeKey } = useDataView()
  const source = getSource(sourceKey)

  if (!isDataView) {
    return <Tag className={className}>{children}</Tag>
  }

  const inline = tag === "inline"
  const isActive = activeKey === sourceKey

  const badge = (
    <span
      className={`pointer-events-none z-10 inline-flex shrink-0 items-center gap-1 rounded-sm border border-cyan-line bg-surface px-1 py-px text-[9px] font-medium leading-3 text-navy shadow-sm ${
        inline ? "" : POSITION[tag]
      }`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-[1px] ${LAYER_DOT[source.layer]}`} aria-hidden />
      <span className="mono uppercase">
        {LAYER_LETTER[source.layer]}·{SYSTEM_SHORT[source.system]}
      </span>
      {detail === "object" && <span className="mono max-w-[190px] truncate">{source.object}</span>}
    </span>
  )

  return (
    <Tag
      role="button"
      tabIndex={0}
      aria-label={`Show lineage for ${label ?? sourceKey}`}
      onClick={(event: React.MouseEvent) => {
        event.stopPropagation()
        openSource(sourceKey, label)
      }}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          event.stopPropagation()
          openSource(sourceKey, label)
        }
      }}
      className={`traced relative ${
        inline ? "inline-flex items-center gap-1 align-middle" : "inline-block"
      } ${isActive ? "traced-active" : ""} ${className}`}
    >
      {children}
      {badge}
    </Tag>
  )
}
