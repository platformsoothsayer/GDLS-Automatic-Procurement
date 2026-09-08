/**
 * Candidate problem catalogue for screen 1.
 *
 * Curated presentation content, not seeded data. Positions on the scatter plot are
 * composed deliberately so the plot reads in the few seconds a presenter has, which
 * is something random generation cannot do. Every figure is illustrative.
 *
 * Source system nomenclature is never written here. Where a highlighted problem
 * names the data it needs, it carries a key into /data/nomenclature.ts and a plain
 * business label for the chip. The eleven unhighlighted candidates deliberately name
 * data that sits outside the two systems in scope, which is part of why they are not
 * where we start.
 */

import type { SourceKey } from "@/data/nomenclature"

export type ProblemDetail = {
  /** One sentence in operational terms. What goes wrong, not how it is built. */
  statement: string
  /** Which registry entry the value estimate is derived from. */
  valueSourceKey: SourceKey
  sources: { label: string; key: SourceKey }[]
  /** Share of the application estate this problem needs. Reads as a sliver. */
  estateFractionPct: number
}

export type CandidateProblem = {
  id: string
  name: string
  /** Estimated annual value in dollars. Plotted on the horizontal axis. */
  annualValue: number
  /** Strategic alignment, 1 to 5. Plotted on the vertical axis. */
  alignment: number
  /** Data readiness effort index. Circle AREA is proportional to this. */
  effort: number
  /** One line on why it sits where it sits on the alignment axis. */
  rationale: string
  /** Shown as small chips on hover. Plain labels, several outside the two systems. */
  hoverSources: string[]
  highlighted: boolean
  /** Composed by hand so the three labels never collide with each other or a circle. */
  labelPlacement?: "above" | "below" | "left"
  labelLines?: [string, string]
  detail?: ProblemDetail
}

export const CANDIDATE_PROBLEMS: CandidateProblem[] = [
  {
    id: "part-master",
    name: "Part master duplicate and completeness remediation",
    annualValue: 4_200_000,
    alignment: 4.6,
    effort: 34,
    rationale: "Every downstream commercial decision inherits the part master, so nothing else improves until this does.",
    hoverSources: ["Item master", "Descriptions", "Engineering revisions", "Supplier cross references", "Purchase history"],
    highlighted: true,
    labelPlacement: "above",
    labelLines: ["Part master duplicate and", "completeness remediation"],
    detail: {
      statement:
        "The same physical part is registered more than once, so buyers pay different prices for it and planners hold stock against the wrong record.",
      valueSourceKey: "DUP.SPEND_EXPOSURE",
      // Four chips, short labels. The exact object and fields are one click away in
      // the lineage panel, so the chip only has to say which body of data is needed.
      sources: [
        { label: "Item master", key: "PART.ORACLE_IDENTITY" },
        { label: "Descriptions", key: "PART.ORACLE_DESCRIPTION" },
        { label: "Revisions", key: "PART.TC_REVISION" },
        { label: "Supplier refs", key: "PART.ORACLE_SUPPLIER_CROSSREF" },
      ],
      estateFractionPct: 2.2,
    },
  },
  {
    id: "mro-signals",
    name: "MRO driven replenishment signals",
    annualValue: 2_600_000,
    alignment: 4.2,
    effort: 42,
    rationale: "Depot availability is a board level measure and the signals already sit in the maintenance record.",
    hoverSources: ["Asset register", "Work orders", "Meter readings", "Criticality"],
    highlighted: true,
    labelPlacement: "left",
    labelLines: ["MRO driven", "replenishment signals"],
    detail: {
      statement:
        "The maintenance record already shows which assets are degrading, but nobody turns that into a replenishment instruction before the part is needed.",
      valueSourceKey: "GOLD.REPLENISHMENT_SIGNAL",
      sources: [
        { label: "Asset register", key: "MRO.ASSET_REGISTER" },
        { label: "Criticality", key: "MRO.ASSET_CRITICALITY" },
        { label: "Work orders", key: "MRO.WORK_ORDER" },
        { label: "Meter readings", key: "MRO.METER_READING" },
      ],
      estateFractionPct: 2.8,
    },
  },
  {
    id: "auto-procurement",
    name: "Automated procurement from signal to purchase order",
    annualValue: 8_400_000,
    alignment: 4.8,
    effort: 55,
    rationale: "Buyer capacity is the constraint on throughput, and the approvals are already codified.",
    hoverSources: ["Approved supplier list", "Purchase history", "Requisitions", "Delivery performance"],
    highlighted: true,
    labelPlacement: "below",
    labelLines: ["Automated procurement from", "signal to purchase order"],
    detail: {
      statement:
        "A buyer retypes what the system already knows, and the order waits in a queue behind work that needed no judgement.",
      valueSourceKey: "SUP.PRICE_VARIANCE",
      sources: [
        { label: "Approved list", key: "SUP.APPROVED_LIST" },
        { label: "Requisitions", key: "REQ.LINE" },
        { label: "Purchase history", key: "PO.LINE" },
        { label: "Delivery record", key: "SUP.OTD_PERFORMANCE" },
      ],
      estateFractionPct: 3.4,
    },
  },

  /* The eleven we are not starting with. */
  {
    id: "warranty-clustering",
    name: "Warranty claim clustering",
    annualValue: 9_500_000,
    alignment: 3.3,
    effort: 88,
    rationale: "The largest prize on the board, but the field data sits outside the two systems in scope.",
    hoverSources: ["Warranty claims", "Field service records", "Build records", "Item master"],
    highlighted: false,
  },
  {
    id: "ec-impact",
    name: "Engineering change impact analysis",
    annualValue: 900_000,
    alignment: 4.05,
    effort: 88,
    rationale: "Well aligned to engineering, but structures and change history need substantial preparation first.",
    hoverSources: ["Engineering structures", "Change notices", "Item master"],
    highlighted: false,
  },
  {
    id: "spare-parts-forecast",
    name: "Spare parts demand forecasting",
    annualValue: 3_200_000,
    alignment: 3.9,
    effort: 40,
    rationale: "Close to the replenishment problem and better sequenced after it rather than beside it.",
    hoverSources: ["Consumption history", "Work orders", "On hand balances"],
    highlighted: false,
  },
  {
    id: "obsolete-inventory",
    name: "Obsolete inventory identification",
    annualValue: 2_000_000,
    alignment: 3.6,
    effort: 30,
    rationale: "A one off balance sheet gain rather than a repeatable change to how the business runs.",
    hoverSources: ["On hand balances", "Consumption history", "Item master"],
    highlighted: false,
  },
  {
    id: "otd-prediction",
    name: "Supplier on time delivery prediction",
    annualValue: 1_700_000,
    alignment: 3.35,
    effort: 46,
    rationale: "Useful to planning, though the prediction changes little that a buyer can act on today.",
    hoverSources: ["Purchase history", "Receipts", "Supplier master"],
    highlighted: false,
  },
  {
    id: "supplier-risk",
    name: "Supplier risk scoring",
    annualValue: 760_000,
    alignment: 3.05,
    effort: 66,
    rationale: "Depends on external data the manufacturer does not hold today.",
    hoverSources: ["Supplier master", "Delivery performance", "External risk feeds"],
    highlighted: false,
  },
  {
    id: "ncr-triage",
    name: "Quality nonconformance triage",
    annualValue: 1_150_000,
    alignment: 2.7,
    effort: 62,
    rationale: "Owned by quality and measured locally rather than at enterprise level.",
    hoverSources: ["Nonconformance records", "Inspection results", "Item master"],
    highlighted: false,
  },
  {
    id: "tooling-utilization",
    name: "Tooling utilization",
    annualValue: 520_000,
    alignment: 2.45,
    effort: 54,
    rationale: "A plant level gain that does not move an enterprise measure.",
    hoverSources: ["Machine monitoring", "Work orders", "Tooling register"],
    highlighted: false,
  },
  {
    id: "contract-extraction",
    name: "Contract requirement extraction",
    annualValue: 340_000,
    alignment: 2.4,
    effort: 92,
    rationale: "Unstructured documents make this a long build for a narrow audience.",
    hoverSources: ["Contract documents", "Clause library", "Supplier master"],
    highlighted: false,
  },
  {
    id: "freight-mode",
    name: "Freight mode optimization",
    annualValue: 4_600_000,
    alignment: 2.2,
    effort: 71,
    rationale: "Owned by logistics under a separate contract and a separate roadmap.",
    hoverSources: ["Freight invoices", "Shipment records", "Carrier contracts"],
    highlighted: false,
  },
  {
    id: "labor-variance",
    name: "Shop floor labor variance",
    annualValue: 780_000,
    alignment: 2.0,
    effort: 58,
    rationale: "Reporting is already adequate and the variance is understood by the plants.",
    hoverSources: ["Labor bookings", "Work orders", "Standard routings"],
    highlighted: false,
  },
]

export const HIGHLIGHTED_PROBLEMS = CANDIDATE_PROBLEMS.filter((p) => p.highlighted)

/** Plot geometry. Kept beside the data so the band and the points can never drift apart. */
export const PLOT = {
  valueMin: 100_000,
  valueMax: 20_000_000,
  valueTicks: [100_000, 300_000, 1_000_000, 3_000_000, 10_000_000, 20_000_000],
  alignmentDomain: [0.7, 5.4] as [number, number],
  alignmentTicks: [1, 2, 3, 4, 5],
  /** Circle area in square pixels per unit of data readiness effort. */
  areaPerEffort: 10,
  /** The start here band, as a centre line across the value axis and a half height. */
  band: { startAlignment: 2.7, endAlignment: 5.0, halfHeight: 0.5 },
}

export function radiusFor(effort: number): number {
  return Math.sqrt((effort * PLOT.areaPerEffort) / Math.PI)
}

/** Position along the value axis, 0 at the left edge and 1 at the right. */
export function valueFraction(annualValue: number): number {
  const lo = Math.log10(PLOT.valueMin)
  const hi = Math.log10(PLOT.valueMax)
  return (Math.log10(annualValue) - lo) / (hi - lo)
}

export function bandCentreAt(annualValue: number): number {
  const { startAlignment, endAlignment } = PLOT.band
  return startAlignment + (endAlignment - startAlignment) * valueFraction(annualValue)
}
