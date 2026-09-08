"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SCREENS } from "@/lib/routes"

/**
 * Persistent numbered navigation in walkthrough order. The current step is always
 * highlighted so the presenter never has to hunt for where they are.
 */
export function LeftNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Walkthrough"
      className="fixed left-0 top-14 z-30 flex h-[calc(100vh-3.5rem)] w-nav flex-col border-r border-hairline bg-surface"
    >
      <p className="px-5 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-navy-faint">
        Walkthrough
      </p>

      <ol className="flex-1 space-y-0.5 px-3">
        {SCREENS.map((screen) => {
          const active = pathname === screen.href
          return (
            <li key={screen.href}>
              <Link
                href={screen.href}
                aria-current={active ? "step" : undefined}
                className={`flex items-start gap-3 rounded-md px-2.5 py-2.5 transition-colors ${
                  active ? "bg-cyan-soft" : "hover:bg-canvas"
                }`}
              >
                <span
                  className={`mono mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-medium ${
                    active ? "bg-cyan text-white" : "bg-canvas text-navy-muted"
                  }`}
                >
                  {screen.step}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[13px] font-medium leading-tight ${
                      active ? "text-navy" : "text-navy-muted"
                    }`}
                  >
                    {screen.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-navy-faint">
                    {screen.summary}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>

      {/* The bottom left corner is reserved for the always visible illustrative data badge. */}
      <div className="h-16" aria-hidden />
    </nav>
  )
}
