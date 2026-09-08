import { FabricDiagram } from "@/components/screens/fabric/FabricDiagram"
import { buildFabricFigures } from "@/lib/fabric"

/**
 * Screen 2. The same diagram as screen 6, before anything has been loaded into it.
 * Figures are derived on the server and passed in, so the browser never receives the
 * dataset itself.
 */
export default function FabricPage() {
  return <FabricDiagram populated={false} figures={buildFabricFigures()} />
}
