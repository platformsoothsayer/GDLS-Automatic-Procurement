/**
 * Fixed bottom left on every screen. Small, always visible, not dismissible.
 */
export function IllustrativeDataBadge() {
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-50 max-w-[280px] rounded border border-hairline bg-surface/95 px-2.5 py-1.5 text-[10px] leading-snug text-navy-muted shadow-card">
      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-attention align-middle" aria-hidden />
      Illustrative data. Not connected to any production system.
    </div>
  )
}
