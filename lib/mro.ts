/**
 * Signal derivation for the MRO screen.
 *
 * A signal is evaluated, not stored. Two conditions can fire it:
 *
 *   Stock   on hand at or below the reorder point.
 *   Timing  the predicted need date falls inside the supplier lead time window, so
 *           ordering any later than today risks the asset sitting down waiting.
 *
 * The timing condition is the one that matters. It is the small version of
 * discovering a lead time problem forty days before production.
 */

import { DATASET } from "./dataset"
import type { MaintainableAsset, PartRecord } from "./domain"

const { assets, parts, suppliers, orgs, meta } = DATASET

const partByKey = new Map(parts.map((p) => [p.partKey, p]))
const supplierById = new Map(suppliers.map((s) => [s.supplierId, s]))
const orgById = new Map(orgs.map((o) => [o.orgId, o]))

const DAY = 86_400_000
const AS_OF = Date.parse(meta.asOf)

/* ------------------------------------------------------------------ *
 * Downtime exposure
 *
 * The figure is derived, never sampled. Two inputs only, both shown on the signal
 * so a maintenance engineer can argue with either one:
 *
 *   Expected downtime hours   set by criticality, where 1 is the most critical.
 *   Lost output per hour      set by asset class.
 *
 * The hour steps are wider than the spread of the hourly rates, so the exposure of
 * the least valuable asset at a given criticality still exceeds that of the most
 * valuable asset one level below it. Criticality therefore orders the figures with
 * no crossover. Every rate is illustrative and would be set with the manufacturer.
 * ------------------------------------------------------------------ */

/** Hours the asset is expected to sit waiting for the part. Criticality 1 is the most critical. */
export const DOWNTIME_HOURS_BY_CRITICALITY: Record<1 | 2 | 3 | 4, number> = {
  1: 108,
  2: 36,
  3: 12,
  4: 4,
}

/** Illustrative lost output per hour, in dollars, by asset class. */
export const DOWNTIME_RATE_BY_ASSET_CLASS: Record<string, number> = {
  "HEAT TREAT FURNACE": 9_800,
  "HYDRAULIC PRESS": 9_100,
  "CNC MACHINING CENTER": 8_400,
  "WELDING CELL": 7_200,
  "PAINT BOOTH": 6_300,
  "TEST RIG": 5_400,
  "CONVEYOR LINE": 4_900,
  "OVERHEAD CRANE": 4_400,
  "MATERIAL HANDLER": 4_100,
  "AIR COMPRESSOR": 3_800,
}

// Every asset class in the register has to carry a band. A missing one would fall
// back to some default and quietly break the ordering, so the build stops instead.
{
  const missing = [...new Set(assets.map((a) => a.assetGroup))]
    .filter((g) => !(g in DOWNTIME_RATE_BY_ASSET_CLASS))
    .sort()
  if (missing.length) {
    throw new Error(`No downtime rate band for asset class: ${missing.join(", ")}`)
  }
}

export function downtimeRateFor(assetGroup: string): number {
  return DOWNTIME_RATE_BY_ASSET_CLASS[assetGroup]
}

export function downtimeExposureFor(asset: MaintainableAsset): {
  hours: number
  ratePerHour: number
  exposure: number
} {
  const hours = DOWNTIME_HOURS_BY_CRITICALITY[asset.criticality]
  const ratePerHour = downtimeRateFor(asset.assetGroup)
  return { hours, ratePerHour, exposure: hours * ratePerHour }
}

/** The criticality scale, stated wherever a criticality number is shown. */
export const CRITICALITY_SCALE_NOTE = "Criticality runs 1 to 4. 1 is the most critical."

export type AssetRow = {
  assetNumber: string
  description: string
  location: string
  criticality: 1 | 2 | 3 | 4
  conditionScore: number
  lastServicedOn: string
  nextServiceDueOn: string
  sparePartNumber: string
  onHandQty: number
  reorderPoint: number
  leadTimeDays: number
  /** Which conditions this asset's spare currently trips. */
  stockCondition: boolean
  timingCondition: boolean
  signalId: string | null
}

export type Signal = {
  signalId: string
  assetNumber: string
  assetDescription: string
  location: string
  criticality: 1 | 2 | 3 | 4
  assetGroup: string
  /** Hours the asset is expected to sit waiting, set by criticality. */
  downtimeHours: number
  /** Illustrative lost output per hour, set by asset class. */
  downtimeRatePerHour: number
  /** Hours multiplied by the hourly rate. Derived from the two fields above. */
  downtimeExposure: number
  sparePartKey: string
  sparePartNumber: string
  sparePartDescription: string
  onHandQty: number
  reorderPoint: number
  supplierId: string | null
  supplierName: string
  leadTimeDays: number
  /** Days from today until the part is predicted to be needed. */
  daysUntilNeed: number
  predictedNeedOn: string
  needBasis: MaintainableAsset["needBasis"]
  stockCondition: boolean
  timingCondition: boolean
  /** How many days of slack are left before ordering is already too late. */
  slackDays: number
  reason: string
  estimatedOrderQty: number
  estimatedValue: number
}

function daysBetween(fromMs: number, toIso: string): number {
  return Math.round((Date.parse(toIso) - fromMs) / DAY)
}

function evaluate(asset: MaintainableAsset, spare: PartRecord) {
  const onHand = spare.onHandQty
  const reorderPoint = spare.reorderPoint ?? 0
  const leadTimeDays = spare.leadTimeDays ?? 0
  const daysUntilNeed = daysBetween(AS_OF, asset.predictedNeedOn)

  return {
    onHand,
    reorderPoint,
    leadTimeDays,
    daysUntilNeed,
    stockCondition: onHand <= reorderPoint,
    // Ordering today lands the part on day leadTimeDays. If the need falls on or
    // before that, any further delay puts the asset down waiting for a part.
    timingCondition: daysUntilNeed <= leadTimeDays,
    slackDays: daysUntilNeed - leadTimeDays,
  }
}

export function buildAssetRows(): AssetRow[] {
  return assets.map((asset) => {
    const spare = partByKey.get(asset.primarySparePartKey)!
    const e = evaluate(asset, spare)
    return {
      assetNumber: asset.assetNumber,
      description: asset.description,
      location: orgById.get(asset.orgId)!.orgCode,
      criticality: asset.criticality,
      conditionScore: asset.conditionScore,
      lastServicedOn: asset.lastServicedOn,
      nextServiceDueOn: asset.nextServiceDueOn,
      sparePartNumber: spare.partNumber,
      onHandQty: e.onHand,
      reorderPoint: e.reorderPoint,
      leadTimeDays: e.leadTimeDays,
      stockCondition: e.stockCondition,
      timingCondition: e.timingCondition,
      signalId: e.stockCondition || e.timingCondition ? signalIdFor(asset.assetNumber) : null,
    }
  })
}

function signalIdFor(assetNumber: string): string {
  return `SIG-${assetNumber.replace("AST-", "")}`
}

function reasonFor(asset: MaintainableAsset, spare: PartRecord, e: ReturnType<typeof evaluate>): string {
  const basis = asset.needBasis === "PREDICTED_FAILURE" ? "predicted failure" : "planned service"

  if (e.timingCondition && e.stockCondition) {
    return `On hand ${e.onHand} is at or below the reorder point of ${e.reorderPoint}, and the ${basis} in ${e.daysUntilNeed} days already falls inside the ${e.leadTimeDays} day lead time.`
  }
  if (e.timingCondition) {
    return `The ${basis} is ${e.daysUntilNeed} days away and the supplier needs ${e.leadTimeDays}. Stock is adequate today, so nothing else would have raised this.`
  }
  return `On hand ${e.onHand} is at or below the reorder point of ${e.reorderPoint}. The ${basis} is ${e.daysUntilNeed} days away, still outside the ${e.leadTimeDays} day lead time.`
}

export function buildSignals(): Signal[] {
  const out: Signal[] = []

  for (const asset of assets) {
    const spare = partByKey.get(asset.primarySparePartKey)
    if (!spare) continue
    const e = evaluate(asset, spare)
    if (!e.stockCondition && !e.timingCondition) continue

    const downtime = downtimeExposureFor(asset)
    const supplier = spare.primarySupplierId ? supplierById.get(spare.primarySupplierId) : undefined
    const orderQty = Math.max(
      spare.orderMultiple ?? 1,
      (spare.reorderUpTo ?? e.reorderPoint + 40) - e.onHand
    )

    out.push({
      signalId: signalIdFor(asset.assetNumber),
      assetNumber: asset.assetNumber,
      assetDescription: asset.description,
      location: orgById.get(asset.orgId)!.orgCode,
      criticality: asset.criticality,
      assetGroup: asset.assetGroup,
      downtimeHours: downtime.hours,
      downtimeRatePerHour: downtime.ratePerHour,
      downtimeExposure: downtime.exposure,
      sparePartKey: spare.partKey,
      sparePartNumber: spare.partNumber,
      sparePartDescription: spare.description,
      onHandQty: e.onHand,
      reorderPoint: e.reorderPoint,
      supplierId: spare.primarySupplierId,
      supplierName: supplier?.supplierName ?? "no approved supplier",
      leadTimeDays: e.leadTimeDays,
      daysUntilNeed: e.daysUntilNeed,
      predictedNeedOn: asset.predictedNeedOn,
      needBasis: asset.needBasis,
      stockCondition: e.stockCondition,
      timingCondition: e.timingCondition,
      slackDays: e.slackDays,
      reason: reasonFor(asset, spare, e),
      estimatedOrderQty: orderQty,
      estimatedValue: Math.round(orderQty * spare.unitCost),
    })
  }

  // Timing signals first, then by criticality, then by how little slack is left.
  return out.sort(
    (a, b) =>
      Number(b.timingCondition) - Number(a.timingCondition) ||
      a.criticality - b.criticality ||
      a.slackDays - b.slackDays
  )
}

export const AS_OF_ISO = meta.asOf
