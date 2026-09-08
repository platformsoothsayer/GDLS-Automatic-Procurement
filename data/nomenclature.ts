/**
 * SINGLE SOURCE OF NOMENCLATURE
 * =============================
 * This is the ONLY file in the codebase permitted to contain an Oracle EBS table
 * name, an Oracle EBS column name, a Teamcenter business object name, a Teamcenter
 * SOA service name or a Teamcenter property name.
 *
 * Every screen imports from this registry by key. Nothing is hard coded anywhere else.
 * This exists so a subject matter expert can review one file instead of the whole
 * codebase. Treat it as a hard architectural rule.
 *
 * ALL entries are marked NEEDS_SME_REVIEW. The verification chip renders from that
 * field and appears in Data view only, never in Business view.
 *
 * All data in this preview is illustrative. Nothing here is connected to a
 * production system belonging to the manufacturer.
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
   * OBJECT the object is named but its field names are NOT asserted, because the
   *        source system itself is still an assumption. The overlay says so.
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

const REGISTRY = {
  /* ------------------------------------------------------------------ *
   * PART MASTER — ORACLE EBS
   * ------------------------------------------------------------------ */

  "PART.ORACLE_IDENTITY": {
    key: "PART.ORACLE_IDENTITY",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B",
    fields: [
      { name: "INVENTORY_ITEM_ID", note: "Internal surrogate key for the item" },
      { name: "ORGANIZATION_ID", note: "Inventory organization the item row belongs to" },
      { name: "SEGMENT1", note: "Displayed part number" },
      { name: "ITEM_TYPE", note: "Purchased, manufactured or phantom classification" },
      { name: "CREATION_DATE", note: "Row creation timestamp, used to order duplicates" },
    ],
    layer: "BRONZE",
    transform: "Landed row for row from the item master with no reshaping.",
    assumption: "Part numbers are carried in SEGMENT1 rather than a concatenated segment structure.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_DESCRIPTION": {
    key: "PART.ORACLE_DESCRIPTION",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_TL",
    fields: [
      { name: "DESCRIPTION", note: "Short description shown to buyers and planners" },
      { name: "LONG_DESCRIPTION", note: "Extended description where maintained" },
      { name: "LANGUAGE", note: "Translation row filter" },
    ],
    layer: "SILVER",
    transform: "Descriptions are filtered to the base language, trimmed, case folded and stripped of punctuation so near identical text can be compared.",
    assumption: "Only the base language row is in scope for this preview.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_ORG_ASSIGNMENT": {
    key: "PART.ORACLE_ORG_ASSIGNMENT",
    system: "ORACLE_EBS",
    object: "MTL_PARAMETERS",
    fields: [
      { name: "ORGANIZATION_ID", note: "Inventory organization key" },
      { name: "ORGANIZATION_CODE", note: "Short code shown in the interface" },
      { name: "MASTER_ORGANIZATION_ID", note: "Controlling master organization" },
    ],
    layer: "SILVER",
    transform: "Organization rows are joined to each item so the same part can be seen in every plant that carries it.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_COMMODITY": {
    key: "PART.ORACLE_COMMODITY",
    system: "ORACLE_EBS",
    object: "MTL_ITEM_CATEGORIES",
    fields: [
      { name: "CATEGORY_ID", note: "Assigned category key" },
      { name: "CATEGORY_SET_ID", note: "Identifies the purchasing category set" },
      { name: "SEGMENT1", note: "Commodity group value on the category" },
    ],
    layer: "SILVER",
    transform: "The purchasing category set assignment is resolved to a single commodity group label per part.",
    assumption: "One purchasing category set is authoritative for commodity reporting.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_UOM": {
    key: "PART.ORACLE_UOM",
    system: "ORACLE_EBS",
    object: "MTL_UNITS_OF_MEASURE_TL",
    fields: [
      { name: "UOM_CODE", note: "Unit of measure code held on the item" },
      { name: "UNIT_OF_MEASURE", note: "Readable unit name" },
    ],
    layer: "SILVER",
    transform: "Unit codes are resolved to names and normalised so quantities from different plants can be added together.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_PLANNING": {
    key: "PART.ORACLE_PLANNING",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B",
    fields: [
      { name: "PLANNING_MAKE_BUY_CODE", note: "Whether the part is made or bought" },
      { name: "FULL_LEAD_TIME", note: "Total lead time in days" },
      { name: "MIN_MINMAX_QUANTITY", note: "Reorder point where min max planning is used" },
      { name: "MAX_MINMAX_QUANTITY", note: "Reorder up to level" },
      { name: "FIXED_LOT_MULTIPLIER", note: "Order multiple applied by planning" },
    ],
    layer: "SILVER",
    transform: "Planning attributes are read per organization and compared across plants to expose parts planned inconsistently.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_LIFECYCLE_STATUS": {
    key: "PART.ORACLE_LIFECYCLE_STATUS",
    system: "ORACLE_EBS",
    object: "MTL_ITEM_STATUS",
    fields: [
      { name: "INVENTORY_ITEM_STATUS_CODE", note: "Active, obsolete or engineering status" },
      { name: "DISABLE_DATE", note: "Date the status was retired" },
    ],
    layer: "SILVER",
    transform: "Status codes are mapped to a common active, restricted or obsolete vocabulary shared with the engineering side.",
    assumption: "Locally defined status codes map cleanly onto three states.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_ONHAND": {
    key: "PART.ORACLE_ONHAND",
    system: "ORACLE_EBS",
    object: "MTL_ONHAND_QUANTITIES_DETAIL",
    fields: [
      { name: "INVENTORY_ITEM_ID", note: "Item the balance belongs to" },
      { name: "ORGANIZATION_ID", note: "Plant holding the stock" },
      { name: "TRANSACTION_QUANTITY", note: "Quantity on hand in the primary unit" },
      { name: "SUBINVENTORY_CODE", note: "Storage location within the plant" },
    ],
    layer: "SILVER",
    transform: "Detail balances are summed to one on hand figure per part per plant.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_SUPPLIER_CROSSREF": {
    key: "PART.ORACLE_SUPPLIER_CROSSREF",
    system: "ORACLE_EBS",
    object: "MTL_CROSS_REFERENCES",
    fields: [
      { name: "CROSS_REFERENCE", note: "Supplier part number carried against the item" },
      { name: "CROSS_REFERENCE_TYPE", note: "Identifies the row as a supplier reference" },
      { name: "INVENTORY_ITEM_ID", note: "Item the reference points at" },
    ],
    layer: "SILVER",
    transform: "Supplier references are matched across items so one physical part bought under two supplier numbers can be recognised.",
    assumption: "Supplier cross references are maintained rather than held only on the purchase order.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.ORACLE_MATERIAL_TXN": {
    key: "PART.ORACLE_MATERIAL_TXN",
    system: "ORACLE_EBS",
    object: "MTL_MATERIAL_TRANSACTIONS",
    fields: [
      { name: "TRANSACTION_TYPE_ID", note: "Issue, receipt or transfer classification" },
      { name: "TRANSACTION_DATE", note: "When the movement happened" },
      { name: "PRIMARY_QUANTITY", note: "Signed quantity moved" },
    ],
    layer: "SILVER",
    transform: "Movements are aggregated by month to give each part a consumption profile.",
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * PART MASTER — TEAMCENTER
   * ------------------------------------------------------------------ */

  "PART.TC_ITEM_IDENTITY": {
    key: "PART.TC_ITEM_IDENTITY",
    system: "TEAMCENTER",
    object: "Item",
    service: "Core-2011-06-DataManagement",
    fields: [
      { name: "item_id", note: "Engineering part number" },
      { name: "object_name", note: "Part name as engineering maintains it" },
      { name: "object_type", note: "Item subtype, for example a design or standard part" },
      { name: "creation_date", note: "When engineering first created the part" },
    ],
    layer: "BRONZE",
    transform: "Objects are loaded through the data management service and landed as returned.",
    assumption: "A single item type hierarchy is in use for production parts.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_REVISION": {
    key: "PART.TC_REVISION",
    system: "TEAMCENTER",
    object: "ItemRevision",
    service: "Core-2011-06-DataManagement",
    fields: [
      { name: "item_revision_id", note: "Revision identifier such as A or B" },
      { name: "object_desc", note: "Revision level description" },
      { name: "last_mod_date", note: "Most recent change to the revision" },
      { name: "items_tag", note: "Reference back to the owning item" },
    ],
    layer: "SILVER",
    transform: "Revisions are ordered per item and the latest released revision is selected as the current engineering definition.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_MASTER_FORM": {
    key: "PART.TC_MASTER_FORM",
    system: "TEAMCENTER",
    object: "ItemMasterForm",
    service: "Core-2011-06-DataManagement",
    fields: [
      { name: "IMAN_master_form", note: "Relation from the item to its master form" },
      { name: "unit_of_measure", note: "Engineering unit of measure" },
      { name: "make_buy", note: "Engineering view of make or buy" },
    ],
    layer: "SILVER",
    transform: "Master form attributes are flattened onto the part so the engineering view can be compared with the Oracle planning view.",
    assumption: "Attributes of interest sit on the standard master form rather than a site specific extension.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_RELEASE_STATUS": {
    key: "PART.TC_RELEASE_STATUS",
    system: "TEAMCENTER",
    object: "ReleaseStatus",
    service: "Core-2011-06-DataManagement",
    fields: [
      { name: "release_status_list", note: "Statuses applied to the revision" },
      { name: "date_released", note: "When the revision was released" },
    ],
    layer: "SILVER",
    transform: "Release statuses are reduced to one released or not released flag with the release date.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_CLASSIFICATION": {
    key: "PART.TC_CLASSIFICATION",
    system: "TEAMCENTER",
    object: "ICO",
    service: "Classification-2017-05-Classification",
    fields: [
      { name: "class_id", note: "Classification class the part is filed under" },
      { name: "ico_id", note: "Classification object instance for the part" },
      { name: "attribute_values", note: "Classified characteristics such as size or material" },
    ],
    layer: "SILVER",
    transform: "Classified characteristics are read so two parts can be compared on shape and material rather than on description text alone.",
    assumption: "Classification coverage is partial and absence of a class is not evidence that parts differ.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_BOM_USAGE": {
    key: "PART.TC_BOM_USAGE",
    system: "TEAMCENTER",
    object: "BOMLine",
    service: "Cad-2007-01-StructureManagement",
    fields: [
      { name: "bl_line_object", note: "The revision occupying the line" },
      { name: "bl_quantity", note: "Quantity per parent assembly" },
      { name: "bl_indented_title", note: "Position of the line in the structure" },
    ],
    layer: "SILVER",
    transform: "Structures are expanded so each part carries the count of assemblies that use it.",
    assumption: "The latest working structure is expanded rather than a released configuration.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_CHANGE_NOTICE": {
    key: "PART.TC_CHANGE_NOTICE",
    system: "TEAMCENTER",
    object: "ChangeNoticeRevision",
    service: "ChangeManagement-2012-09-ChangeManagement",
    fields: [
      { name: "CMHasSolutionItem", note: "Revisions the change notice delivers" },
      { name: "CMHasImpactedItem", note: "Revisions the change notice affects" },
      { name: "date_released", note: "When the change was released" },
    ],
    layer: "SILVER",
    transform: "Change notices are linked to the revisions they deliver so a new revision can be tested for whether a change actually justified it.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PART.TC_DATASET": {
    key: "PART.TC_DATASET",
    system: "TEAMCENTER",
    object: "Dataset",
    service: "Core-2011-06-DataManagement",
    fields: [
      { name: "object_name", note: "Name of the attached model or drawing" },
      { name: "ref_list", note: "Named references holding the files" },
      { name: "last_mod_date", note: "When the attachment last changed" },
    ],
    layer: "BRONZE",
    transform: "Attachment metadata only is landed. No file content is read in this preview.",
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * DUPLICATE RESOLUTION
   * ------------------------------------------------------------------ */

  "DUP.CLUSTER_MEMBERSHIP": {
    key: "DUP.CLUSTER_MEMBERSHIP",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B",
    fields: [
      { name: "SEGMENT1", note: "Part numbers grouped into a candidate cluster" },
      { name: "INVENTORY_ITEM_ID", note: "Cluster member keys" },
      { name: "ORGANIZATION_ID", note: "Plant each member sits in" },
    ],
    layer: "GOLD",
    mart: "duplicate_resolution_mart",
    transform: "Candidate members are grouped into a cluster when description, classified characteristics and supplier references agree closely enough to suggest one physical part.",
    assumption: "A cluster is a candidate for review, not a decision. Nothing is merged automatically.",
    verified: "NEEDS_SME_REVIEW",
  },

  "DUP.CAUSE_COPY_PASTE": {
    key: "DUP.CAUSE_COPY_PASTE",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_TL",
    fields: [
      { name: "DESCRIPTION", note: "Near identical description text between members" },
      { name: "CREATION_DATE", note: "Close creation dates typical of a copied record" },
    ],
    layer: "GOLD",
    mart: "duplicate_resolution_mart",
    transform: "A cluster is attributed to copying when descriptions differ only by spacing, abbreviation or word order and no engineering change links the members.",
    verified: "NEEDS_SME_REVIEW",
  },

  "DUP.CAUSE_REVISION_ABUSE": {
    key: "DUP.CAUSE_REVISION_ABUSE",
    system: "TEAMCENTER",
    object: "ItemRevision",
    service: "Core-2011-06-DataManagement",
    fields: [
      { name: "item_revision_id", note: "Revision created instead of a new part" },
      { name: "object_desc", note: "Description change large enough to indicate a different part" },
      { name: "CMHasSolutionItem", note: "Absence of a change notice delivering the revision" },
    ],
    layer: "GOLD",
    mart: "duplicate_resolution_mart",
    transform: "A cluster is attributed to revision abuse when a revision changes the part substantially yet no change notice delivered it, which is the pattern seen when a new revision is used to avoid the material creation cycle.",
    assumption: "The material creation cycle is long enough that engineers have a standing incentive to avoid it. This needs confirming with the manufacturer.",
    verified: "NEEDS_SME_REVIEW",
  },

  "DUP.CAUSE_SUPPLIER_PART": {
    key: "DUP.CAUSE_SUPPLIER_PART",
    system: "ORACLE_EBS",
    object: "MTL_CROSS_REFERENCES",
    fields: [
      { name: "CROSS_REFERENCE", note: "Two internal parts carrying the same supplier number" },
      { name: "CROSS_REFERENCE_TYPE", note: "Supplier reference type filter" },
    ],
    layer: "GOLD",
    mart: "duplicate_resolution_mart",
    transform: "A cluster is attributed to supplier numbering when separate internal parts resolve to the same supplier part number at the same supplier.",
    verified: "NEEDS_SME_REVIEW",
  },

  "DUP.CAUSE_ORG_SPLIT": {
    key: "DUP.CAUSE_ORG_SPLIT",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B",
    fields: [
      { name: "ORGANIZATION_ID", note: "Members registered in different plants" },
      { name: "SEGMENT1", note: "Different part numbers for the same physical part" },
    ],
    layer: "GOLD",
    mart: "duplicate_resolution_mart",
    transform: "A cluster is attributed to organization split when members are near identical but were created separately in different plants rather than shared from the master organization.",
    verified: "NEEDS_SME_REVIEW",
  },

  "DUP.DESCRIPTION_SIMILARITY": {
    key: "DUP.DESCRIPTION_SIMILARITY",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_TL",
    fields: [
      { name: "DESCRIPTION", note: "Text compared between two candidate members" },
      { name: "LONG_DESCRIPTION", note: "Used where the short description is truncated" },
    ],
    layer: "GOLD",
    mart: "duplicate_resolution_mart",
    transform: "Descriptions are normalised and scored for similarity, and the score is shown so a reviewer can see how strong the match is rather than being given a yes or no.",
    verified: "NEEDS_SME_REVIEW",
  },

  "DUP.SPEND_EXPOSURE": {
    key: "DUP.SPEND_EXPOSURE",
    system: "ORACLE_EBS",
    object: "PO_LINES_ALL",
    fields: [
      { name: "UNIT_PRICE", note: "Price paid on each member of the cluster" },
      { name: "QUANTITY", note: "Quantity bought against each member" },
      { name: "ITEM_ID", note: "Links the line back to the cluster member" },
    ],
    layer: "GOLD",
    mart: "duplicate_resolution_mart",
    transform: "Spend on every member of a cluster is added together and the price spread between members is shown as the exposure created by the duplication.",
    assumption: "Price differences between cluster members are treated as avoidable only where the members are genuinely the same part.",
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * SUPPLIER AND PROCUREMENT
   * ------------------------------------------------------------------ */

  "SUP.MASTER": {
    key: "SUP.MASTER",
    system: "ORACLE_EBS",
    object: "AP_SUPPLIERS",
    fields: [
      { name: "VENDOR_ID", note: "Supplier key" },
      { name: "VENDOR_NAME", note: "Supplier name" },
      { name: "SEGMENT1", note: "Supplier number shown to buyers" },
      { name: "ENABLED_FLAG", note: "Whether the supplier is active" },
    ],
    layer: "BRONZE",
    transform: "Supplier records are landed as held, including inactive suppliers so history stays readable.",
    verified: "NEEDS_SME_REVIEW",
  },

  "SUP.SITE": {
    key: "SUP.SITE",
    system: "ORACLE_EBS",
    object: "AP_SUPPLIER_SITES_ALL",
    fields: [
      { name: "VENDOR_SITE_ID", note: "Supplier site key" },
      { name: "VENDOR_SITE_CODE", note: "Site code used on the purchase order" },
      { name: "PURCHASING_SITE_FLAG", note: "Whether the site can be bought from" },
    ],
    layer: "SILVER",
    transform: "Sites are rolled up to the parent supplier so performance is measured on the company rather than on each shipping location.",
    verified: "NEEDS_SME_REVIEW",
  },

  "SUP.APPROVED_LIST": {
    key: "SUP.APPROVED_LIST",
    system: "ORACLE_EBS",
    object: "PO_APPROVED_SUPPLIER_LIST",
    fields: [
      { name: "ITEM_ID", note: "Part the approval applies to" },
      { name: "VENDOR_ID", note: "Approved supplier" },
      { name: "ASL_STATUS_ID", note: "Approval status of the pairing" },
      { name: "PROCESSING_LEAD_TIME", note: "Quoted lead time from the approved supplier" },
    ],
    layer: "SILVER",
    transform: "Approved pairings of part and supplier are read so an automated requisition can only ever propose a supplier that is already approved for that part.",
    assumption: "The approved supplier list is maintained well enough to be the guard rail for automation. This is the assumption most worth testing early.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PO.HEADER": {
    key: "PO.HEADER",
    system: "ORACLE_EBS",
    object: "PO_HEADERS_ALL",
    fields: [
      { name: "PO_HEADER_ID", note: "Purchase order key" },
      { name: "SEGMENT1", note: "Purchase order number" },
      { name: "VENDOR_ID", note: "Supplier the order was placed with" },
      { name: "AUTHORIZATION_STATUS", note: "Approval state of the order" },
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
      { name: "PO_LINE_ID", note: "Order line key" },
      { name: "ITEM_ID", note: "Part being bought" },
      { name: "UNIT_PRICE", note: "Price agreed on the line" },
      { name: "QUANTITY", note: "Quantity ordered" },
      { name: "CREATION_DATE", note: "When the line was raised" },
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
      { name: "PROMISED_DATE", note: "Date the supplier committed to" },
      { name: "NEED_BY_DATE", note: "Date the plant required the material" },
      { name: "QUANTITY_RECEIVED", note: "Quantity received against the shipment" },
    ],
    layer: "SILVER",
    transform: "Committed and required dates are held against each shipment so lateness can be measured against a promise rather than against a wish.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PO.DISTRIBUTION": {
    key: "PO.DISTRIBUTION",
    system: "ORACLE_EBS",
    object: "PO_DISTRIBUTIONS_ALL",
    fields: [
      { name: "CODE_COMBINATION_ID", note: "Account the spend is charged to" },
      { name: "DESTINATION_ORGANIZATION_ID", note: "Plant receiving the material" },
    ],
    layer: "SILVER",
    transform: "Distributions attach each order line to the receiving plant and the charge account.",
    verified: "NEEDS_SME_REVIEW",
  },

  "REQ.HEADER": {
    key: "REQ.HEADER",
    system: "ORACLE_EBS",
    object: "PO_REQUISITION_HEADERS_ALL",
    fields: [
      { name: "REQUISITION_HEADER_ID", note: "Requisition key" },
      { name: "SEGMENT1", note: "Requisition number" },
      { name: "AUTHORIZATION_STATUS", note: "Where the requisition sits in approval" },
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
      { name: "REQUISITION_LINE_ID", note: "Requisition line key" },
      { name: "ITEM_ID", note: "Part requested" },
      { name: "QUANTITY", note: "Quantity requested" },
      { name: "NEED_BY_DATE", note: "Date the material is required" },
      { name: "SUGGESTED_VENDOR_ID", note: "Supplier proposed on the line" },
    ],
    layer: "GOLD",
    mart: "procurement_automation_mart",
    transform: "A proposed requisition line is assembled from the demand signal, the approved supplier for the part and the current agreed price, and is held for a buyer to release.",
    assumption: "Nothing is released to a supplier without a person approving it. Automation stops at the proposal.",
    verified: "NEEDS_SME_REVIEW",
  },

  "RCV.TRANSACTION": {
    key: "RCV.TRANSACTION",
    system: "ORACLE_EBS",
    object: "RCV_TRANSACTIONS",
    fields: [
      { name: "TRANSACTION_DATE", note: "When the material was received" },
      { name: "QUANTITY", note: "Quantity received" },
      { name: "PO_LINE_ID", note: "Order line the receipt satisfies" },
    ],
    layer: "SILVER",
    transform: "Receipts are matched to the promised date on the shipment to produce an on time measure per supplier.",
    verified: "NEEDS_SME_REVIEW",
  },

  "AP.INVOICE_MATCH": {
    key: "AP.INVOICE_MATCH",
    system: "ORACLE_EBS",
    object: "AP_INVOICE_LINES_ALL",
    fields: [
      { name: "INVOICE_ID", note: "Invoice key" },
      { name: "PO_LINE_ID", note: "Order line the invoice was matched to" },
      { name: "UNIT_PRICE", note: "Price actually invoiced" },
    ],
    layer: "SILVER",
    transform: "Invoiced price is compared with ordered price so the difference between what was agreed and what was paid is visible.",
    verified: "NEEDS_SME_REVIEW",
  },

  "SUP.OTD_PERFORMANCE": {
    key: "SUP.OTD_PERFORMANCE",
    system: "ORACLE_EBS",
    object: "RCV_TRANSACTIONS",
    fields: [
      { name: "TRANSACTION_DATE", note: "Receipt date" },
      { name: "PROMISED_DATE", note: "Committed date from the shipment" },
      { name: "VENDOR_ID", note: "Supplier being measured" },
    ],
    layer: "GOLD",
    mart: "supplier_performance_mart",
    transform: "On time delivery is the share of receipts landing on or before the committed date, measured over a rolling twelve months per supplier.",
    assumption: "Receipts without a committed date are excluded rather than counted as late.",
    verified: "NEEDS_SME_REVIEW",
  },

  "SUP.PRICE_VARIANCE": {
    key: "SUP.PRICE_VARIANCE",
    system: "ORACLE_EBS",
    object: "PO_LINES_ALL",
    fields: [
      { name: "UNIT_PRICE", note: "Price paid on each line" },
      { name: "ITEM_ID", note: "Part the price applies to" },
      { name: "VENDOR_ID", note: "Supplier the price was paid to" },
    ],
    layer: "GOLD",
    mart: "supplier_performance_mart",
    transform: "For each part the spread between the lowest and highest price paid in the period is calculated and expressed as the gap between plants and suppliers.",
    verified: "NEEDS_SME_REVIEW",
  },

  "PRICE.COMMODITY_INDEX": {
    key: "PRICE.COMMODITY_INDEX",
    system: "ORACLE_EBS",
    object: "PO_LINES_ALL",
    fields: [
      { name: "UNIT_PRICE", note: "Price paid, weighted by quantity" },
      { name: "QUANTITY", note: "Weighting for the index" },
      { name: "CREATION_DATE", note: "Month the price applies to" },
    ],
    layer: "GOLD",
    mart: "commodity_price_mart",
    transform: "Prices are weighted by quantity and averaged by month for each commodity group to give a twenty four month movement per group.",
    assumption: "One off and expedited buys are left in the index and are not treated separately.",
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * MRO AND ASSETS
   * ------------------------------------------------------------------ */

  "MRO.ASSET_REGISTER": {
    key: "MRO.ASSET_REGISTER",
    system: "ORACLE_EBS",
    object: "Asset register",
    granularity: "OBJECT",
    fields: [
      { name: "asset identifier", note: "Whatever the maintenance system uses to identify an asset" },
      { name: "asset description", note: "Readable description of the asset" },
      { name: "operating location", note: "Plant or line the asset runs in" },
      { name: "asset group", note: "Family the asset belongs to" },
    ],
    layer: "BRONZE",
    transform: "The maintainable asset register is landed as held, without reshaping.",
    assumption: "The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted.",
    verified: "NEEDS_SME_REVIEW",
  },

  "MRO.ASSET_CRITICALITY": {
    key: "MRO.ASSET_CRITICALITY",
    system: "ORACLE_EBS",
    object: "Asset attributes",
    granularity: "OBJECT",
    fields: [
      { name: "criticality", note: "How much it matters when this asset stops" },
      { name: "asset identifier", note: "The asset the attribute belongs to" },
    ],
    layer: "SILVER",
    transform: "Criticality is read from the asset attributes and mapped onto a single one to four scale used everywhere in the preview, where one is the most critical.",
    assumption: "The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted. Whether criticality is recorded as an attribute at all, and on what scale, is the first thing to confirm.",
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
    assumption: "The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted.",
    verified: "NEEDS_SME_REVIEW",
  },

  "MRO.WORK_ORDER_MATERIAL": {
    key: "MRO.WORK_ORDER_MATERIAL",
    system: "ORACLE_EBS",
    object: "Work order material requirement",
    granularity: "OBJECT",
    fields: [
      { name: "part required", note: "The spare the job needs" },
      { name: "quantity required", note: "How many" },
      { name: "date required", note: "When the part has to be on the job" },
    ],
    layer: "GOLD",
    mart: "mro_reliability_mart",
    transform: "Material requirements on open work orders become the forward demand signal a proposed requisition is built from.",
    assumption: "The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted. The link from a work order to the part it consumes is the single most important thing to confirm, because the procurement signal is built on it.",
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
    assumption: "The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted. Whether readings are taken often enough for a rate to mean anything also needs checking.",
    verified: "NEEDS_SME_REVIEW",
  },

  "MRO.FAILURE_HISTORY": {
    key: "MRO.FAILURE_HISTORY",
    system: "ORACLE_EBS",
    object: "Failure record",
    granularity: "OBJECT",
    fields: [
      { name: "failure classification", note: "How the failure was coded" },
      { name: "asset identifier", note: "The asset that failed" },
      { name: "failure date", note: "When it was recorded" },
    ],
    layer: "SILVER",
    transform: "Failures are counted per asset and per classification over the period to show which assets fail repeatedly for the same reason.",
    assumption: "The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted. Coding discipline varies between crews, so coverage should be measured before this drives anything.",
    verified: "NEEDS_SME_REVIEW",
  },

  "MRO.CONDITION_SIGNAL": {
    key: "MRO.CONDITION_SIGNAL",
    system: "ORACLE_EBS",
    object: "Asset condition",
    granularity: "OBJECT",
    fields: [
      { name: "condition observation", note: "What the asset is reporting about itself" },
      { name: "asset identifier", note: "The asset the observation belongs to" },
    ],
    layer: "GOLD",
    mart: "mro_reliability_mart",
    transform: "Condition, meter rate, failure history and criticality are combined into one signal per asset, and the signal fires on either a stock condition or a timing condition.",
    assumption: "The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted. The weighting between the inputs is illustrative and would be set with the manufacturer's reliability engineers.",
    verified: "NEEDS_SME_REVIEW",
  },

  /* ------------------------------------------------------------------ *
   * FABRIC STRUCTURE
   * ------------------------------------------------------------------ */

  "FABRIC.BRONZE_ORACLE": {
    key: "FABRIC.BRONZE_ORACLE",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B",
    fields: [
      { name: "LAST_UPDATE_DATE", note: "Used to pick up changed rows on each load" },
      { name: "INVENTORY_ITEM_ID", note: "Key carried through every layer unchanged" },
    ],
    layer: "BRONZE",
    transform: "Tables are copied on a schedule with no reshaping, so the landed copy can always be compared back to the source.",
    assumption: "Change capture is by last update date rather than by database log reading.",
    verified: "NEEDS_SME_REVIEW",
  },

  "FABRIC.BRONZE_TEAMCENTER": {
    key: "FABRIC.BRONZE_TEAMCENTER",
    system: "TEAMCENTER",
    object: "Item",
    service: "Query-2014-11-SavedQuery",
    fields: [
      { name: "item_id", note: "Key carried through every layer unchanged" },
      { name: "last_mod_date", note: "Used to pick up changed objects on each load" },
    ],
    layer: "BRONZE",
    transform: "Objects are extracted through saved queries and landed as returned, with no reshaping.",
    assumption: "Extraction is through the service layer rather than direct database access.",
    verified: "NEEDS_SME_REVIEW",
  },

  "FABRIC.SILVER_PART_CONFORMED": {
    key: "FABRIC.SILVER_PART_CONFORMED",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B",
    fields: [
      { name: "SEGMENT1", note: "Matched against the engineering part number" },
      { name: "INVENTORY_ITEM_ID", note: "Held alongside the engineering key" },
    ],
    layer: "SILVER",
    transform: "The Oracle item and the Teamcenter item are matched into one conformed part record that keeps both original keys so nothing is lost.",
    assumption: "Part numbers agree between the two systems for most parts. Where they do not the record is kept unmatched rather than forced.",
    verified: "NEEDS_SME_REVIEW",
  },

  "FABRIC.SILVER_TC_CONFORMED": {
    key: "FABRIC.SILVER_TC_CONFORMED",
    system: "TEAMCENTER",
    object: "ItemRevision",
    service: "Core-2011-06-DataManagement",
    fields: [
      { name: "item_id", note: "Matched against the Oracle part number" },
      { name: "item_revision_id", note: "Current released revision carried onto the conformed record" },
    ],
    layer: "SILVER",
    transform: "The current released revision is attached to the conformed part record so the commercial view and the engineering view sit on one row.",
    verified: "NEEDS_SME_REVIEW",
  },

  "FABRIC.GOLD_PART_MASTER": {
    key: "FABRIC.GOLD_PART_MASTER",
    system: "ORACLE_EBS",
    object: "MTL_SYSTEM_ITEMS_B",
    fields: [
      { name: "SEGMENT1", note: "Part number presented to the business" },
      { name: "DESCRIPTION", note: "Description presented to the business" },
    ],
    layer: "GOLD",
    mart: "part_master_mart",
    transform: "One row per physical part, carrying every plant it is held in, its engineering revision, its duplicate cluster and its spend, ready for a business question to be asked of it directly.",
    verified: "NEEDS_SME_REVIEW",
  },

  "FABRIC.GOLD_PROCUREMENT": {
    key: "FABRIC.GOLD_PROCUREMENT",
    system: "ORACLE_EBS",
    object: "PO_LINES_ALL",
    fields: [
      { name: "PO_LINE_ID", note: "Grain of the procurement mart" },
      { name: "UNIT_PRICE", note: "Price carried onto the mart" },
    ],
    layer: "GOLD",
    mart: "procurement_automation_mart",
    transform: "Demand, approved supplier, agreed price and delivery performance are brought onto one row so a proposed requisition can be assembled and explained.",
    verified: "NEEDS_SME_REVIEW",
  },

  "FABRIC.GOLD_MRO": {
    key: "FABRIC.GOLD_MRO",
    system: "ORACLE_EBS",
    object: "MTL_EAM_ASSET_NUMBERS",
    fields: [
      { name: "ASSET_NUMBER", note: "Grain of the reliability mart" },
      { name: "CURRENT_ORGANIZATION_ID", note: "Plant the asset sits in" },
    ],
    layer: "GOLD",
    mart: "mro_reliability_mart",
    transform: "One row per maintainable asset carrying condition, criticality, failure history and the parts it consumes.",
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

/** Display labels. These are the only readable names for the two source systems. */
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
  "Registered at object level. The field names below describe what is needed, not what the source calls it."

export const VERIFIED_LABEL: Record<SourceRef["verified"], string> = {
  VERIFIED: "Verified",
  NEEDS_SME_REVIEW: "Needs SME review",
}
