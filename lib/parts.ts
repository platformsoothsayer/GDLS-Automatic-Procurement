/**
 * Derivation for the part master screen.
 *
 * Runs on the server. The browser receives only the cluster queue, the member detail
 * behind it and the completeness aggregates, never the whole dataset.
 *
 * Completeness is measured by counting nulls in the generated records, so a field
 * shown as blank in the attribute comparison is the same field counted as missing in
 * the completeness tab. The two can never disagree.
 */

import { DATASET } from "./dataset"
import type { ClusterEvidence, DuplicateCause, EvidenceCode, PartRecord } from "./domain"
import type { SourceKey } from "@/data/nomenclature"

const { parts, engineeringParts, duplicateClusters, suppliers, orgs, assets, meta } = DATASET

const partByKey = new Map(parts.map((p) => [p.partKey, p]))
const engineeringById = new Map(engineeringParts.map((e) => [e.engineeringItemId, e]))
const supplierById = new Map(suppliers.map((s) => [s.supplierId, s]))
const orgById = new Map(orgs.map((o) => [o.orgId, o]))

/* ------------------------------------------------------------------ *
 * Cluster queue
 * ------------------------------------------------------------------ */

export type AttributeValue = { text: string; missing?: boolean }

export type ClusterMember = {
  partKey: string
  partNumber: string
  orgCode: string
  isSurvivorCandidate: boolean
  oracle: Record<string, AttributeValue>
  teamcenter: Record<string, AttributeValue>
}

export type ClusterRow = {
  clusterId: string
  cause: DuplicateCause
  partNumbers: string[]
  memberCount: number
  confidence: number
  evidenceCodes: EvidenceCode[]
  evidence: ClusterEvidence[]
  estimatedImpact: number
  carryingCost: number
  leverageLoss: number
  revisionAnomaly: boolean
  orgCodes: string[]
  commodity: string
  survivorPartNumber: string
  members: ClusterMember[]
}

const dash = (v: unknown): AttributeValue =>
  v === null || v === undefined || v === "" ? { text: "—", missing: true } : { text: String(v) }

const num = (v: number | null, suffix = ""): AttributeValue =>
  v === null ? { text: "—", missing: true } : { text: `${v.toLocaleString("en-GB")}${suffix}` }

function memberOf(part: PartRecord, survivorKey: string): ClusterMember {
  const engineering = part.engineeringItemId ? engineeringById.get(part.engineeringItemId) : undefined
  const supplier = part.primarySupplierId ? supplierById.get(part.primarySupplierId) : undefined
  const org = orgById.get(part.orgId)!

  return {
    partKey: part.partKey,
    partNumber: part.partNumber,
    orgCode: org.orgCode,
    isSurvivorCandidate: part.partKey === survivorKey,
    oracle: {
      itemNumber: { text: part.partNumber },
      description: dash(part.description),
      unitOfMeasure: dash(part.unitOfMeasure),
      itemType: dash(part.itemType),
      commodityCode: dash(part.commodityCode),
      planner: dash(part.planner),
      buyer: dash(part.buyer),
      leadTimeDays: num(part.leadTimeDays, " days"),
      onHand: {
        text: part.onHandByOrg.map((b) => `${b.orgCode} ${b.qty.toLocaleString("en-GB")}`).join("  ·  "),
      },
      supplierPartRef: part.supplierPartRef
        ? { text: `${part.supplierPartRef}${supplier ? `  ·  ${supplier.supplierName}` : ""}` }
        : { text: "—", missing: true },
      purchaseVolume: part.purchaseQty24m > 0 ? num(part.purchaseQty24m) : { text: "—", missing: true },
      purchaseSpend: {
        text: part.spend24m > 0 ? `$${Math.round(part.spend24m).toLocaleString("en-GB")}` : "—",
        missing: part.spend24m === 0,
      },
    },
    teamcenter: engineering
      ? {
          engineeringItemId: { text: engineering.engineeringItemId },
          revision: { text: engineering.currentRevisionId },
          revisionHistory: {
            text: engineering.revisions
              .map((r) => `${r.revisionId}${r.changeNoticeId ? "" : "*"}`)
              .join(" → "),
          },
          releaseState: { text: engineering.releaseState.replace("_", " ").toLowerCase() },
          owningGroup: dash(engineering.owningGroup),
          classification: dash(engineering.classificationClass),
          assemblies: engineering.assemblies.length
            ? { text: engineering.assemblies.join("  ·  ") }
            : { text: "none", missing: true },
        }
      : {
          engineeringItemId: { text: "no engineering record", missing: true },
          revision: { text: "—", missing: true },
          revisionHistory: { text: "—", missing: true },
          releaseState: { text: "—", missing: true },
          owningGroup: { text: "—", missing: true },
          classification: { text: "—", missing: true },
          assemblies: { text: "—", missing: true },
        },
  }
}

export function buildClusterRows(): ClusterRow[] {
  return duplicateClusters
    .map((cluster) => {
      const members = cluster.memberPartKeys
        .map((k) => partByKey.get(k))
        .filter((p): p is PartRecord => Boolean(p))
      const survivor = partByKey.get(cluster.recommendedSurvivorPartKey)

      return {
        clusterId: cluster.clusterId,
        cause: cluster.cause,
        partNumbers: members.map((m) => m.partNumber),
        memberCount: cluster.memberCount,
        confidence: cluster.confidence,
        evidenceCodes: cluster.evidence.map((e) => e.code),
        evidence: cluster.evidence,
        estimatedImpact: cluster.estimatedImpact,
        carryingCost: cluster.carryingCost,
        leverageLoss: cluster.leverageLoss,
        revisionAnomaly: cluster.revisionAnomaly,
        orgCodes: cluster.orgSpread.map((id) => orgById.get(id)!.orgCode),
        commodity: members[0]?.commodity ?? "",
        survivorPartNumber: survivor?.partNumber ?? "",
        members: members.map((m) => memberOf(m, cluster.recommendedSurvivorPartKey)),
      }
    })
    .sort((a, b) => b.estimatedImpact - a.estimatedImpact)
}

/* ------------------------------------------------------------------ *
 * Completeness, organised by the process that needs the field
 * ------------------------------------------------------------------ */

export type FieldCompleteness = {
  id: string
  label: string
  completePct: number
  blockedCount: number
  sourceKey: SourceKey
}

export type ProcessCard = {
  id: string
  title: string
  scopeLabel: string
  scopeCount: number
  fields: FieldCompleteness[]
  /** The single most useful number on the card. */
  headline?: string
}

const consumedPartKeys = new Set(assets.flatMap((a) => a.consumesPartKeys))

function card(
  id: string,
  title: string,
  scopeLabel: string,
  scope: PartRecord[],
  fields: { id: string; label: string; has: (p: PartRecord) => boolean; sourceKey: SourceKey }[]
): ProcessCard {
  return {
    id,
    title,
    scopeLabel,
    scopeCount: scope.length,
    fields: fields.map((f) => {
      const blocked = scope.filter((p) => !f.has(p)).length
      return {
        id: f.id,
        label: f.label,
        completePct: scope.length ? Math.round(((scope.length - blocked) / scope.length) * 1000) / 10 : 0,
        blockedCount: blocked,
        sourceKey: f.sourceKey,
      }
    }),
  }
}

export function buildProcessCards(): ProcessCard[] {
  const buyable = parts.filter((p) => p.makeBuy === "BUY" && p.lifecycleStatus !== "OBSOLETE")
  const stocked = parts.filter((p) => p.lifecycleStatus === "ACTIVE")

  const procurementFields = [
    { id: "leadTime", label: "Lead time", has: (p: PartRecord) => p.leadTimeDays !== null, sourceKey: "PART.ORACLE_PLANNING" as SourceKey },
    { id: "uom", label: "Primary unit of measure", has: (p: PartRecord) => p.unitOfMeasure !== null, sourceKey: "PART.ORACLE_UOM" as SourceKey },
    { id: "commodity", label: "Commodity code", has: (p: PartRecord) => p.commodityCode !== null, sourceKey: "PART.ORACLE_COMMODITY" as SourceKey },
    { id: "supplier", label: "Approved supplier", has: (p: PartRecord) => p.primarySupplierId !== null, sourceKey: "SUP.APPROVED_LIST" as SourceKey },
    { id: "buyer", label: "Buyer assignment", has: (p: PartRecord) => p.buyer !== null, sourceKey: "PART.ORACLE_PLANNING" as SourceKey },
    { id: "modifiers", label: "Order modifiers", has: (p: PartRecord) => p.minOrderQty !== null && p.orderMultiple !== null, sourceKey: "PART.ORACLE_PLANNING" as SourceKey },
  ]

  const procurement = card("procurement", "Automated procurement", "active bought parts", buyable, procurementFields)

  // Parts that would pass every other test and are held back by one missing field.
  const others = procurementFields.filter((f) => f.id !== "leadTime")
  const solelyLeadTime = buyable.filter((p) => p.leadTimeDays === null && others.every((f) => f.has(p))).length
  procurement.headline = `${solelyLeadTime.toLocaleString("en-GB")} parts are blocked from automation solely because lead time is missing`

  const mro = card("mro", "MRO replenishment", "active parts", stocked, [
    { id: "assetLink", label: "Consuming asset link", has: (p) => consumedPartKeys.has(p.partKey), sourceKey: "MRO.WORK_ORDER_MATERIAL" },
    { id: "reorderPoint", label: "Reorder point", has: (p) => p.reorderPoint !== null, sourceKey: "PART.ORACLE_PLANNING" },
    { id: "reorderUpTo", label: "Reorder up to level", has: (p) => p.reorderUpTo !== null, sourceKey: "PART.ORACLE_PLANNING" },
    { id: "leadTime", label: "Lead time", has: (p) => p.leadTimeDays !== null, sourceKey: "PART.ORACLE_PLANNING" },
    { id: "planner", label: "Planner assignment", has: (p) => p.planner !== null, sourceKey: "PART.ORACLE_PLANNING" },
    { id: "uom", label: "Primary unit of measure", has: (p) => p.unitOfMeasure !== null, sourceKey: "PART.ORACLE_UOM" },
  ])

  const spend = card("spend", "Spend analysis", "all parts", parts, [
    { id: "commodity", label: "Commodity code", has: (p) => p.commodityCode !== null, sourceKey: "PART.ORACLE_COMMODITY" },
    { id: "supplier", label: "Supplier assignment", has: (p) => p.primarySupplierId !== null, sourceKey: "SUP.APPROVED_LIST" },
    { id: "buyer", label: "Buyer assignment", has: (p) => p.buyer !== null, sourceKey: "PART.ORACLE_PLANNING" },
    { id: "uom", label: "Unit of measure in the defined set", has: (p) => p.unitOfMeasure !== null && !p.uomOutsideSet, sourceKey: "PART.ORACLE_UOM" },
    { id: "history", label: "Purchase history present", has: (p) => p.poLineCount > 0, sourceKey: "PO.LINE" },
    { id: "duplicate", label: "Not in an open duplicate cluster", has: (p) => p.duplicateClusterId === null, sourceKey: "DUP.CLUSTER_MEMBERSHIP" },
  ])

  return [procurement, mro, spend]
}

/* ------------------------------------------------------------------ *
 * Other integrity findings
 * ------------------------------------------------------------------ */

export type IntegrityFinding = {
  id: string
  label: string
  count: number
  detail: string
  sourceKey: SourceKey
}

export function buildIntegrityFindings(): IntegrityFinding[] {
  const asOf = Date.parse(meta.asOf)
  const thirtySixMonths = asOf - 36 * 30.44 * 86_400_000

  let conflicting = 0
  for (const part of parts) {
    const engineering = part.engineeringItemId ? engineeringById.get(part.engineeringItemId) : undefined
    if (!engineering) continue
    if (engineering.objectName !== part.description) conflicting += 1
    else if (engineering.unitOfMeasure !== part.unitOfMeasure) conflicting += 1
  }

  const stale = parts.filter((p) => Date.parse(p.lastActivityOn) < thirtySixMonths).length

  const orphaned = parts.filter((p) => {
    if (p.poLineCount > 0) return false
    const engineering = p.engineeringItemId ? engineeringById.get(p.engineeringItemId) : undefined
    return !engineering || (engineering.bomUsageCount === 0 && engineering.assemblies.length === 0)
  }).length

  const rogueUom = parts.filter((p) => p.uomOutsideSet).length

  return [
    {
      id: "conflicts",
      label: "Conflicting values between the two systems for the same part",
      count: conflicting,
      detail: "The description or the unit of measure held in engineering does not agree with the item master. Neither system is wrong on its own; they were never reconciled.",
      sourceKey: "FABRIC.SILVER_PART_CONFORMED",
    },
    {
      id: "stale",
      label: "Records untouched in over 36 months",
      count: stale,
      detail: "No purchasing activity and no change since creation. Candidates for retirement rather than remediation.",
      sourceKey: "PART.ORACLE_MATERIAL_TXN",
    },
    {
      id: "orphaned",
      label: "Orphaned records with no transactions and no assembly membership",
      count: orphaned,
      detail: "Nothing has ever been bought against them and no structure uses them. Completing their fields would be wasted effort.",
      sourceKey: "PART.TC_BOM_USAGE",
    },
    {
      id: "uom",
      label: "Units of measure outside the defined set",
      count: rogueUom,
      detail: "Quantities on these records cannot be added to anything else until the unit is mapped or corrected.",
      sourceKey: "PART.ORACLE_UOM",
    },
  ]
}

/* ------------------------------------------------------------------ *
 * Queue economics for the top strip
 * ------------------------------------------------------------------ */

export const REVIEW_MODEL = {
  /** Minutes a reviewer spends on one cluster with the evidence already assembled. */
  minutesWithQueue: 18,
  /** Minutes the same decision takes when the evidence has to be found first. */
  minutesUnassisted: 120,
  analystHoursPerDay: 5,
}

export function queueThroughputPerDay(): number {
  return Math.floor((REVIEW_MODEL.analystHoursPerDay * 60) / REVIEW_MODEL.minutesWithQueue)
}
