/**
 * Curated copy for the part master screen.
 *
 * Attribute labels, evidence chip labels and the wording of each confirmation. The
 * confirmations matter most: nothing on this screen may imply an automatic write to
 * a production system, and that promise is kept here in one place.
 */

import type { EvidenceCode } from "@/lib/domain"
import type { SourceKey } from "@/data/nomenclature"

export const EVIDENCE_LABEL: Record<EvidenceCode, string> = {
  DESCRIPTION_MATCH: "description match",
  SHARED_SUPPLIER_PART: "shared supplier part",
  SAME_ASSEMBLY: "same assembly",
  REVISION_ANOMALY: "revision anomaly",
  CROSS_ORG: "cross org",
  CLASSIFICATION_MATCH: "classification",
  UOM_MATCH: "unit of measure",
  PLANNER_BUYER_MATCH: "planner and buyer",
}

/** The five the queue shows as chips. The rest are scoring detail. */
export const CHIP_EVIDENCE: EvidenceCode[] = [
  "REVISION_ANOMALY",
  "SHARED_SUPPLIER_PART",
  "CROSS_ORG",
  "DESCRIPTION_MATCH",
  "SAME_ASSEMBLY",
]

export type AttributeSpec = { id: string; label: string; sourceKey: SourceKey }

export const ORACLE_ATTRIBUTES: AttributeSpec[] = [
  { id: "itemNumber", label: "Item number", sourceKey: "PART.ORACLE_IDENTITY" },
  { id: "description", label: "Description", sourceKey: "PART.ORACLE_DESCRIPTION" },
  { id: "unitOfMeasure", label: "Primary unit of measure", sourceKey: "PART.ORACLE_UOM" },
  { id: "itemType", label: "Item type", sourceKey: "PART.ORACLE_IDENTITY" },
  { id: "commodityCode", label: "Commodity code", sourceKey: "PART.ORACLE_COMMODITY" },
  { id: "planner", label: "Planner", sourceKey: "PART.ORACLE_PLANNING" },
  { id: "buyer", label: "Buyer", sourceKey: "PART.ORACLE_PLANNING" },
  { id: "leadTimeDays", label: "Lead time", sourceKey: "PART.ORACLE_PLANNING" },
  { id: "onHand", label: "On hand across organizations", sourceKey: "PART.ORACLE_ONHAND" },
  { id: "supplierPartRef", label: "Supplier part cross reference", sourceKey: "PART.ORACLE_SUPPLIER_CROSSREF" },
  { id: "purchaseVolume", label: "24 month purchase volume", sourceKey: "PO.LINE" },
  { id: "purchaseSpend", label: "24 month spend", sourceKey: "PO.LINE" },
]

export const TEAMCENTER_ATTRIBUTES: AttributeSpec[] = [
  { id: "engineeringItemId", label: "Part identifier", sourceKey: "PART.TC_ITEM_IDENTITY" },
  { id: "revision", label: "Revision", sourceKey: "PART.TC_REVISION" },
  { id: "revisionHistory", label: "Revision history", sourceKey: "PART.TC_CHANGE_NOTICE" },
  { id: "releaseState", label: "Release status", sourceKey: "PART.TC_REVISION" },
  { id: "owningUser", label: "Owning user", sourceKey: "PART.TC_REVISION" },
  { id: "classification", label: "Classification", sourceKey: "PART.TC_CLASSIFICATION" },
  { id: "assemblies", label: "Assemblies the part appears in", sourceKey: "PART.TC_BOM_USAGE" },
]

export const REVISION_HISTORY_NOTE =
  "A revision marked * was created with no change notice delivering it."

export const COMPLETENESS_CLOSING =
  "Only the fields these three processes require are in scope."

export const INTEGRITY_TITLE = "Other integrity findings"

/** Wording for each confirmation. Deliberately explicit about what is not automatic. */
export type ActionSpec = {
  id: "MERGED" | "KEPT_SEPARATE" | "ROUTED_TO_ENGINEERING"
  label: string
  tone: "cyan" | "neutral" | "attention"
  confirmTitle: string
  /** Filled with the surviving item number and system names at render time. */
  lines: (ctx: { survivor: string; others: number; oracle: string; teamcenter: string }) => string[]
  assurance: string
}

export const ACTIONS: ActionSpec[] = [
  {
    id: "MERGED",
    label: "Merge",
    tone: "cyan",
    confirmTitle: "Merge this cluster",
    lines: (c) => [
      `Proposed surviving item number ${c.survivor}. Proposed, not chosen automatically, and a reviewer can pick a different survivor.`,
      c.others === 1
        ? "1 item record would be marked superseded and its demand redirected to the survivor."
        : `${c.others} item records would be marked superseded and their demand redirected to the survivor.`,
      `The write back is a staged item update in ${c.oracle}, held for approval.`,
      `No change is made in ${c.teamcenter}. Engineering identity is untouched by a commercial merge.`,
    ],
    assurance: "Nothing on this screen writes to a production system. Approval happens in the source system, by a person.",
  },
  {
    id: "KEPT_SEPARATE",
    label: "Keep separate",
    tone: "neutral",
    confirmTitle: "Keep these parts separate",
    lines: (c) => [
      "The cluster is closed as reviewed and leaves the queue.",
      "A do not match rule is recorded so the same pair is not raised again.",
      `Nothing changes in ${c.oracle} or ${c.teamcenter}.`,
    ],
    assurance: "The rule lives in the fabric, not in either source system.",
  },
  {
    id: "ROUTED_TO_ENGINEERING",
    label: "Route to engineering",
    tone: "attention",
    confirmTitle: "Route to engineering review",
    lines: (c) => [
      "The cluster moves to the engineering review queue with the evidence attached.",
      "A commercial reviewer cannot judge whether two revisions are the same physical part. Engineering can.",
      `Nothing changes in ${c.oracle} or ${c.teamcenter} until engineering responds.`,
    ],
    assurance: "Routing is a hand off, not a decision.",
  },
]
