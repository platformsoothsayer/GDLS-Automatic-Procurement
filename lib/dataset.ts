/**
 * Typed access to the generated dataset.
 *
 * The JSON under /data/generated is produced at build time by scripts/generate.ts.
 * Nothing here generates data. Screens should select and aggregate on the server
 * and pass only what they need into client components, so a 5,600 line order table
 * never reaches the browser whole.
 */

import assets from "@/data/generated/assets.json"
import commodities from "@/data/generated/commodities.json"
import duplicateClusters from "@/data/generated/duplicate-clusters.json"
import engineeringParts from "@/data/generated/engineering-parts.json"
import meta from "@/data/generated/meta.json"
import orgs from "@/data/generated/orgs.json"
import parts from "@/data/generated/parts.json"
import priceHistory from "@/data/generated/price-history.json"
import purchaseOrderLines from "@/data/generated/purchase-order-lines.json"
import requisitions from "@/data/generated/requisitions.json"
import suppliers from "@/data/generated/suppliers.json"

import type {
  CommodityGroup,
  DatasetMeta,
  DuplicateCluster,
  EngineeringPart,
  InventoryOrg,
  MaintainableAsset,
  PartRecord,
  PricePoint,
  PurchaseOrderLine,
  Requisition,
  Supplier,
} from "./domain"

/**
 * The JSON loses the string literal unions on the way through the file, so each
 * collection is asserted back to its domain type. The generator is typed against the
 * same types, so the shapes cannot drift apart without a compile error there.
 */
export const DATASET = {
  meta: meta as DatasetMeta,
  orgs: orgs as unknown as InventoryOrg[],
  commodities: commodities as unknown as CommodityGroup[],
  suppliers: suppliers as unknown as Supplier[],
  parts: parts as unknown as PartRecord[],
  engineeringParts: engineeringParts as unknown as EngineeringPart[],
  duplicateClusters: duplicateClusters as unknown as DuplicateCluster[],
  purchaseOrderLines: purchaseOrderLines as unknown as PurchaseOrderLine[],
  requisitions: requisitions as unknown as Requisition[],
  assets: assets as unknown as MaintainableAsset[],
  priceHistory: priceHistory as unknown as PricePoint[],
}
