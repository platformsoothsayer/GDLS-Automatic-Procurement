/**
 * Copy for the closing screen.
 *
 * The tone is someone who has delivered this before. No pricing, no logos, no
 * testimonials, and no recommendation on deployment. The deployment choice belongs to
 * the manufacturer and their constraints are not ours to argue with.
 */

export type DeploymentColumn = {
  id: string
  label: string
  computeRuns: string
  dataRests: string
  approvalPath: string
  residency: string
  internalApprovalEffort: string
}

export const UNCHANGED_ACROSS_OPTIONS =
  "Extract, land, conform, resolve, publish. The same seven stages, the same code, the same marts."

export const DEPLOYMENT_COLUMNS: DeploymentColumn[] = [
  {
    id: "on-prem",
    label: "Fully on premise",
    computeRuns: "Inside the manufacturer's own data center, on hardware they already run.",
    dataRests: "Never leaves the estate. No copy exists outside it at any stage.",
    approvalPath: "Entirely internal. The existing change process covers it.",
    residency: "Single site. No cross border question arises.",
    internalApprovalEffort:
      "Lowest. No new vendor, no new region, no external data movement to justify.",
  },
  {
    id: "gov-cloud",
    label: "Hybrid with GovCloud storage",
    computeRuns: "Extraction on premise against the sources. Everything after that in a government cloud region.",
    dataRests: "Landed and conformed copies rest in a government region inside the manufacturer's own tenancy.",
    approvalPath: "Internal, plus a tenancy and region sign off with whoever owns the cloud agreement.",
    residency: "Held to the government region. Controls are inherited from the existing accreditation.",
    internalApprovalEffort:
      "Moderate. The region is usually already accredited, so the argument is about scope rather than principle.",
  },
  {
    id: "databricks",
    label: "Cloud with Databricks",
    computeRuns: "Extraction on premise. Land, conform, resolve and publish in a managed workspace.",
    dataRests: "In one region, in storage the manufacturer owns, with the manufacturer holding the keys.",
    approvalPath: "Internal, plus a third party processing review and a key management decision.",
    residency: "Single region, pinned. Nothing replicates across regions without an explicit change.",
    internalApprovalEffort:
      "Highest. A new processor in the chain is a longer conversation whatever the technical merits.",
  },
]

export const DEPLOYMENT_ROWS: { id: keyof DeploymentColumn; label: string }[] = [
  { id: "computeRuns", label: "Where compute runs" },
  { id: "dataRests", label: "Where data rests" },
  { id: "residency", label: "Data residency" },
  { id: "approvalPath", label: "Approval path" },
  { id: "internalApprovalEffort", label: "Internal approval effort" },
]

export const DEPLOYMENT_NOTE =
  "No recommendation between these three. The deciding constraint is yours."

export type Ask = { title: string; detail: string }

export const WHAT_WE_NEED: Ask[] = [
  {
    title: "Read access to the two source systems",
    detail: "Or an extract in an agreed format on an agreed schedule. Read only is sufficient to start.",
  },
  {
    title: "One subject matter expert per source system",
    detail: "Named, roughly four hours a week. They review the mapping registry and settle what a field means.",
  },
  {
    title: "A landing environment",
    detail: "On premise or otherwise. It has to exist before anything can be loaded into it.",
  },
  {
    title: "A decision owner for merge and completeness rules",
    detail: "One person who can say a cluster is the same part and that a field is required. Not a committee.",
  },
  {
    title: "An approval path definition for any write back",
    detail: "Only needed if the pre-populated mode is in scope. The advisory mode needs none of this.",
  },
]

export type RoadmapBand = {
  /** Matches the accretion horizons on the fabric screen. */
  accretionId: string
  label: string
  duration: string
  sourcesAdded: string
  problemsUnlocked: string[]
  decisionPoint: string
  /** Later bands are deliberately thinner. */
  confidence: "SPECIFIC" | "PROVISIONAL"
}

export const ROADMAP: RoadmapBand[] = [
  {
    accretionId: "today",
    label: "Today to month six",
    duration: "Roughly sixteen weeks to the first working queue, six months to all three",
    sourcesAdded: "The two systems already in scope. Nothing else joins.",
    problemsUnlocked: [
      "Part master duplicate and completeness remediation, running as a reviewed queue",
      "MRO driven replenishment signals feeding a buyer",
      "Automated procurement in advisory mode, with pre-populated mode as an option",
    ],
    decisionPoint:
      "Whether the advisory mode is enough. If it is, the interface work never has to happen.",
    confidence: "SPECIFIC",
  },
  {
    accretionId: "plus6",
    label: "Month six to month eighteen",
    duration: "Shaped once the first three are running",
    sourcesAdded: "Manufacturing execution",
    problemsUnlocked: [
      "Manufacturing bill of materials, work order status and as built configuration become resolvable entities",
      "Which problems that supports depends on what the first six months shows",
    ],
    decisionPoint: "Whether the return from the first three funds the next source, on the evidence rather than on a forecast.",
    confidence: "PROVISIONAL",
  },
  {
    accretionId: "plus18",
    label: "Beyond month eighteen",
    duration: "Shape only",
    sourcesAdded: "Systems modeling and additional geographies",
    problemsUnlocked: [
      "Contract requirement extraction to a draft schedule and bill of materials becomes possible",
    ],
    decisionPoint: "No decision required at this stage.",
    confidence: "PROVISIONAL",
  },
]

export const ROADMAP_NOTE =
  "The later bands carry less detail because the shape is still provisional."

export type Role = { role: string; commitment: string; does: string }

export const STAFFING: Role[] = [
  {
    role: "Data engineer",
    commitment: "Full time",
    does: "Extraction, landing, conformance and the resolution logic. The bulk of the build.",
  },
  {
    role: "Machine learning engineer",
    commitment: "Full time",
    does: "Matching, scoring and the signal models, plus the evaluation that keeps them honest.",
  },
  {
    role: "Solution architect",
    commitment: "Part time",
    does: "The mapping registry, the write back design and the arguments with the source system owners.",
  },
  {
    role: "Your team",
    commitment: "Works alongside",
    does: "Subject matter experts and the decision owner. They stay on the work after we leave.",
  },
]

export const STAFFING_NOTE =
  "Our people work alongside your team throughout. If nobody on your side can run this when we stop, we have built the wrong thing."
