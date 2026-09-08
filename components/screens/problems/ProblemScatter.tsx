"use client"

/**
 * Screen 1 scatter plot.
 *
 * Size of prize on a logarithmic horizontal axis against strategic alignment on the
 * vertical. Circle area is proportional to the data readiness effort a problem needs,
 * so a large circle means more data work. Three candidates are highlighted and
 * labelled. The other eleven stay quiet until hovered.
 */

import { useEffect, useRef, useState } from "react"
import {
  CartesianGrid,
  Customized,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  bandCentreAt,
  CANDIDATE_PROBLEMS,
  PLOT,
  radiusFor,
  type CandidateProblem,
} from "@/data/problems"
import { compactMoney } from "@/lib/format"

const CYAN = "#00A3C4"
const GREY = "#8A9AA8"

type Point = CandidateProblem & { x: number; y: number }

const POINTS: Point[] = CANDIDATE_PROBLEMS.map((p) => ({
  ...p,
  x: p.annualValue,
  y: p.alignment,
}))

/* ---------------------------------------------------------------- *
 * The start here band
 * ---------------------------------------------------------------- */

type ChartInternals = {
  xAxisMap?: Record<string, { scale: (v: number) => number }>
  yAxisMap?: Record<string, { scale: (v: number) => number }>
}

function StartHereBand(props: ChartInternals) {
  const xAxis = props.xAxisMap && Object.values(props.xAxisMap)[0]
  const yAxis = props.yAxisMap && Object.values(props.yAxisMap)[0]
  if (!xAxis || !yAxis) return null

  const { halfHeight } = PLOT.band
  const [yLo, yHi] = PLOT.alignmentDomain
  const clamp = (v: number) => Math.min(Math.max(v, yLo), yHi)

  const steps = 24
  const upper: string[] = []
  const lower: string[] = []
  for (let i = 0; i <= steps; i++) {
    const value = Math.pow(
      10,
      Math.log10(PLOT.valueMin) +
        (i / steps) * (Math.log10(PLOT.valueMax) - Math.log10(PLOT.valueMin))
    )
    const px = xAxis.scale(value)
    const centre = bandCentreAt(value)
    upper.push(`${px},${yAxis.scale(clamp(centre + halfHeight))}`)
    lower.push(`${px},${yAxis.scale(clamp(centre - halfHeight))}`)
  }

  // Anchor the label inside the band near its lower left end, rotated to match it.
  const labelValue = 260_000
  const lx = xAxis.scale(labelValue)
  const ly = yAxis.scale(bandCentreAt(labelValue))
  const x0 = xAxis.scale(PLOT.valueMin)
  const x1 = xAxis.scale(PLOT.valueMax)
  const angle =
    (Math.atan2(
      yAxis.scale(bandCentreAt(PLOT.valueMax)) - yAxis.scale(bandCentreAt(PLOT.valueMin)),
      x1 - x0
    ) *
      180) /
    Math.PI

  return (
    <g pointerEvents="none">
      <polygon
        points={[...upper, ...lower.reverse()].join(" ")}
        fill={CYAN}
        fillOpacity={0.07}
        stroke={CYAN}
        strokeOpacity={0.22}
        strokeDasharray="3 3"
        strokeWidth={1}
      />
      <text
        x={lx}
        y={ly}
        transform={`rotate(${angle} ${lx} ${ly})`}
        textAnchor="start"
        dominantBaseline="middle"
        fill={CYAN}
        fillOpacity={0.75}
        className="mono"
        fontSize={10}
        letterSpacing="0.08em"
      >
        START HERE
      </text>
    </g>
  )
}

/* ---------------------------------------------------------------- *
 * Points and labels
 * ---------------------------------------------------------------- */

type DotProps = {
  cx?: number
  cy?: number
  payload?: Point
  hoveredId: string | null
}

function ProblemDot({ cx, cy, payload, hoveredId }: DotProps) {
  if (cx === undefined || cy === undefined || !payload) return null
  const r = radiusFor(payload.effort)
  const hovered = hoveredId === payload.id
  const colour = payload.highlighted ? CYAN : GREY

  return (
    <g>
      {/* A generous invisible hit area keeps hover steady during a live demonstration. */}
      <circle cx={cx} cy={cy} r={Math.max(r, 14)} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={colour}
        fillOpacity={payload.highlighted ? (hovered ? 0.34 : 0.2) : hovered ? 0.34 : 0.16}
        stroke={colour}
        strokeOpacity={payload.highlighted ? 1 : hovered ? 0.9 : 0.55}
        strokeWidth={payload.highlighted ? 1.5 : 1}
      />
    </g>
  )
}

function HighlightLabels(props: ChartInternals) {
  const xAxis = props.xAxisMap && Object.values(props.xAxisMap)[0]
  const yAxis = props.yAxisMap && Object.values(props.yAxisMap)[0]
  if (!xAxis || !yAxis) return null

  return (
    <g pointerEvents="none">
      {POINTS.filter((p) => p.highlighted && p.labelLines).map((p) => {
        const cx = xAxis.scale(p.annualValue)
        const cy = yAxis.scale(p.alignment)
        const r = radiusFor(p.effort)
        const left = p.labelPlacement === "left"
        const anchor = left ? "end" : "middle"
        const tx = left ? cx - r - 9 : cx
        const ty = left ? cy - 6 : p.labelPlacement === "below" ? cy + r + 16 : cy - r - 22
        return (
          <text key={p.id} x={tx} y={ty} textAnchor={anchor} fill="#0F2B46" fontSize={11} fontWeight={600}>
            <tspan x={tx}>{p.labelLines![0]}</tspan>
            <tspan x={tx} dy={13}>
              {p.labelLines![1]}
            </tspan>
          </text>
        )
      })}
    </g>
  )
}

/* ---------------------------------------------------------------- *
 * Hover card
 * ---------------------------------------------------------------- */

function HoverCard({ point, at, width }: { point: Point; at: { x: number; y: number }; width: number }) {
  const flip = at.x > width - 300
  return (
    <div
      className="pointer-events-none absolute z-20 w-[280px] rounded-card border border-hairline bg-surface p-3 shadow-card"
      style={{
        left: flip ? at.x - 292 : at.x + 16,
        top: Math.max(4, at.y - 70),
      }}
    >
      <p className="text-[13px] font-semibold leading-snug text-navy">{point.name}</p>
      <p className="mono mt-1 text-[15px] font-medium text-cyan">{compactMoney(point.annualValue)}</p>
      <p className="mt-1.5 text-[11px] leading-snug text-navy-muted">{point.rationale}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {point.hoverSources.map((s) => (
          <span
            key={s}
            className="rounded border border-hairline bg-canvas px-1.5 py-0.5 text-[10px] leading-4 text-navy-muted"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- *
 * Chart
 * ---------------------------------------------------------------- */

export function ProblemScatter({ height }: { height?: number }) {
  const [hovered, setHovered] = useState<{ point: Point; at: { x: number; y: number } } | null>(null)
  const [width, setWidth] = useState(1000)
  const shell = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = shell.current
    if (!el) return
    setWidth(el.clientWidth)
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={height === undefined ? "relative h-full min-h-[236px]" : "relative"}
      style={height === undefined ? undefined : { height }}
      ref={shell}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 26, right: 28, bottom: 26, left: 6 }}>
          <CartesianGrid stroke="#E4E9ED" strokeDasharray="2 4" />
          <XAxis
            type="number"
            dataKey="x"
            scale="log"
            domain={[PLOT.valueMin, PLOT.valueMax]}
            ticks={PLOT.valueTicks}
            tickFormatter={(v: number) => compactMoney(v)}
            tick={{ fill: "#4A6076", fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
            tickLine={{ stroke: "#E4E9ED" }}
            axisLine={{ stroke: "#E4E9ED" }}
            label={{
              value: "Size of prize · annual · illustrative",
              position: "insideBottom",
              offset: -18,
              fill: "#8A9AA8",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={PLOT.alignmentDomain}
            ticks={PLOT.alignmentTicks}
            tick={{ fill: "#4A6076", fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
            tickLine={{ stroke: "#E4E9ED" }}
            axisLine={{ stroke: "#E4E9ED" }}
            width={44}
            label={{
              value: "Strategic alignment",
              angle: -90,
              position: "insideLeft",
              offset: 16,
              fill: "#8A9AA8",
              fontSize: 11,
              style: { textAnchor: "middle" },
            }}
          />
          <Customized component={<StartHereBand />} />
          <Scatter
            data={POINTS}
            isAnimationActive={false}
            shape={(props: unknown) => (
              <ProblemDot {...(props as DotProps)} hoveredId={hovered?.point.id ?? null} />
            )}
            onMouseEnter={(entry: { cx?: number; cy?: number; payload?: Point }) => {
              if (entry?.payload && entry.cx !== undefined && entry.cy !== undefined) {
                setHovered({ point: entry.payload, at: { x: entry.cx, y: entry.cy } })
              }
            }}
            onMouseLeave={() => setHovered(null)}
          />
          <Customized component={<HighlightLabels />} />
        </ScatterChart>
      </ResponsiveContainer>

      {hovered && <HoverCard point={hovered.point} at={hovered.at} width={width} />}

      <p className="absolute right-1 top-0 text-[10px] text-navy-faint">
        Circle area · data readiness effort
      </p>
    </div>
  )
}
