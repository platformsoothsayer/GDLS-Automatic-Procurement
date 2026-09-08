/**
 * SINGLE SOURCE OF NOMENCLATURE
 * =============================
 * Seeded from the nomenclature appendix supplied by the engagement lead.
 *
 * This is the ONLY file in the codebase permitted to contain an Oracle EBS table
 * name, an Oracle EBS column name, a Teamcenter business object name, a Teamcenter
 * SOA service name or a Teamcenter property name. Every screen imports by key.
 *
 * Two rules carried from the appendix:
 *
 *  1. All Teamcenter extraction is through SOA services. Direct queries against the
 *     underlying persistent object model are not supported and must not appear
 *     anywhere in the build.
 *  2. Where the appendix names an object but not its columns, the entry is
 *     registered at OBJECT level and no field name is asserted. That covers the
 *     maintenance objects, the Teamcenter structure, classification and change
 *     objects, the receiving tables and the write back mechanisms.
 *
 * Every entry reads NEEDS_SME_REVIEW. Nothing here goes in front of the client until
 * someone who has worked with these systems has checked it.
 */

export type SourceRef = {
  key: string
  system: "ORACLE_EBS" | "TEAMCENTER"
  object: string
  service?: string
  /**
   * How far the registration goes.
   *
   * FIELD  the object and its column or property names are asserted.
   * OBJECT the object is named but its field names are NOT asserted. The entries
   *        below describe what is needed, not what the source calls it.
   *
   * Defaults to FIELD when absent.
   */
  granularity?: "OBJECT" | "FIELD"
  fields: { name: string; note: string }[]
  layer: "BRONZE" | "SILVER" | "GOLD"
  mart?: string
  transform: string
  assumption?: string
  verified: "VERIFIED" | "NEEDS_SME_REVIEW"
}

/** The three published marts. Named in the appendix. */
export const MARTS = {
  PART_ENTITY: "gold_part_entity",
  SUPPLIER_PERFORMANCE: "gold_supplier_performance",
  REPLENISHMENT_SIGNAL: "gold_replenishment_signal",
} as const

const SUPPLIER_RELEASE_NOTE =
  "On older releases these are PO_VENDORS and PO_VENDOR_SITES_ALL. Confirm the release before the call."

const SOURCING_NOTE =
  "Whether Oracle Sourcing is licensed and in use requires confirmation. If it is not, the request for quotation branch runs through the core purchasing route instead. Both are carried here and neither is committed to."

const WRITEBACK_NOTE =
  "The choice between interface tables and the Integrated SOA Gateway depends on release and installed components. Both are carried here and neither is committed to."

const MAINTENANCE_NOTE =
  "The maintenance system of record is assumed to be Oracle Enterprise Asset Management and has not been confirmed with the manufacturer. Registered at object level only; no column is named for these objects."

const REGISTRY = {
  /* ------------------------------------------------------------------ *
   * ORACLE EBS · ITEM MASTER AND INVENTORY
   * ------------------------------------------------------------------ */

  "PART.ORACLE_IDENTITY": {
    key: "PART.ORACLE_IDENTITY",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B",
    fields: [
      { name: "inventory_item_id", note: "Internal key for the item" },
      { name: "organization_id", note: "Inventory organization the item row belongs to" },
      { name: "segment1", note: "Displayed part number" },
      { name: "item_type", note: "Item classification" },
      { name: "purchasing_item_flag", note: "Whether the item can be bought" },
    ],
    layer: "BRONZE",
    transform: "Landed row for row from the item master with no reshaping.",
    assumption: "Part numbers are carried in segment1 rather than in a concatenated segment structure.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_DESCRIPTION": {
    key: "PART.ORACLE_DESCRIPTION",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_TL",
    fields: [
      { name: "description", note: "Short description shown to buyers and planners" },
      { name: "language", note: "Translation row filter" },
    ],
    layer: "SILVER",
    transform: "Descriptions are filtered to the base language, trimmed, case folded and stripped of punctuation so near identical text can be compared.",
    assumption: "Only the base language row is in scope.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_REVISION": {
    key: "PART.ORACLE_REVISION",
    system: "ORACLE_EBS",
    object: "MTL_ITEM_REVISIONS_B",
    fields: [
      { name: "revision", note: "Revision as the item master holds it" },
      { name: "effectivity_date", note: "When the revision becomes effective" },
      { name: "implementation_date", note: "When it was implemented" },
    ],
    layer: "SILVER",
    transform: "The item master's own revision is held alongside the engineering revision so the two can be compared rather than assumed to agree.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_SUPPLIER_CROSSREF": {
    key: "PART.ORACLE_SUPPLIER_CROSSREF",
    system: "ORACLE_EBS",
    object: "MTL_CROSS_REFERENCES_B",
    fields: [
      { name: "cross_reference_type", note: "Identifies the row as a supplier reference" },
      { name: "cross_reference", note: "Supplier part number carried against the item" },
      { name: "inventory_item_id", note: "Item the reference points at" },
    ],
    layer: "SILVER",
    transform: "The supplier part number source for duplicate evidence. References are matched across items so one physical part bought under two supplier numbers can be recognised.",
    assumption: "Supplier cross references are maintained here rather than only on the purchase order.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_COMMODITY": {
    key: "PART.ORACLE_COMMODITY",
    system: "ORACLE_EBS",
    object: "MTL_ITEM_CATEGORIES joined to MTL_CATEGORIES_B",
    fields: [
      { name: "category_set_id", note: "Identifies the purchasing category set" },
      { name: "segment1", note: "Commodity code on the category" },
    ],
    layer: "SILVER",
    transform: "The purchasing category set assignment is resolved to a single commodity code per part.",
    assumption: "One purchasing category set is authoritative for commodity reporting.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_UOM": {
    key: "PART.ORACLE_UOM",
    system: "ORACLE_EBS",
    object: "MTL_UNITS_OF_MEASURE_TL",
    fields: [
      { name: "uom_code", note: "Unit of measure code" },
      { name: "unit_of_measure", note: "Readable unit name" },
    ],
    layer: "SILVER",
    transform: "The primary unit held on the item is resolved to a name and normalised so quantities from different plants can be added together.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_ORG_ASSIGNMENT": {
    key: "PART.ORACLE_ORG_ASSIGNMENT",
    system: "ORACLE_EBS",
    object: "MTL_PARAMETERS",
    fields: [
      { name: "organization_id", note: "Inventory organization key" },
      { name: "organization_code", note: "Short code shown in the interface" },
    ],
    layer: "SILVER",
    transform: "Source of the inventory organization dimension used for cross organization duplicates.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_ONHAND": {
    key: "PART.ORACLE_ONHAND",
    system: "ORACLE_EBS",
    object: "MTL_ONHAND_QUANTITIES_DETAIL",
    fields: [
      { name: "inventory_item_id", note: "Item the balance belongs to" },
      { name: "organization_id", note: "Plant holding the stock" },
      { name: "primary_transaction_quantity", note: "Quantity on hand in the primary unit" },
    ],
    layer: "SILVER",
    transform: "Detail balances are summed to one on hand figure per part per plant.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_SUBINVENTORY": {
    key: "PART.ORACLE_SUBINVENTORY",
    system: "ORACLE_EBS",
    object: "MTL_SECONDARY_INVENTORIES",
    fields: [{ name: "subinventory", note: "Storage location within the plant" }],
    layer: "SILVER",
    transform: "Storage locations are attached to the on hand balance so stock can be located, not just counted.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_PLANNING": {
    key: "PART.ORACLE_PLANNING",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B",
    fields: [
      { name: "primary_uom_code", note: "Primary unit the item is planned and bought in" },
      { name: "planner_code", note: "Planner assigned to the item" },
      { name: "buyer_id", note: "Buyer assigned to the item" },
      { name: "full_lead_time", note: "Total lead time in days" },
      { name: "preprocessing_lead_time", note: "Days before the order is placed" },
      { name: "processing_lead_time", note: "Days the supplier takes" },
      { name: "postprocessing_lead_time", note: "Days after receipt before the part is usable" },
      { name: "fixed_lot_multiplier", note: "Order multiple applied by planning" },
      { name: "minimum_order_quantity", note: "Order floor applied by planning" },
    ],
    layer: "SILVER",
    transform: "Planning and order modifier attributes are read per organization and compared across plants to expose parts planned inconsistently. These are the fields the recommendation applies when it works out a quantity.",
    assumption: "Full lead time is the figure to plan against. Whether the three component lead times are maintained separately needs checking.",
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * ORACLE EBS · SUPPLIERS
   * ------------------------------------------------------------------ */

  "SUP.MASTER": {
    key: "SUP.MASTER",
    system: "ORACLE_EBS",
    object: "AP_SUPPLIERS",
    fields: [
      { name: "vendor_id", note: "Supplier key" },
      { name: "vendor_name", note: "Supplier name" },
      { name: "segment1", note: "Supplier number shown to buyers" },
    ],
    layer: "BRONZE",
    transform: "Supplier records are landed as held, including inactive suppliers so history stays readable.",
    assumption: SUPPLIER_RELEASE_NOTE,
    verified: "NEEDS_SME_REVIEW",
  },

  "SUP.SITE": {
    key: "SUP.SITE",
    system: "ORACLE_EBS",
    object: "AP_SUPPLIER_SITES_ALL",
    fields: [
      { name: "vendor_site_id", note: "Supplier site key" },
      { name: "vendor_site_code", note: "Site code used on the purchase order" },
      { name: "org_id", note: "Operating unit the site belongs to" },
    ],
    layer: "SILVER",
    transform: "Sites are rolled up to the parent supplier so performance is measured on the company rather than on each shipping location.",
    assumption: SUPPLIER_RELEASE_NOTE,
    verified: "NEEDS_SME_REVIEW",
  },

  "SUP.APPROVED_LIST": {
    key: "SUP.APPROVED_LIST",
    system: "ORACLE_EBS",
    object: "PO_APPROVED_SUPPLIER_LIST",
    fields: [
      { name: "asl_id", note: "Approval record key" },
      { name: "item_id", note: "Part the approval applies to" },
      { name: "vendor_id", note: "Approved supplier" },
      { name: "vendor_site_id", note: "Approved supplier site" },
      { name: "asl_status_id", note: "Approval status of the pairing" },
    ],
    layer: "SILVER",
    transform: "Approved pairings of part and supplier are read so an automated requisition can only ever propose a supplier already approved for that part.",
    assumption: "The approved supplier list is maintained well enough to be the guard rail for automation. This is the assumption most worth testing early.",
    verified: "NEEDS_SME_REVIEW",
  },

  "SUP.ASL_ATTRIBUTES": {
    key: "SUP.ASL_ATTRIBUTES",
    system: "ORACLE_EBS",
    object: "PO_ASL_ATTRIBUTES",
    fields: [
      { name: "processing_lead_time", note: "Lead time quoted by the approved supplier" },
      { name: "min_order_qty", note: "Supplier's own order floor" },
      { name: "fixed_lot_multiple", note: "Supplier's own order multiple" },
    ],
    layer: "SILVER",
    transform: "Supplier held order modifiers are read alongside the planning ones, because the two disagree more often than anyone expects and the recommendation has to say which it used.",
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * ORACLE EBS · PURCHASING
   * ------------------------------------------------------------------ */

  "REQ.HEADER": {
    key: "REQ.HEADER",
    system: "ORACLE_EBS",
    object: "PO_REQUISITION_HEADERS_ALL",
    fields: [
      { name: "requisition_header_id", note: "Requisition key" },
      { name: "segment1", note: "Requisition number" },
      { name: "authorization_status", note: "Where the requisition sits in approval" },
      { name: "org_id", note: "Operating unit the requisition belongs to" },
    ],
    layer: "BRONZE",
    transform: "Requisition headers are landed unchanged.",
    verified: "NEEDS_SME_REVIEW",
  },

  "REQ.LINE": {
    key: "REQ.LINE",
    system: "ORACLE_EBS",
    object: "PO_REQUISITION_LINES_ALL",
    fields: [
      { name: "item_id", note: "The part being requested" },
      { name: "quantity", note: "How many, after order modifiers are applied" },
      { name: "unit_meas_lookup_code", note: "Unit the quantity is expressed in" },
      { name: "need_by_date", note: "Date the material is required on site" },
      { name: "suggested_vendor_id", note: "Supplier proposed on the line" },
      { name: "unit_price", note: "Agreed price where one exists, otherwise last paid" },
      { name: "destination_organization_id", note: "Plant the material is for" },
      { name: "deliver_to_location_id", note: "Where the material is delivered" },
      { name: "requisition_line_id", note: "Line key, assigned on creation" },
    ],
    layer: "SILVER",
    transform: "A proposed requisition line is assembled from the demand signal, the approved supplier for the part and the current agreed price, and is held for a buyer to release.",
    assumption: "Nothing is released to a supplier without a person approving it. Automation stops at the proposal. Note that requisition line type and supplier site are not registered on this object; if the manufacturer keys them, they need adding here first.",
    verified: "NEEDS_SME_REVIEW",
  },

  "REQ.DISTRIBUTION": {
    key: "REQ.DISTRIBUTION",
    system: "ORACLE_EBS",
    object: "PO_REQ_DISTRIBUTIONS_ALL",
    fields: [{ name: "code_combination_id", note: "Account the spend is charged to" }],
    layer: "SILVER",
    transform: "The charge account sits on the distribution rather than on the requisition line, so a proposed requisition has to assemble both.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PO.HEADER": {
    key: "PO.HEADER",
    system: "ORACLE_EBS",
    object: "PO_HEADERS_ALL",
    fields: [
      { name: "po_header_id", note: "Purchase order key" },
      { name: "segment1", note: "Purchase order number" },
      { name: "type_lookup_code", note: "Document type" },
      { name: "vendor_id", note: "Supplier the order was placed with" },
      { name: "vendor_site_id", note: "Supplier site the order was placed against" },
      { name: "authorization_status", note: "Approval state of the order" },
    ],
    layer: "BRONZE",
    transform: "Order headers are landed unchanged.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PO.LINE": {
    key: "PO.LINE",
    system: "ORACLE_EBS",
    object: "PO_LINES_ALL",
    fields: [
      { name: "po_line_id", note: "Order line key" },
      { name: "item_id", note: "Part being bought" },
      { name: "quantity", note: "Quantity ordered" },
      { name: "unit_price", note: "Price agreed on the line" },
      { name: "promised_date", note: "Date the supplier committed to" },
    ],
    layer: "SILVER",
    transform: "Order lines are joined to the part and the supplier and converted to a common currency and unit so prices can be compared across plants.",
    assumption: "A single reporting currency is sufficient for this preview.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PO.SHIPMENT": {
    key: "PO.SHIPMENT",
    system: "ORACLE_EBS",
    object: "PO_LINE_LOCATIONS_ALL",
    fields: [
      { name: "need_by_date", note: "Date the plant required the material" },
      { name: "quantity_received", note: "Quantity received against the shipment" },
    ],
    layer: "SILVER",
    transform: "Committed and required dates are held against each shipment so lateness can be measured against a promise rather than against a wish.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PO.DISTRIBUTION": {
    key: "PO.DISTRIBUTION",
    system: "ORACLE_EBS",
    object: "PO_DISTRIBUTIONS_ALL",
    fields: [{ name: "distribution_id", note: "Distribution key" }],
    layer: "SILVER",
    transform: "Distributions attach each order line to the account the spend is charged to.",
    verified: "NEEDS_SME_REVIEW",
  },

  "RCV.RECEIPT": {
    key: "RCV.RECEIPT",
    system: "ORACLE_EBS",
    object: "RCV_SHIPMENT_LINES joined to RCV_TRANSACTIONS",
    granularity: "OBJECT",
    fields: [
      { name: "receipt date", note: "When the material was received" },
      { name: "quantity received", note: "How much arrived" },
    ],
    layer: "SILVER",
    transform: "The source for the on time delivery calculation on the supplier panel. Receipts are matched to the promised date on the shipment.",
    assumption: "The appendix names these tables but not their columns, so no column is asserted here. Receipts with no committed date are excluded rather than counted as late.",
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * ORACLE EBS · REQUEST FOR QUOTATION AND SOURCING
   * Both routes are carried. Neither is committed to.
   * ------------------------------------------------------------------ */

  "RFQ.CORE_DOCUMENT": {
    key: "RFQ.CORE_DOCUMENT",
    system: "ORACLE_EBS",
    object: "PO_HEADERS_ALL where type_lookup_code in (RFQ, QUOTATION)",
    fields: [
      { name: "po_header_id", note: "Document key" },
      { name: "segment1", note: "Document number shown to buyers and suppliers" },
      { name: "type_lookup_code", note: "Marks the document as a request or a quotation" },
      { name: "vendor_id", note: "Supplier the quotation came from" },
    ],
    layer: "SILVER",
    transform: "The core purchasing route for request and quotation documents. This is the route the branch runs through if Oracle Sourcing is not in use.",
    assumption: SOURCING_NOTE,
    verified: "NEEDS_SME_REVIEW",
  },

  "RFQ.SOURCING_AUCTION": {
    key: "RFQ.SOURCING_AUCTION",
    system: "ORACLE_EBS",
    object: "PON_AUCTION_HEADERS_ALL",
    fields: [
      { name: "auction_header_id", note: "Sourcing event key" },
      { name: "document_number", note: "Event number shown to suppliers" },
      { name: "close_bidding_date", note: "Deadline suppliers respond by" },
    ],
    layer: "SILVER",
    transform: "The Oracle Sourcing route. A request is raised as a sourcing event and issued to the invited panel.",
    assumption: SOURCING_NOTE,
    verified: "NEEDS_SME_REVIEW",
  },

  "RFQ.SOURCING_BID": {
    key: "RFQ.SOURCING_BID",
    system: "ORACLE_EBS",
    object: "PON_BID_HEADERS",
    fields: [
      { name: "bid_number", note: "Response key" },
      { name: "trading_partner_id", note: "Supplier the response came from" },
      { name: "bid_status", note: "Whether the response is active, withdrawn or superseded" },
    ],
    layer: "SILVER",
    transform: "Supplier responses are read per event so a response and a declined line can be told apart.",
    assumption: SOURCING_NOTE,
    verified: "NEEDS_SME_REVIEW",
  },

  "RFQ.SOURCING_BID_PRICE": {
    key: "RFQ.SOURCING_BID_PRICE",
    system: "ORACLE_EBS",
    object: "PON_BID_ITEM_PRICES",
    fields: [
      { name: "line_number", note: "Line the response covers" },
      { name: "bid_currency_unit_price", note: "Price quoted on the line" },
      { name: "promised_date", note: "Date the supplier offers to deliver by" },
    ],
    layer: "GOLD",
    mart: MARTS.SUPPLIER_PERFORMANCE,
    transform: "Quotations are ranked on delivered feasibility first and price second. A quotation whose promised date falls after the need date is not eligible to win on price alone.",
    assumption: "The date a supplier offers is taken at face value here. In practice it would be weighted by that supplier's delivery record.",
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * ORACLE EBS · WRITE BACK MECHANISMS
   * Both are presented. Neither is committed to.
   * ------------------------------------------------------------------ */

  "WRITEBACK.REQ_INTERFACE": {
    key: "WRITEBACK.REQ_INTERFACE",
    system: "ORACLE_EBS",
    object: "PO_REQUISITIONS_INTERFACE_ALL and PO_REQ_DIST_INTERFACE_ALL",
    granularity: "OBJECT",
    fields: [
      { name: "staged requisition line", note: "The proposed line, written to the interface" },
      { name: "staged distribution", note: "The charge account for that line" },
      { name: "unapproved status", note: "What keeps a person in the loop" },
    ],
    layer: "SILVER",
    transform: "Staged rows are written to the requisition interface and processed by the Requisition Import concurrent program, which creates the document in an unapproved state. No commitment exists until a person approves it in the source system.",
    assumption: WRITEBACK_NOTE,
    verified: "NEEDS_SME_REVIEW",
  },

  "WRITEBACK.PO_INTERFACE": {
    key: "WRITEBACK.PO_INTERFACE",
    system: "ORACLE_EBS",
    object: "PO_HEADERS_INTERFACE and PO_LINES_INTERFACE",
    granularity: "OBJECT",
    fields: [
      { name: "staged order header", note: "The proposed order, written to the interface" },
      { name: "staged order line", note: "The proposed line" },
    ],
    layer: "SILVER",
    transform: "The Purchasing Documents Open Interface, for staged purchase order creation after an award.",
    assumption: WRITEBACK_NOTE,
    verified: "NEEDS_SME_REVIEW",
  },

  "WRITEBACK.SOA_GATEWAY": {
    key: "WRITEBACK.SOA_GATEWAY",
    system: "ORACLE_EBS",
    object: "Oracle E-Business Suite Integrated SOA Gateway",
    granularity: "OBJECT",
    fields: [
      { name: "service invocation", note: "Creates the document through a service call rather than a staged row" },
    ],
    layer: "SILVER",
    transform: "Service based invocation as an alternative to the interface tables. The document it creates is still unapproved and still waits for a person.",
    assumption: WRITEBACK_NOTE,
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * ORACLE EBS · MAINTENANCE
   * Assumed. Object level only. No column is named.
   * ------------------------------------------------------------------ */

  "MRO.ASSET_REGISTER": {
    key: "MRO.ASSET_REGISTER",
    system: "ORACLE_EBS",
    object: "Asset number",
    granularity: "OBJECT",
    fields: [
      { name: "asset identifier", note: "Whatever the maintenance system uses to identify an asset" },
      { name: "asset description", note: "Readable description" },
      { name: "operating location", note: "Plant or line the asset runs in" },
    ],
    layer: "BRONZE",
    transform: "The maintainable asset register is landed as held.",
    assumption: MAINTENANCE_NOTE,
    verified: "NEEDS_SME_REVIEW",
  },

  "MRO.ASSET_CRITICALITY": {
    key: "MRO.ASSET_CRITICALITY",
    system: "ORACLE_EBS",
    object: "Asset number",
    granularity: "OBJECT",
    fields: [
      { name: "criticality", note: "How much it matters when this asset stops" },
      { name: "asset identifier", note: "The asset the value belongs to" },
    ],
    layer: "SILVER",
    transform: "Criticality is mapped onto a single one to four scale used everywhere in the preview, where one is the most critical.",
    assumption: `${MAINTENANCE_NOTE} Whether criticality is recorded at all, and on what scale, is the first thing to confirm.`,
    verified: "NEEDS_SME_REVIEW",
  },

  "MRO.WORK_ORDER": {
    key: "MRO.WORK_ORDER",
    system: "ORACLE_EBS",
    object: "Maintenance work order",
    granularity: "OBJECT",
    fields: [
      { name: "work order identifier", note: "Identifies the job" },
      { name: "asset identifier", note: "The asset the job is raised against" },
      { name: "status", note: "Whether the job is open, released or complete" },
      { name: "scheduled start", note: "When the work is planned to begin" },
    ],
    layer: "SILVER",
    transform: "Work orders are joined to the asset so repeat work on one asset can be counted.",
    assumption: MAINTENANCE_NOTE,
    verified: "NEEDS_SME_REVIEW",
  },

  "MRO.WORK_ORDER_MATERIAL": {
    key: "MRO.WORK_ORDER_MATERIAL",
    system: "ORACLE_EBS",
    object: "Maintenance work order",
    granularity: "OBJECT",
    fields: [
      { name: "part required", note: "The spare the job needs" },
      { name: "quantity required", note: "How many" },
      { name: "date required", note: "When the part has to be on the job" },
    ],
    layer: "GOLD",
    mart: MARTS.REPLENISHMENT_SIGNAL,
    transform: "Material requirements on open work orders become the forward demand signal a proposed requisition is built from.",
    assumption: `${MAINTENANCE_NOTE} The link from a work order to the part it consumes is the single most important thing to confirm, because the procurement signal is built on it.`,
    verified: "NEEDS_SME_REVIEW",
  },

  "MRO.PM_SCHEDULE": {
    key: "MRO.PM_SCHEDULE",
    system: "ORACLE_EBS",
    object: "Preventive maintenance schedule",
    granularity: "OBJECT",
    fields: [
      { name: "asset identifier", note: "The asset the schedule covers" },
      { name: "next due", note: "When the next planned service falls" },
      { name: "interval", note: "How often the work repeats" },
    ],
    layer: "SILVER",
    transform: "The planned service date is one of the two dates the timing condition is measured against.",
    assumption: MAINTENANCE_NOTE,
    verified: "NEEDS_SME_REVIEW",
  },

  "MRO.METER_READING": {
    key: "MRO.METER_READING",
    system: "ORACLE_EBS",
    object: "Meter reading",
    granularity: "OBJECT",
    fields: [
      { name: "meter", note: "The meter recorded against the asset" },
      { name: "reading", note: "Latest value" },
      { name: "reading date", note: "When it was taken" },
    ],
    layer: "SILVER",
    transform: "Readings are turned into a rate of use per asset so the next service interval can be estimated.",
    assumption: `${MAINTENANCE_NOTE} Whether readings are taken often enough for a rate to mean anything also needs checking.`,
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * TEAMCENTER · THROUGH SOA SERVICES ONLY
   * Direct queries against the underlying persistent object model are not
   * supported and appear nowhere in this build.
   * ------------------------------------------------------------------ */

  "PART.TC_ITEM_IDENTITY": {
    key: "PART.TC_ITEM_IDENTITY",
    system: "TEAMCENTER",
    object: "Item",
    service: "Core · DataManagement",
    fields: [
      { name: "item_id", note: "Engineering part number" },
      { name: "object_name", note: "Part name as engineering maintains it" },
    ],
    layer: "BRONZE",
    transform: "Objects are loaded through the data management service and landed as returned.",
    assumption: "Extraction is through the service layer only. No direct database access is contemplated anywhere in this design.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_REVISION": {
    key: "PART.TC_REVISION",
    system: "TEAMCENTER",
    object: "ItemRevision",
    service: "Core · DataManagement",
    fields: [
      { name: "item_revision_id", note: "Revision identifier" },
      { name: "object_desc", note: "Revision level description" },
      { name: "release_status_list", note: "Statuses applied to the revision" },
      { name: "owning_user", note: "Who owns the revision" },
      { name: "last_mod_date", note: "Most recent change to the revision" },
    ],
    layer: "SILVER",
    transform: "Revisions are ordered per item and the latest released revision is selected as the current engineering definition.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_QUERY": {
    key: "PART.TC_QUERY",
    system: "TEAMCENTER",
    object: "Saved query",
    service: "Query · SavedQuery",
    granularity: "OBJECT",
    fields: [{ name: "query criteria", note: "Attributes parts are retrieved by" }],
    layer: "BRONZE",
    transform: "Part retrieval by attribute. This is how the extract is scoped and scheduled.",
    assumption: "The appendix names the service but not the saved queries themselves. Which queries exist, and whether they cover the population we need, has to be confirmed.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_BOM_USAGE": {
    key: "PART.TC_BOM_USAGE",
    system: "TEAMCENTER",
    object: "BOMWindow, BOMLine and occurrence data",
    service: "StructureManagement",
    granularity: "OBJECT",
    fields: [
      { name: "parent assembly", note: "The structure the line sits in" },
      { name: "position", note: "Where in the structure the part appears" },
      { name: "quantity per", note: "How many per parent" },
    ],
    layer: "SILVER",
    transform: "The source of the same assembly evidence on the duplicate score. Structures are expanded so two parts sitting at different positions in one assembly can be recognised.",
    assumption: "The appendix names the objects but not their properties, so none is asserted. Which structure is expanded, working or released, needs deciding.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_CLASSIFICATION": {
    key: "PART.TC_CLASSIFICATION",
    system: "TEAMCENTER",
    object: "Classification class and attribute values",
    service: "Classification",
    granularity: "OBJECT",
    fields: [
      { name: "class", note: "The class a part is filed under" },
      { name: "attribute values", note: "Classified characteristics such as size or material" },
    ],
    layer: "SILVER",
    transform: "Classified characteristics let two parts be compared on shape and material rather than on description text alone.",
    assumption: "Classification coverage is partial. Absence of a class is not evidence that two parts differ.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_CHANGE_NOTICE": {
    key: "PART.TC_CHANGE_NOTICE",
    system: "TEAMCENTER",
    object: "ChangeNoticeRevision and ChangeRequestRevision",
    service: "Change Management",
    granularity: "OBJECT",
    fields: [
      { name: "delivered revisions", note: "Revisions the change delivers" },
      { name: "impacted revisions", note: "Revisions the change affects" },
      { name: "release date", note: "When the change was released" },
    ],
    layer: "SILVER",
    transform: "Context for the revision anomaly evidence type. A revision that changes a part substantially with no change object behind it is the pattern seen when a revision is used to avoid the material creation cycle.",
    assumption: "The appendix names the objects but not their properties, so none is asserted.",
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * GOLD MARTS
   * Three marts. Everything the screens read comes from one of them.
   * ------------------------------------------------------------------ */

  "GOLD.PART_ENTITY": {
    key: "GOLD.PART_ENTITY",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B conformed with Item and ItemRevision",
    fields: [
      { name: "segment1", note: "Part number presented to the business" },
      { name: "inventory_item_id", note: "Commercial key, carried so nothing is lost" },
      { name: "item_id", note: "Engineering key, carried alongside it" },
    ],
    layer: "GOLD",
    mart: MARTS.PART_ENTITY,
    transform: "Resolved part entity with source lineage. One row per physical part, carrying every plant it is held in, its engineering revision, its duplicate cluster and its spend.",
    assumption: "Part numbers agree between the two systems for most parts. Where they do not the record is kept unmatched rather than forced.",
    verified: "NEEDS_SME_REVIEW",
  },

  "GOLD.SUPPLIER_PERFORMANCE": {
    key: "GOLD.SUPPLIER_PERFORMANCE",
    system: "ORACLE_EBS",
    object: "AP_SUPPLIERS conformed with PO_LINES_ALL and receiving",
    fields: [
      { name: "vendor_id", note: "Grain of the mart" },
      { name: "unit_price", note: "Price history carried onto the mart" },
    ],
    layer: "GOLD",
    mart: MARTS.SUPPLIER_PERFORMANCE,
    transform: "Supplier on time delivery, quality rate and price history on one row per supplier.",
    verified: "NEEDS_SME_REVIEW",
  },

  "GOLD.REPLENISHMENT_SIGNAL": {
    key: "GOLD.REPLENISHMENT_SIGNAL",
    system: "ORACLE_EBS",
    object: "Asset number conformed with MTL_SYSTEM_ITEMS_B and MTL_ONHAND_QUANTITIES_DETAIL",
    granularity: "OBJECT",
    fields: [
      { name: "asset", note: "The asset the signal belongs to" },
      { name: "spare part", note: "The part it will need" },
      { name: "stock position", note: "On hand against the reorder point" },
      { name: "timing", note: "Need date against the supplier lead time" },
    ],
    layer: "GOLD",
    mart: MARTS.REPLENISHMENT_SIGNAL,
    transform: "Asset, spare part, stock position and timing on one row. A signal fires on either the stock condition or the timing condition, and the mart carries which one.",
    assumption: `${MAINTENANCE_NOTE} The weighting behind the condition estimate is illustrative and would be set with the manufacturer's reliability engineers.`,
    verified: "NEEDS_SME_REVIEW",
  },

  "DUP.CLUSTER_MEMBERSHIP": {
    key: "DUP.CLUSTER_MEMBERSHIP",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B",
    fields: [
      { name: "segment1", note: "Part numbers grouped into a candidate cluster" },
      { name: "inventory_item_id", note: "Cluster member keys" },
      { name: "organization_id", note: "Plant each member sits in" },
    ],
    layer: "GOLD",
    mart: MARTS.PART_ENTITY,
    transform: "Candidate members are grouped into a cluster when description, classified characteristics and supplier references agree closely enough to suggest one physical part. The score is a sum of evidence contributions, some of which subtract.",
    assumption: "A cluster is a candidate for review, not a decision. Nothing is merged automatically.",
    verified: "NEEDS_SME_REVIEW",
  },

  "DUP.SPEND_EXPOSURE": {
    key: "DUP.SPEND_EXPOSURE",
    system: "ORACLE_EBS",
    object: "PO_LINES_ALL",
    fields: [
      { name: "unit_price", note: "Price paid on each member of the cluster" },
      { name: "quantity", note: "Quantity bought against each member" },
      { name: "item_id", note: "Links the line back to the cluster member" },
    ],
    layer: "GOLD",
    mart: MARTS.PART_ENTITY,
    transform: "Spend on every member of a cluster is added together and the price spread between members is shown as the exposure created by the duplication.",
    assumption: "Price differences between members are treated as avoidable only where the members are genuinely the same part. Every figure is illustrative.",
    verified: "NEEDS_SME_REVIEW",
  },

  "SUP.OTD_PERFORMANCE": {
    key: "SUP.OTD_PERFORMANCE",
    system: "ORACLE_EBS",
    object: "RCV_SHIPMENT_LINES joined to RCV_TRANSACTIONS",
    granularity: "OBJECT",
    fields: [
      { name: "receipt date", note: "When the material arrived" },
      { name: "promised date", note: "What the supplier committed to" },
      { name: "supplier", note: "Who is being measured" },
    ],
    layer: "GOLD",
    mart: MARTS.SUPPLIER_PERFORMANCE,
    transform: "On time delivery is the share of receipts landing on or before the committed date, measured over a rolling twelve months per supplier.",
    assumption: "Receipts with no committed date are excluded rather than counted as late.",
    verified: "NEEDS_SME_REVIEW",
  },

  "SUP.PRICE_VARIANCE": {
    key: "SUP.PRICE_VARIANCE",
    system: "ORACLE_EBS",
    object: "PO_LINES_ALL",
    fields: [
      { name: "unit_price", note: "Price paid on each line" },
      { name: "item_id", note: "Part the price applies to" },
      { name: "vendor_id", note: "Supplier the price was paid to" },
    ],
    layer: "GOLD",
    mart: MARTS.SUPPLIER_PERFORMANCE,
    transform: "For each part the spread between the lowest and highest price paid in the period is calculated and expressed as the gap between plants and suppliers.",
    verified: "NEEDS_SME_REVIEW",
  },

  "FABRIC.BRONZE_ORACLE": {
    key: "FABRIC.BRONZE_ORACLE",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B",
    fields: [
      { name: "inventory_item_id", note: "Key carried through every layer unchanged" },
      { name: "organization_id", note: "Carried with it" },
    ],
    layer: "BRONZE",
    transform: "Tables are copied on a schedule with no reshaping, so the landed copy can always be compared back to the source.",
    assumption: "Change capture strategy is not settled. Timestamp based capture is assumed here and needs confirming.",
    verified: "NEEDS_SME_REVIEW",
  },

  "FABRIC.BRONZE_TEAMCENTER": {
    key: "FABRIC.BRONZE_TEAMCENTER",
    system: "TEAMCENTER",
    object: "Item",
    service: "Query · SavedQuery",
    fields: [
      { name: "item_id", note: "Key carried through every layer unchanged" },
      { name: "last_mod_date", note: "Used to pick up changed objects on each load" },
    ],
    layer: "BRONZE",
    transform: "Objects are extracted through saved queries and landed as returned, with no reshaping and no direct database access.",
    verified: "NEEDS_SME_REVIEW",
  },

  "FABRIC.SILVER_PART_CONFORMED": {
    key: "FABRIC.SILVER_PART_CONFORMED",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B matched to Item",
    fields: [
      { name: "segment1", note: "Matched against the engineering part number" },
      { name: "inventory_item_id", note: "Held alongside the engineering key" },
    ],
    layer: "SILVER",
    transform: "The Oracle item and the Teamcenter item are matched into one conformed part record that keeps both original keys so nothing is lost.",
    assumption: "Where the two do not agree the record is kept unmatched rather than forced.",
    verified: "NEEDS_SME_REVIEW",
  },
} as const satisfies Record<string, SourceRef>

export type SourceKey = keyof typeof REGISTRY

export const NOMENCLATURE: Record<SourceKey, SourceRef> = REGISTRY

/** Resolve a registry entry. Screens must never inline a source name. */
export function getSource(key: SourceKey): SourceRef {
  return REGISTRY[key]
}

export const SOURCE_KEYS = Object.keys(REGISTRY) as SourceKey[]

/** Display labels. The only readable names for the two source systems. */
export const SYSTEM_LABEL: Record<SourceRef["system"], string> = {
  ORACLE_EBS: "Oracle EBS",
  TEAMCENTER: "Teamcenter",
}

/** Short marks for the compact tag shown on dense screens. */
export const SYSTEM_SHORT: Record<SourceRef["system"], string> = {
  ORACLE_EBS: "EBS",
  TEAMCENTER: "TC",
}

export const LAYER_LABEL: Record<SourceRef["layer"], string> = {
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
}

/** Shown when an entry is registered at object level rather than field level. */
export const OBJECT_LEVEL_NOTE =
  "Registered at object level. The object is named; the entries below describe what is needed, not what the source calls it."

export const VERIFIED_LABEL: Record<SourceRef["verified"], string> = {
  VERIFIED: "Verified",
  NEEDS_SME_REVIEW: "Needs SME review",
}
