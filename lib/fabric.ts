/**
 * Figures for the fabric screen, derived from the generated dataset and the
 * nomenclature registry.
 *
 * Nothing here is written by hand. Row counts come from the seeded data, object
 * counts come from counting distinct objects in the registry, and mart names come
 * from the registry entry for each mart. Change the seed or the registry and these
 * move with it.
 *
 * Computed on the server so the browser never receives the whole dataset.
 */

import { DATASET } from "./dataset"
import { getSource, NOMENCLATURE, SOURCE_KEYS, type SourceKey, type SourceRef } from "@/data/nomenclature"

export type SourceFigure = {
  system: SourceRef["system"]
  sourceKey: SourceKey
  rows: number
  objects: number
  /** Extraction method, in the plain terms the registry describes. */
  method: string
}

export type MartFigure = {
  sourceKey: SourceKey
  mart: string
  rows: number
}

export type FabricFigures = {
  sources: SourceFigure[]
  bronze: { objects: number; rows: number }
  resolution: {
    partsIn: number
    partsOut: number
    clusters: number
    clusterMembers: number
    supplierSites: number
    suppliers: number
  }
  marts: MartFigure[]
}

function distinctBronzeObjects(system: SourceRef["system"]): number {
  const objects = new Set<string>()
  for (const key of SOURCE_KEYS) {
    const entry = NOMENCLATURE[key]
    if (entry.layer === "BRONZE" && entry.system === system) objects.add(entry.object)
  }
  return objects.size
}

export function buildFabricFigures(): FabricFigures {
  const { parts, suppliers, purchaseOrderLines, requisitions, assets, engineeringParts, duplicateClusters } = DATASET

  const oracleRows =
    parts.length + suppliers.length + purchaseOrderLines.length + requisitions.length + assets.length
  const teamcenterRows =
    engineeringParts.length + engineeringParts.reduce((sum, e) => sum + e.revisions.length, 0)

  const clusterMembers = duplicateClusters.reduce((sum, c) => sum + c.memberCount, 0)
  // Every cluster collapses to one surviving part, so the estate shrinks by the
  // members beyond the survivor.
  const partsOut = parts.length - (clusterMembers - duplicateClusters.length)
  const supplierSites = suppliers.reduce((sum, s) => sum + s.siteCount, 0)

  const mart = (sourceKey: SourceKey, rows: number): MartFigure => ({
    sourceKey,
    mart: getSource(sourceKey).mart ?? "",
    rows,
  })

  return {
    sources: [
      {
        system: "ORACLE_EBS",
        sourceKey: "FABRIC.BRONZE_ORACLE",
        rows: oracleRows,
        objects: distinctBronzeObjects("ORACLE_EBS"),
        method: "delta · scheduled",
      },
      {
        system: "TEAMCENTER",
        sourceKey: "FABRIC.BRONZE_TEAMCENTER",
        rows: teamcenterRows,
        objects: distinctBronzeObjects("TEAMCENTER"),
        method: "service · query",
      },
    ],
    bronze: {
      objects: distinctBronzeObjects("ORACLE_EBS") + distinctBronzeObjects("TEAMCENTER"),
      rows: oracleRows + teamcenterRows,
    },
    resolution: {
      partsIn: parts.length,
      partsOut,
      clusters: duplicateClusters.length,
      clusterMembers,
      supplierSites,
      suppliers: suppliers.length,
    },
    marts: [
      mart("GOLD.PART_ENTITY", partsOut),
      mart("GOLD.SUPPLIER_PERFORMANCE", suppliers.length),
      mart("GOLD.REPLENISHMENT_SIGNAL", assets.length),
    ],
  }
}
