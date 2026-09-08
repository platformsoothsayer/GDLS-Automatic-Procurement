import type { ReactNode } from "react"

/**
 * Every number and every identifier on screen renders through here, in IBM Plex Mono.
 */
export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`mono ${className}`}>{children}</span>
}
