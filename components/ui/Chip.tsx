import type { ReactNode } from "react"

export type ChipTone = "neutral" | "cyan" | "attention" | "healthy" | "blocked"

const TONE: Record<ChipTone, string> = {
  neutral: "border-hairline bg-canvas text-navy-muted",
  cyan: "border-cyan-line bg-cyan-soft text-navy",
  attention: "border-attention/30 bg-attention-soft text-attention",
  healthy: "border-healthy/30 bg-healthy-soft text-healthy",
  blocked: "border-blocked/30 bg-blocked-soft text-blocked",
}

export function Chip({
  children,
  tone = "neutral",
  mono = false,
  className = "",
}: {
  children: ReactNode
  tone?: ChipTone
  mono?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-4 ${
        TONE[tone]
      } ${mono ? "mono" : ""} ${className}`}
    >
      {children}
    </span>
  )
}
