import { FabricDiagram } from "@/components/screens/fabric/FabricDiagram"
import { buildFabricFigures } from "@/lib/fabric"

/**
 * Screen 6. The same component as screen 2, populated, reading the session context
 * so the resolve stage and the systems of engagement reflect what the presenter
 * actually did rather than a set of fixed numbers.
 */
export default function FabricLivePage() {
  return <FabricDiagram populated figures={buildFabricFigures()} />
}
