/**
 * Domain types for the generated dataset.
 *
 * These are the shapes the screens read. They deliberately use neutral business
 * names. Source system nomenclature lives only in /data/nomenclature.ts and is
 * attached to the interface through source keys, never through field names here.
 */

export type OrgId = 101 | 102 | 103 | 104

export type InventoryOrg = {
  orgId: OrgId
  orgCode: string
  orgName: string
  orgRole: "ASSEMBLY" | "FABRICATION" | "MACHINING" | "DEPOT"
}

export type CommodityGroup = {
  code: string
  name: string
  baseUnitCost: number
}

export type Supplier = {
  supplierId: string
  supplierNumber: string
  supplierName: string
  primaryCommodity: string
  siteCount: number
  active: boolean
  onTimeDeliveryPct: number
  qualityDefectPpm: number
  approvedPartCount: number
  spend24m: number
}

export type PartRecord = {
  partKey: string
  partNumber: string
  orgId: OrgId
  description: string
  commodity: string
  itemType: "PURCHASED" | "MANUFACTURED" | "PHANTOM"
  makeBuy: "MAKE" | "BUY"
  unitOfMeasure: string
  lifecycleStatus: "ACTIVE" | "RESTRICTED" | "OBSOLETE"
  leadTimeDays: number
  reorderPoint: number
  reorderUpTo: number
  onHandQty: number
  unitCost: number
  spend24m: number
  createdOn: string
  supplierPartRef: string | null
  primarySupplierId: string | null
  engineeringItemId: string | null
  duplicateClusterId: string | null
}

export type EngineeringRevision = {
  revisionId: string
  description: string
  releasedOn: string | null
  changeNoticeId: string | null
}

export type EngineeringPart = {
  engineeringItemId: string
  objectName: string
  objectType: "DesignPart" | "StandardPart" | "PurchasedPart"
  classificationClass: string
  currentRevisionId: string
  released: boolean
  revisions: EngineeringRevision[]
  bomUsageCount: number
  lastModifiedOn: string
  oraclePartNumber: string | null
}

export type DuplicateCause =
  | "COPY_PASTE_VARIATION"
  | "REVISION_ABUSE"
  | "SUPPLIER_PART_NUMBER"
  | "ORG_REGISTRATION_SPLIT"

export type DuplicateCluster = {
  clusterId: string
  cause: DuplicateCause
  memberPartKeys: string[]
  memberCount: number
  similarityScore: number
  combinedSpend24m: number
  priceSpreadPct: number
  recommendedSurvivorPartKey: string
  orgSpread: OrgId[]
  reviewState: "UNREVIEWED"
}

export type PurchaseOrderLine = {
  poLineKey: string
  poNumber: string
  lineNumber: number
  partKey: string
  partNumber: string
  supplierId: string
  orgId: OrgId
  commodity: string
  quantity: number
  unitPrice: number
  lineValue: number
  orderedOn: string
  needByOn: string
  promisedOn: string
  receivedOn: string | null
  daysLate: number | null
  status: "OPEN" | "RECEIVED" | "CLOSED" | "CANCELLED"
}

export type Requisition = {
  requisitionNumber: string
  partKey: string
  partNumber: string
  quantity: number
  needByOn: string
  raisedOn: string
  suggestedSupplierId: string | null
  estimatedValue: number
  demandSource: "MRO_WORK_ORDER" | "MIN_MAX_REPLENISHMENT" | "FORECAST" | "MANUAL"
  origin: "SYSTEM_PROPOSED" | "BUYER_RAISED"
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "CONVERTED_TO_ORDER"
  blockedReason: string | null
}

export type MaintainableAsset = {
  assetNumber: string
  description: string
  orgId: OrgId
  assetGroup: string
  criticality: "HIGH" | "MEDIUM" | "LOW"
  conditionScore: number
  meterReading: number
  meterRatePerDay: number
  failures12m: number
  lastServicedOn: string
  nextServiceDueOn: string
  consumesPartKeys: string[]
  signalScore: number
  signalBand: "ATTENTION" | "WATCH" | "HEALTHY"
}

export type PricePoint = {
  commodity: string
  month: string
  index: number
  weightedAvgUnitPrice: number
  volume: number
}

export type DatasetMeta = {
  seed: number
  generatedFor: string
  periodStart: string
  periodEnd: string
  asOf: string
  counts: Record<string, number>
  notice: string
}
