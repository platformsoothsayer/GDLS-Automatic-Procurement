/**
 * Derivation for the automated procurement screen.
 *
 * The recommendation, the requisition field values and the quotation ranking are all
 * computed on the server from the seeded data. The point of the screen is that every
 * number can be traced back to an input, so nothing here is a constant dropped into
 * a card.
 */

import { DATASET } from "./dataset"
import { buildSignals, type Signal } from "./mro"
import type { PartRecord, QuoteSet, SupplierQuote } from "./domain"
import { getSource } from "@/data/nomenclature"
import { RANKING_WEIGHTS } from "@/data/procurement-content"

const { parts, suppliers, purchaseOrderLines, quoteSets, orgs, assets, meta } = DATASET

const partByKey = new Map(parts.map((p) => [p.partKey, p]))
const supplierById = new Map(suppliers.map((s) => [s.supplierId, s]))
const assetByNumber = new Map(assets.map((a) => [a.assetNumber, a]))
const DAY = 86_400_000
const AS_OF = Date.parse(meta.asOf)

/** Illustrative cost model. Every figure here would be set with the manufacturer. */
export const COST_MODEL = {
  orderPlacementCost: 120,
  annualHoldingRate: 0.22,
  // Downtime hours and the hourly rate live with the signal, in lib/mro, so the
  // maintenance screen and this one quote the same two inputs.
  expeditePremiumRate: 0.38,
  expediteFreight: 850,
}

const TERMS_RANK: Record<string, number> = {
  "NET 60": 1, "NET 45": 0.85, "2/10 NET 30": 0.8, "NET 30": 0.7, "NET 15": 0.5,
}

export type SupplierOption = {
  supplierId: string
  supplierName: string
  role: "PRIMARY" | "ALTERNATE"
  onTimeDeliveryPct: number
  qualityRatePct: number
  lastPricePaid: number | null
  lastPricePaidOn: string | null
  /** Whether the last price was for this part or for the commodity generally. */
  lastPriceBasis: "THIS_PART" | "COMMODITY"
}

export type QuantityWorking = {
  annualDemand: number
  economicOrderQty: number
  minimumOrderQty: number | null
  orderMultiple: number | null
  roundedQty: number
}

export type ReasoningLine = { input: string; value: string; effect: string }

export type CostOfInaction = {
  /** Expected hours down waiting for the part. Set by criticality, where 1 is the most critical. */
  downtimeHours: number
  /** Illustrative lost output per hour, set by asset class. */
  downtimeCostPerHour: number
  /** The two inputs above, multiplied. */
  downtimeCost: number
  expeditePremium: number
  total: number
}

export type Recommendation = {
  signal: Signal
  part: PartRecord
  quantity: QuantityWorking
  orderByOn: string
  daysOfSlack: number
  suppliers: SupplierOption[]
  contractPrice: number | null
  lastPaidPrice: number | null
  effectivePrice: number
  priceBasis: "CONTRACT" | "LAST_PAID"
  lineValue: number
  reasoning: ReasoningLine[]
  costOfInaction: CostOfInaction
  /** Values for the ten requisition fields, keyed by the registry field name. */
  requisitionFields: { name: string; value: string }[]
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

function lastPriceFor(partKey: string, supplierId: string) {
  const lines = purchaseOrderLines
    .filter((l) => l.partKey === partKey && l.supplierId === supplierId && l.status !== "CANCELLED")
    .sort((a, b) => b.orderedOn.localeCompare(a.orderedOn))
  return lines[0] ?? null
}

function lastCommodityPriceFor(commodity: string, supplierId: string) {
  const lines = purchaseOrderLines
    .filter((l) => l.supplierId === supplierId && l.commodity === commodity && l.status !== "CANCELLED")
    .sort((a, b) => b.orderedOn.localeCompare(a.orderedOn))
  return lines[0] ?? null
}

function supplierOptions(part: PartRecord): SupplierOption[] {
  const ids: { id: string; role: "PRIMARY" | "ALTERNATE" }[] = []
  if (part.primarySupplierId) ids.push({ id: part.primarySupplierId, role: "PRIMARY" })

  const alternates = suppliers
    .filter((s) => s.active && s.primaryCommodity === part.commodity && s.supplierId !== part.primarySupplierId)
    .sort((a, b) => b.onTimeDeliveryPct - a.onTimeDeliveryPct)
    .slice(0, 2)
  for (const alternate of alternates) ids.push({ id: alternate.supplierId, role: "ALTERNATE" })

  return ids.flatMap(({ id, role }) => {
    const supplier = supplierById.get(id)
    if (!supplier) return []
    const onPart = lastPriceFor(part.partKey, id)
    const onCommodity = onPart ? null : lastCommodityPriceFor(part.commodity, id)
    const line = onPart ?? onCommodity
    return [{
      supplierId: id,
      supplierName: supplier.supplierName,
      role,
      onTimeDeliveryPct: supplier.onTimeDeliveryPct,
      qualityRatePct: Math.round((100 - supplier.qualityDefectPpm / 10_000) * 10) / 10,
      lastPricePaid: line ? line.unitPrice : null,
      lastPricePaidOn: line ? line.orderedOn : null,
      lastPriceBasis: onPart ? ("THIS_PART" as const) : ("COMMODITY" as const),
    }]
  })
}

function quantityWorking(part: PartRecord): QuantityWorking {
  // Annualised from the last 24 months, with a floor so a rarely bought spare still
  // produces a sensible order quantity.
  const annualDemand = Math.max(12, Math.round(part.purchaseQty24m / 2))
  const holdingCost = Math.max(0.5, part.unitCost * COST_MODEL.annualHoldingRate)
  const economicOrderQty = Math.max(
    1,
    Math.round(Math.sqrt((2 * annualDemand * COST_MODEL.orderPlacementCost) / holdingCost))
  )

  let rounded = Math.max(economicOrderQty, part.minOrderQty ?? 0)
  if (part.orderMultiple && part.orderMultiple > 1) {
    rounded = Math.ceil(rounded / part.orderMultiple) * part.orderMultiple
  }

  return {
    annualDemand,
    economicOrderQty,
    minimumOrderQty: part.minOrderQty,
    orderMultiple: part.orderMultiple,
    roundedQty: rounded,
  }
}

export function buildRecommendation(signalId: string): Recommendation | null {
  const signal = buildSignals().find((s) => s.signalId === signalId)
  if (!signal) return null
  const part = partByKey.get(signal.sparePartKey)
  if (!part) return null

  const quantity = quantityWorking(part)
  const options = supplierOptions(part)
  const primary = options.find((o) => o.role === "PRIMARY") ?? options[0]

  const lastLine = lastPriceFor(part.partKey, primary?.supplierId ?? "")
  const lastPaidPrice = lastLine?.unitPrice ?? primary?.lastPricePaid ?? null
  const contractPrice = part.contractPrice
  const effectivePrice = contractPrice ?? lastPaidPrice ?? part.unitCost
  const lineValue = Math.round(effectivePrice * quantity.roundedQty)

  const orderByMs = Date.parse(signal.predictedNeedOn) - signal.leadTimeDays * DAY
  const asset = assetByNumber.get(signal.assetNumber)

  const criticality = signal.criticality
  // Derived on the signal from expected downtime hours and the hourly rate for the
  // asset class. Nothing is sampled and nothing is re-weighted here, so the number a
  // buyer reads on this screen is the number the maintenance screen showed them.
  const downtimeHours = signal.downtimeHours
  const downtimeCostPerHour = signal.downtimeRatePerHour
  const downtimeCost = signal.downtimeExposure
  const expeditePremium = Math.round(lineValue * COST_MODEL.expeditePremiumRate + COST_MODEL.expediteFreight)

  const org = orgs.find((o) => o.orgId === part.orgId)!

  const reasoning: ReasoningLine[] = [
    {
      input: signal.timingCondition ? "Timing condition" : "Stock condition",
      value: signal.timingCondition
        ? `need in ${signal.daysUntilNeed} days against ${signal.leadTimeDays} day lead time`
        : `on hand ${signal.onHandQty} at reorder point ${signal.reorderPoint}`,
      effect: signal.timingCondition
        ? "sets the order by date to today or earlier"
        : "triggers replenishment to the reorder up to level",
    },
    {
      input: "Annual usage",
      value: `${quantity.annualDemand} units`,
      effect: `economic order quantity of ${quantity.economicOrderQty}`,
    },
    {
      input: "Minimum order quantity",
      value: quantity.minimumOrderQty === null ? "not set" : `${quantity.minimumOrderQty}`,
      effect:
        quantity.minimumOrderQty === null
          ? "no floor applied"
          : quantity.minimumOrderQty > quantity.economicOrderQty
            ? `raises the quantity to ${quantity.minimumOrderQty}`
            : "no effect, the economic quantity is already higher",
    },
    {
      input: "Order multiple",
      value: quantity.orderMultiple === null ? "not set" : `${quantity.orderMultiple}`,
      effect:
        quantity.orderMultiple && quantity.orderMultiple > 1
          ? `rounds up to ${quantity.roundedQty}`
          : "no rounding applied",
    },
    {
      input: "Approved supplier list",
      value: `${options.length} approved for this part`,
      effect: "choice is restricted to approved sources",
    },
    {
      input: contractPrice !== null ? "Contract price" : "Last price paid",
      value: `$${effectivePrice.toFixed(2)}`,
      effect:
        contractPrice !== null
          ? lastPaidPrice !== null
            ? `used instead of the last paid price of $${lastPaidPrice.toFixed(2)}`
            : "used as the line price"
          : "used because no blanket agreement exists for this part",
    },
    {
      input: "Duplicate cluster state",
      value: part.duplicateClusterId ? `in open cluster ${part.duplicateClusterId}` : "not in an open cluster",
      effect: part.duplicateClusterId
        ? "flagged, buying against an unresolved record risks splitting spend again"
        : "safe to buy against this record",
    },
    {
      input: "Asset criticality",
      value: `${criticality} of 4${asset ? ` · ${asset.description}` : ""}`,
      effect: `${downtimeHours} hours of expected downtime, at $${downtimeCostPerHour.toLocaleString("en-US")} an hour for ${signal.assetGroup.toLowerCase()}`,
    },
  ]

  // The form the buyer would key, assembled from the two registered objects. The
  // appendix puts the charge account on the distribution, not on the line, so a
  // proposed requisition has to carry both.
  //
  // The values are positional against the registry rather than keyed by column name,
  // because a column name written here would be a source name outside the registry.
  // If the registry changes shape this throws during the build rather than quietly
  // pairing the wrong value with the wrong field.
  const lineValues = [
    part.partNumber,
    `${quantity.roundedQty}`,
    part.unitOfMeasure ?? "not set",
    signal.predictedNeedOn,
    primary ? primary.supplierName : "no approved supplier",
    effectivePrice.toFixed(2),
    org.orgCode,
    `${org.orgCode}-STORES`,
    "assigned on creation",
  ]
  const distributionValues = [`${org.orgCode}-MRO-5210`]

  const lineFields = getSource("REQ.LINE").fields
  const distributionFields = getSource("REQ.DISTRIBUTION").fields
  if (lineFields.length !== lineValues.length || distributionFields.length !== distributionValues.length) {
    throw new Error(
      "The requisition form is positional against the registry. A field was added or removed in REQ.LINE or REQ.DISTRIBUTION and the values in lib/procurement.ts have to move with it."
    )
  }

  const requisitionFields = [
    ...lineFields.map((field, i) => ({ name: field.name, value: lineValues[i] })),
    ...distributionFields.map((field, i) => ({ name: field.name, value: distributionValues[i] })),
  ]

  return {
    signal,
    part,
    quantity,
    orderByOn: iso(orderByMs),
    daysOfSlack: signal.slackDays,
    suppliers: options,
    contractPrice,
    lastPaidPrice,
    effectivePrice,
    priceBasis: contractPrice !== null ? "CONTRACT" : "LAST_PAID",
    lineValue,
    reasoning,
    costOfInaction: {
      downtimeHours,
      downtimeCostPerHour,
      downtimeCost,
      expeditePremium,
      total: downtimeCost + expeditePremium,
    },
    requisitionFields,
  }
}

/* ------------------------------------------------------------------ *
 * Quotation ranking
 * ------------------------------------------------------------------ */

export type RankedQuote = SupplierQuote & {
  total: number
  /** Fails when the offered lead time cannot make the need date. */
  feasible: boolean
  priceScore: number
  deliveryScore: number
  qualityScore: number
  termsScore: number
  totalScore: number
  rank: number | null
  exclusionReason: string | null
}

export type QuoteAnalysis = {
  set: QuoteSet
  ranked: RankedQuote[]
  /** The cheapest response overall, whether or not it can make the date. */
  cheapestSupplierId: string | null
  cheapestIsInfeasible: boolean
  quantity: number
}

export function buildQuoteAnalysis(signalId: string): QuoteAnalysis | null {
  const recommendation = buildRecommendation(signalId)
  if (!recommendation) return null
  const set = quoteSets.find((q) => q.assetNumber === recommendation.signal.assetNumber)
  if (!set) return null

  const quantity = recommendation.quantity.roundedQty
  const responded = set.quotes.filter((q) => q.quoted)
  const cheapest = responded.reduce<SupplierQuote | null>(
    (low, q) => (low === null || q.unitPrice < low.unitPrice ? q : low),
    null
  )
  const bestPrice = Math.min(...responded.map((q) => q.unitPrice))

  const ranked: RankedQuote[] = set.quotes.map((quote) => {
    const feasible = quote.quoted && quote.leadTimeDaysOffered <= set.daysUntilNeed
    const priceScore = quote.quoted ? Math.round(RANKING_WEIGHTS.price * (bestPrice / quote.unitPrice)) : 0
    const deliveryScore = quote.quoted ? Math.round((RANKING_WEIGHTS.delivery * quote.onTimeDeliveryPct) / 100) : 0
    const qualityScore = quote.quoted ? Math.round((RANKING_WEIGHTS.quality * quote.qualityRatePct) / 100) : 0
    const termsScore = quote.quoted ? Math.round(RANKING_WEIGHTS.terms * (TERMS_RANK[quote.paymentTerms] ?? 0.6)) : 0

    return {
      ...quote,
      total: Math.round(quote.unitPrice * quantity),
      feasible,
      priceScore,
      deliveryScore,
      qualityScore,
      termsScore,
      totalScore: priceScore + deliveryScore + qualityScore + termsScore,
      rank: null,
      exclusionReason: !quote.quoted
        ? "Declined to quote"
        : feasible
          ? null
          : `Offered ${quote.leadTimeDaysOffered} days against a need in ${set.daysUntilNeed}. Cannot meet the need date.`,
    }
  })

  // Feasibility is a gate, not a weighting. A quotation that cannot arrive in time is
  // not eligible to win on price.
  ranked.sort((a, b) => Number(b.feasible) - Number(a.feasible) || b.totalScore - a.totalScore)
  let rank = 0
  for (const quote of ranked) quote.rank = quote.feasible ? ++rank : null

  return {
    set,
    ranked,
    cheapestSupplierId: cheapest?.supplierId ?? null,
    cheapestIsInfeasible: cheapest ? cheapest.leadTimeDaysOffered > set.daysUntilNeed : false,
    quantity,
  }
}

export function signalOptions(): Signal[] {
  return buildSignals()
}
