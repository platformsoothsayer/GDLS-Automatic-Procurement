"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { nextScreen, screenFor } from "@/lib/routes"

/**
 * Fixed at the bottom right of every screen, always in the same place, always the
 * next step in the same order as the left nav.
 */
export function NextControl({ panelOpen = false }: { panelOpen?: boolean }) {
  const pathname = usePathname()
  const current = screenFor(pathname)
  const next = nextScreen(pathname)

  if (!current) return null

  if (!next) {
    return (
      <div className={`fixed bottom-6 z-30 rounded-md border border-hairline bg-surface px-4 py-2.5 text-[12px] text-navy-faint shadow-card transition-[right] duration-150 ${
          panelOpen ? "right-[444px]" : "right-6"
        }`}>
        End of walkthrough
      </div>
    )
  }

  return (
    <Link
      href={next.href}
      className={`fixed bottom-6 z-30 flex items-center gap-3 rounded-md bg-navy px-4 py-2.5 text-white shadow-card transition-all duration-150 hover:bg-[#163a5e] ${
        panelOpen ? "right-[444px]" : "right-6"
      }`}
    >
      <span className="text-left">
        <span className="block text-[10px] uppercase tracking-wider text-white/60">
          Next · step <span className="mono">{next.step}</span>
        </span>
        <span className="block text-[13px] font-medium leading-tight">{next.label}</span>
      </span>
      <span aria-hidden className="text-[16px] leading-none text-cyan">→</span>
    </Link>
  )
}
