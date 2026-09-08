import { ProcurementScreen } from "@/components/screens/procurement/ProcurementScreen"
import { buildQuoteAnalysis, buildRecommendation, signalOptions } from "@/lib/procurement"
import type { QuoteAnalysis, Recommendation } from "@/lib/procurement"

/**
 * Screen 5. Recommendations and quotation analyses are derived on the server for
 * every active signal, so the presenter can pick any of them without a round trip.
 */
export default function ProcurementPage() {
  const signals = signalOptions()

  const recommendations: Record<string, Recommendation> = {}
  const analyses: Record<string, QuoteAnalysis> = {}
  for (const signal of signals) {
    const recommendation = buildRecommendation(signal.signalId)
    const analysis = buildQuoteAnalysis(signal.signalId)
    if (recommendation) recommendations[signal.signalId] = recommendation
    if (analysis) analyses[signal.signalId] = analysis
  }

  return <ProcurementScreen signals={signals} recommendations={recommendations} analyses={analyses} />
}
