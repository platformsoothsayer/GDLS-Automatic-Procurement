/**
 * Curated copy for the fabric screen.
 *
 * Layer names, accretion steps, federation verdicts and residency wording. Kept here
 * rather than inline so the consultant leading the session can edit the argument
 * without touching the diagram. No source system nomenclature appears here; the two
 * active systems of record are read from the registry at render time.
 */

import type { ActionKind } from "@/context/SessionContext"

/* ---------------- Layer 3, systems of engagement ---------------- */

export type EngagementSystem = {
  id: string
  label: string
  /** What its count is counting, shown beside the number. */
  unit: string
  /** Session actions that feed the count. */
  countKinds: ActionKind[]
  /** Which published mart it reads. Index into the derived mart list. */
  martIndex: number
}

export const ENGAGEMENT_SYSTEMS: EngagementSystem[] = [
  { id: "buyer", label: "Buyer workspace", unit: "requisitions", countKinds: ["REQUISITION_PROPOSED", "REQUISITION_RELEASED"], martIndex: 1 },
  { id: "engineering", label: "Engineering review queue", unit: "clusters", countKinds: ["CLUSTER_ROUTED_TO_ENGINEERING"], martIndex: 0 },
  { id: "planner", label: "Planner signal board", unit: "signals", countKinds: ["SIGNAL_SELECTED"], martIndex: 2 },
]

/* ---------------- Layer 1, systems of record ---------------- */

export type DormantSource = { id: string; label: string }

export const DORMANT_SOURCES: DormantSource[] = [
  { id: "mes", label: "Manufacturing execution" },
  { id: "sysmodel", label: "Systems modeling" },
  { id: "quality", label: "Quality" },
  { id: "maintenance", label: "Maintenance" },
  { id: "finance", label: "Finance" },
  { id: "rest", label: "Plus thousands" },
]

export const DORMANT_NOTE = "Joins when a problem needs it."

export const LAYER_ONE_CAPTION =
  "Systems of record generate data. Intelligence is built above them."

/* ---------------- The pipeline ---------------- */

export type PipelineStageId =
  | "sources" | "extract" | "land" | "conform" | "resolve" | "publish" | "consume"

export type PipelineStage = {
  id: PipelineStageId
  name: string
  layer?: "Bronze" | "Silver" | "Gold"
  /** Resolve is drawn at 1.6 times the width of the others. */
  weight: number
  anchor?: boolean
}

export const PIPELINE: PipelineStage[] = [
  { id: "sources", name: "Sources", weight: 1 },
  { id: "extract", name: "Extract", weight: 1 },
  { id: "land", name: "Land", layer: "Bronze", weight: 1 },
  { id: "conform", name: "Conform", layer: "Silver", weight: 1 },
  { id: "resolve", name: "Resolve", weight: 1.6, anchor: true },
  { id: "publish", name: "Publish", layer: "Gold", weight: 1 },
  { id: "consume", name: "Consume", weight: 1 },
]

export const RESOLVE_CAPTION = "One part. One supplier. One program. Across sources."

/** What the conform stage standardises. */
export const CONFORMED = ["units of measure", "organization codes", "supplier identifiers", "date formats"]

/* ---------------- Governance and security bars ---------------- */

export const GOVERNANCE_LABELS = ["Data owner named per domain", "Steward assigned", "Change controlled"]

export type ResidencyOption = {
  id: string
  label: string
  /** Where each stage physically executes. The pipeline itself does not change. */
  line: string
}

export const RESIDENCY_OPTIONS: ResidencyOption[] = [
  {
    id: "on-prem",
    label: "On premise",
    line: "Extract, land, conform, resolve and publish all execute inside the manufacturer's own data centre. Nothing leaves the estate.",
  },
  {
    id: "azure-gov",
    label: "Azure GovCloud",
    line: "Extract executes on premise against the source systems. Land, conform, resolve and publish execute in a government cloud region inside the manufacturer's own tenancy.",
  },
  {
    id: "databricks-aws",
    label: "Databricks on AWS",
    line: "Extract executes on premise. Land, conform, resolve and publish execute in a managed workspace in one region, with the manufacturer holding the encryption keys.",
  },
]

/* ---------------- Accretion ---------------- */

export type AccretionStep = {
  id: string
  label: string
  summary: string
  caption: string
  /** Dormant source ids that become active at this step. */
  activates: string[]
  /** Entity types resolved by this step, added to everything before it. */
  entitiesGained: string[]
}

export const ACCRETION_STEPS: AccretionStep[] = [
  {
    id: "today",
    label: "Today",
    summary: "Two sources. Three resolved entity types. Three problems live.",
    caption: "Funded by the return on these three problems.",
    activates: [],
    entitiesGained: ["Part", "Supplier", "Asset"],
  },
  {
    id: "plus6",
    label: "Plus six months",
    summary: "Adds manufacturing execution.",
    caption: "Gains manufacturing bill of materials, work order status and as built configuration.",
    activates: ["mes"],
    entitiesGained: ["Manufacturing BOM", "Work order status", "As built configuration"],
  },
  {
    id: "plus18",
    label: "Plus eighteen months",
    summary: "Adds systems modeling and additional geographies.",
    caption:
      "This is the point at which contract requirement extraction to a draft schedule and bill of materials becomes possible.",
    activates: ["mes", "sysmodel"],
    entitiesGained: ["System model", "Requirement", "Site"],
  },
]

/* ---------------- Federation options ---------------- */

export type FederationOption = {
  id: string
  title: string
  body: string
  verdict: string
  tone: "attention" | "healthy" | "neutral"
}

export const FEDERATION_OPTIONS: FederationOption[] = [
  {
    id: "products",
    title: "Off the shelf data layer products",
    body: "Genuinely strong on operational technology and sensor data, and the better choice where that is the problem. Thinner across enterprise transactional systems, where these problems sit.",
    verdict: "Partial fit",
    tone: "attention",
  },
  {
    id: "federate",
    title: "Federate the slice each problem needs",
    body: "Source systems keep operating untouched, work happens on conformed copies, and the change hurdle stays low.",
    verdict: "Recommended",
    tone: "healthy",
  },
  {
    id: "platform",
    title: "Build a platform",
    body: "Viable, and sometimes right. It is a multi year product commitment before the first problem is solved.",
    verdict: "Not now",
    tone: "neutral",
  },
]

/* ---------------- Standing lines ---------------- */

export const EMPTY_LINE = "Three problems build the first section of this."

export const CLOSING_LINE =
  "Data quality is not a prerequisite for the fabric. Entity resolution is the fabric."
