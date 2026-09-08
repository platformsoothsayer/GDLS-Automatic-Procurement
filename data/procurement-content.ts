/**
 * Curated copy for the automated procurement screen.
 *
 * The two modes at stage three are the change management answer, so their wording is
 * the most load bearing text in the build. Both end at a human and neither is
 * presented as the real one.
 */

import type { SourceKey } from "@/data/nomenclature"

export type StageId = "intake" | "recommendation" | "fork" | "rfq"

export type StageSpec = {
  id: StageId
  n: number
  label: string
  short: string
  /** The gold mart this stage reads from. Shown on the rail in both views. */
  martKey: SourceKey
}

export const STAGES: StageSpec[] = [
  { id: "intake", n: 1, label: "Signal intake", short: "Intake", martKey: "GOLD.REPLENISHMENT_SIGNAL" },
  { id: "recommendation", n: 2, label: "Recommendation", short: "Recommend", martKey: "GOLD.PART_ENTITY" },
  { id: "fork", n: 3, label: "The fork", short: "Fork", martKey: "GOLD.PART_ENTITY" },
  { id: "rfq", n: 4, label: "RFQ branch", short: "RFQ", martKey: "GOLD.SUPPLIER_PERFORMANCE" },
]

export type SignalSource = {
  id: string
  label: string
  status: "LIVE" | "PHASE_2" | "PHASE_3"
  note: string
}

export const SIGNAL_SOURCES: SignalSource[] = [
  { id: "mro", label: "Maintenance and MRO", status: "LIVE", note: "Live, carrying real signals" },
  { id: "demand", label: "Demand plan", status: "PHASE_2", note: "Same sequence, different trigger" },
  { id: "price", label: "Price forecast", status: "PHASE_3", note: "Same sequence, different trigger" },
]

export const INTAKE_LINE = "One source is live. The same sequence runs when the other two are added."

export type ModeSpec = {
  id: "advisory" | "prepopulated"
  name: string
  headline: string
  body: string
  requires: string[]
  /** Only the pre-populated mode names integration mechanisms. Both, never one. */
  integrationKeys?: SourceKey[]
  endsAt: string
  actionLabel: string
  footnote?: string
}

export const MODES: ModeSpec[] = [
  {
    id: "advisory",
    name: "Mode A · Advisory",
    headline: "The system recommends, your buyer creates the document.",
    body: "The fabric produces the values. A person keys them into the source system exactly as they always have. Most organizations start here, and a good number stay here.",
    requires: ["No system integration", "A report and a person", "No change to any source system"],
    endsAt: "The buyer creates the requisition. Nothing is written on their behalf.",
    actionLabel: "Hand to buyer",
    footnote: "This mode can be running in weeks because it changes nothing in the source system.",
  },
  {
    id: "prepopulated",
    name: "Mode B · Pre-populated",
    headline: "The system stages the document, your buyer approves.",
    body: "The same values are staged and the requisition is created in an unapproved state. It sits in the buyer's queue as a draft.",
    requires: ["Interface access", "Approval hierarchy mapping", "An audit trail on every staged row"],
    integrationKeys: ["WRITEBACK.REQ_INTERFACE", "WRITEBACK.SOA_GATEWAY"],
    endsAt: "The document exists but is unapproved. No commitment exists until a person approves it.",
    actionLabel: "Stage for approval",
  },
]

export const MODE_ASSURANCE =
  "Both modes end at a person. Neither creates an approved document and neither commits the manufacturer to anything."

export type ApprovalLevel = { role: string; threshold: number | null }

export const APPROVAL_HIERARCHY: ApprovalLevel[] = [
  { role: "Buyer, as originator", threshold: null },
  { role: "Category manager", threshold: 50_000 },
  { role: "Procurement lead", threshold: 250_000 },
  { role: "Plant controller", threshold: 1_000_000 },
]

export const NEGOTIATE_LABEL = "Negotiate before committing"

export const RFQ_STEPS = [
  { n: 1, label: "RFQ created", short: "Created" },
  { n: 2, label: "Issued to suppliers", short: "Issued" },
  { n: 3, label: "Responses received", short: "Responses" },
  { n: 4, label: "Summary and ranking", short: "Ranking" },
  { n: 5, label: "Award decision", short: "Award" },
]

export const RFQ_CHANNEL = "the supplier portal"

/**
 * Two routes for the request itself. Whether Oracle Sourcing is licensed and in use
 * is unconfirmed, so both are carried and neither is committed to.
 */
export const RFQ_ROUTES: { key: SourceKey; label: string; note: string }[] = [
  {
    key: "RFQ.SOURCING_AUCTION",
    label: "Sourcing route",
    note: "If Oracle Sourcing is licensed and in use, the request is raised as a sourcing event.",
  },
  {
    key: "RFQ.CORE_DOCUMENT",
    label: "Core purchasing route",
    note: "If it is not, the same request runs through core purchasing request and quotation documents.",
  },
]

export const RFQ_ROUTE_NOTE =
  "Both routes are carried in the registry. Which one applies is a question for your purchasing team."

/**
 * Two routes for the write back after an award, for the same reason.
 */
export const WRITEBACK_ROUTE_NOTE =
  "Which one applies depends on release and installed components, and is your call."

/** How a quotation is scored once it has passed the feasibility gate. */
export const RANKING_WEIGHTS = { price: 50, delivery: 25, quality: 15, terms: 10 }

export const RANKING_NOTE =
  "Feasibility is checked before price. A quotation that cannot arrive before the need date is excluded from the ranking."

export const AWARD_JUSTIFICATION_PROMPT =
  "This is not the top ranked response. A justification is required before the award can be recorded."
