/**
 * The walkthrough order. The left nav, the next control and the step numbers all
 * read from this one list, so the presenter can never be shown two different orders.
 */

export type Screen = {
  step: number
  href: string
  label: string
  summary: string
}

export const SCREENS: Screen[] = [
  { step: 1, href: "/problems", label: "Problem selection", summary: "Choose the problem to walk through" },
  { step: 2, href: "/fabric", label: "Fabric skeleton", summary: "The shape of the fabric before it is loaded" },
  { step: 3, href: "/parts", label: "Part master intelligence", summary: "Duplicate clusters and field completeness" },
  { step: 4, href: "/mro", label: "MRO signals", summary: "Asset condition and spare part cover" },
  { step: 5, href: "/procurement", label: "Automated procurement", summary: "From signal to a proposed requisition" },
  { step: 6, href: "/fabric/live", label: "Fabric populated", summary: "The fabric reflecting this session" },
  { step: 7, href: "/engagement", label: "What it takes", summary: "Scope, sequence and the work involved" },
]

export function screenFor(pathname: string): Screen | undefined {
  return SCREENS.find((s) => s.href === pathname)
}

export function nextScreen(pathname: string): Screen | undefined {
  const index = SCREENS.findIndex((s) => s.href === pathname)
  if (index < 0) return undefined
  return SCREENS[index + 1]
}
