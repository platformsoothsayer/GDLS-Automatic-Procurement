import { PartsScreen } from "@/components/screens/parts/PartsScreen"
import { DATASET } from "@/lib/dataset"
import {
  buildClusterRows,
  buildIntegrityFindings,
  buildProcessCards,
  queueThroughputPerDay,
  REVIEW_MODEL,
} from "@/lib/parts"

/**
 * Screen 3. Everything is derived on the server; the browser receives the cluster
 * queue with its member detail, the completeness aggregates and the findings.
 */
export default function PartsPage() {
  return (
    <PartsScreen
      rows={buildClusterRows()}
      cards={buildProcessCards()}
      findings={buildIntegrityFindings()}
      orgCodes={DATASET.orgs.map((o) => o.orgCode)}
      commodities={DATASET.commodities.map((c) => ({ code: c.code, name: c.name }))}
      throughputPerDay={queueThroughputPerDay()}
      minutesSavedPerCluster={REVIEW_MODEL.minutesUnassisted - REVIEW_MODEL.minutesWithQueue}
    />
  )
}
