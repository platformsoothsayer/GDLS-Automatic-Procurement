import { MroScreen } from "@/components/screens/mro/MroScreen"
import { buildAssetRows, buildSignals } from "@/lib/mro"

/**
 * Screen 4. Signals are evaluated on the server from the seeded data rather than
 * stored, so the two conditions are visible as conditions rather than as flags.
 */
export default function MroPage() {
  const rows = buildAssetRows()
  // Signalling assets first, then the most critical, so the table opens on the work.
  rows.sort(
    (a, b) =>
      Number(Boolean(b.signalId)) - Number(Boolean(a.signalId)) ||
      Number(b.timingCondition) - Number(a.timingCondition) ||
      a.criticality - b.criticality ||
      a.conditionScore - b.conditionScore
  )

  return <MroScreen rows={rows} signals={buildSignals()} />
}
