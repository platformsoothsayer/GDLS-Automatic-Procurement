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

/**
 * Nullable fields are the ones the completeness tab measures. A gap is a real null
 * rather than a flag beside a value, so completeness and the attribute comparison
 * can never disagree with each other.
 */
export type PartRecord = {
  partKey: string
  partNumber: string
  orgId: OrgId
  description: string
  /** Grouping key, always present, used by filters. */
  commodity: string
  /** The code as maintained on the item. Absent on some records. */
  commodityCode: string | null
  itemType: "PURCHASED" | "MANUFACTURED" | "PHANTOM"
  makeBuy: "MAKE" | "BUY"
  unitOfMeasure: string | null
  /** True when the unit of measure is outside the defined set. */
  uomOutsideSet: boolean
  lifecycleStatus: "ACTIVE" | "RESTRICTED" | "OBSOLETE"
  leadTimeDays: number | null
  planner: string | null
  buyer: string | null
  minOrderQty: number | null
  orderMultiple: number | null
  reorderPoint: number | null
  reorderUpTo: number | null
  onHandQty: number
  onHandByOrg: { orgCode: string; qty: number }[]
  unitCost: number
  spend24m: number
  purchaseQty24m: number
  poLineCount: number
  createdOn: string
  lastActivityOn: string
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
  classificationClass: string | null
  currentRevisionId: string
  released: boolean
  releaseState: "RELEASED" | "IN_WORK" | "SUPERSEDED"
  owningGroup: string
  unitOfMeasure: string | null
  revisions: EngineeringRevision[]
  bomUsageCount: number
  /** Assemblies the part appears in, by assembly number. */
  assemblies: string[]
  lastModifiedOn: string
  oraclePartNumber: string | null
}

export type DuplicateCause =
  | "COPY_PASTE_VARIATION"
  | "REVISION_ABUSE"
  | "SUPPLIER_PART_NUMBER"
  | "ORG_REGISTRATION_SPLIT"

export type EvidenceCode =
  | "DESCRIPTION_MATCH"
  | "SHARED_SUPPLIER_PART"
  | "CROSS_ORG"
  | "REVISION_ANOMALY"
  | "CLASSIFICATION_MATCH"
  | "UOM_MATCH"
  | "PLANNER_BUYER_MATCH"
  | "SAME_ASSEMBLY"

/**
 * One line of the score. What was compared, what was found, and what it contributed.
 * Contributions can be negative: a model that only adds points is not credible.
 */
export type ClusterEvidence = {
  code: EvidenceCode
  label: string
  finding: string
  points: number
}

export type ClusterStatus = "OPEN" | "MERGED" | "KEPT_SEPARATE" | "ROUTED_TO_ENGINEERING"

export type DuplicateCluster = {
  clusterId: string
  cause: DuplicateCause
  memberPartKeys: string[]
  memberCount: number
  /** Sum of the evidence contributions, clamped to 0 and 100. */
  confidence: number
  similarityScore: number
  evidence: ClusterEvidence[]
  revisionAnomaly: boolean
  combinedSpend24m: number
  priceSpreadPct: number
  /** Duplicate inventory carrying cost plus lost volume leverage. */
  estimatedImpact: number
  carryingCost: number
  leverageLoss: number
  recommendedSurvivorPartKey: string
  orgSpread: OrgId[]
  status: ClusterStatus
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
  /** One is the most critical. Four is the least. */
  criticality: 1 | 2 | 3 | 4
  conditionScore: number
  meterReading: number
  meterRatePerDay: number
  failures12m: number
  lastServicedOn: string
  nextServiceDueOn: string
  /** The spare this asset is most likely to need next. */
  primarySparePartKey: string
  consumesPartKeys: string[]
  /**
   * The earlier of the next planned service and a failure date predicted from
   * condition. This is the date the timing condition is measured against.
   */
  predictedNeedOn: string
  needBasis: "PLANNED_SERVICE" | "PREDICTED_FAILURE"
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
