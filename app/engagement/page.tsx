import { EngagementScreen } from "@/components/screens/engagement/EngagementScreen"
import { buildFabricFigures } from "@/lib/fabric"

/**
 * Screen 7. The architecture reads the same derived figures the fabric screen uses,
 * so the closing diagram and the diagram the room has already seen cannot disagree.
 */
export default function EngagementPage() {
  return <EngagementScreen figures={buildFabricFigures()} />
}
