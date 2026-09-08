# Nomenclature review

Every source system mapping used by the preview, for subject matter expert review.

**Internal review document. Not part of the deployed application.**

All mappings are a working draft. Nothing here has been confirmed against the manufacturer's own systems, which is why every entry reads `NEEDS_SME_REVIEW`. Correcting this file corrects the whole application: no screen names a source object directly, and a build fails if one tries.

Regenerate with `npm run review`. Do not edit by hand.

## How to read this

- **51 entries**, every one of them `NEEDS_SME_REVIEW` (Needs SME review).
- **16 entries are registered at object level.** For those, the field names describe what is needed, not what the source calls it, because the source system itself is still an assumption. They are the maintenance entries and they are the ones to look at first.
- **36 entries carry an explicit assumption.** Those are listed again in full at the end.
- **15 entries are registered but not yet read by any screen**, marked _not yet used_ below. They are mappings the build will need and are worth reviewing, but nothing currently depends on them being right.

## Every entry

| Key | System | Object | Level | Layer | Fields | Transform | Used on |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PART.ORACLE_IDENTITY` | Oracle EBS | `MTL_SYSTEM_ITEMS_B` | Field | Bronze | `inventory_item_id`<br>`organization_id`<br>`segment1`<br>`item_type`<br>`purchasing_item_flag` | Landed row for row from the item master with no reshaping. | 1 Problem selection<br>3 Part master intelligence<br>5 Automated procurement |
| `PART.ORACLE_DESCRIPTION` | Oracle EBS | `MTL_SYSTEM_ITEMS_TL` | Field | Silver | `description`<br>`language` | Descriptions are filtered to the base language, trimmed, case folded and stripped of punctuation so near identical text can be compared. | 1 Problem selection<br>3 Part master intelligence |
| `PART.ORACLE_REVISION` | Oracle EBS | `MTL_ITEM_REVISIONS_B` | Field | Silver | `revision`<br>`effectivity_date`<br>`implementation_date` | The item master's own revision is held alongside the engineering revision so the two can be compared rather than assumed to agree. | _not yet used_ |
| `PART.ORACLE_SUPPLIER_CROSSREF` | Oracle EBS | `MTL_CROSS_REFERENCES_B` | Field | Silver | `cross_reference_type`<br>`cross_reference`<br>`inventory_item_id` | The supplier part number source for duplicate evidence. References are matched across items so one physical part bought under two supplier numbers can be recognised. | 1 Problem selection<br>3 Part master intelligence |
| `PART.ORACLE_COMMODITY` | Oracle EBS | `MTL_ITEM_CATEGORIES joined to MTL_CATEGORIES_B` | Field | Silver | `category_set_id`<br>`segment1` | The purchasing category set assignment is resolved to a single commodity code per part. | 3 Part master intelligence |
| `PART.ORACLE_UOM` | Oracle EBS | `MTL_UNITS_OF_MEASURE_TL` | Field | Silver | `uom_code`<br>`unit_of_measure` | The primary unit held on the item is resolved to a name and normalised so quantities from different plants can be added together. | 3 Part master intelligence |
| `PART.ORACLE_ORG_ASSIGNMENT` | Oracle EBS | `MTL_PARAMETERS` | Field | Silver | `organization_id`<br>`organization_code` | Source of the inventory organization dimension used for cross organization duplicates. | _not yet used_ |
| `PART.ORACLE_ONHAND` | Oracle EBS | `MTL_ONHAND_QUANTITIES_DETAIL` | Field | Silver | `inventory_item_id`<br>`organization_id`<br>`primary_transaction_quantity` | Detail balances are summed to one on hand figure per part per plant. | 3 Part master intelligence<br>4 MRO signals |
| `PART.ORACLE_SUBINVENTORY` | Oracle EBS | `MTL_SECONDARY_INVENTORIES` | Field | Silver | `subinventory` | Storage locations are attached to the on hand balance so stock can be located, not just counted. | _not yet used_ |
| `PART.ORACLE_PLANNING` | Oracle EBS | `MTL_SYSTEM_ITEMS_B` | Field | Silver | `primary_uom_code`<br>`planner_code`<br>`buyer_id`<br>`full_lead_time`<br>`preprocessing_lead_time`<br>`processing_lead_time`<br>`postprocessing_lead_time`<br>`fixed_lot_multiplier`<br>`minimum_order_quantity` | Planning and order modifier attributes are read per organization and compared across plants to expose parts planned inconsistently. These are the fields the recommendation applies when it works out a quantity. | 3 Part master intelligence<br>4 MRO signals |
| `SUP.MASTER` | Oracle EBS | `AP_SUPPLIERS` | Field | Bronze | `vendor_id`<br>`vendor_name`<br>`segment1` | Supplier records are landed as held, including inactive suppliers so history stays readable. | _not yet used_ |
| `SUP.SITE` | Oracle EBS | `AP_SUPPLIER_SITES_ALL` | Field | Silver | `vendor_site_id`<br>`vendor_site_code`<br>`org_id` | Sites are rolled up to the parent supplier so performance is measured on the company rather than on each shipping location. | 2 Fabric skeleton<br>6 Fabric populated |
| `SUP.APPROVED_LIST` | Oracle EBS | `PO_APPROVED_SUPPLIER_LIST` | Field | Silver | `asl_id`<br>`item_id`<br>`vendor_id`<br>`vendor_site_id`<br>`asl_status_id` | Approved pairings of part and supplier are read so an automated requisition can only ever propose a supplier already approved for that part. | 1 Problem selection<br>3 Part master intelligence |
| `SUP.ASL_ATTRIBUTES` | Oracle EBS | `PO_ASL_ATTRIBUTES` | Field | Silver | `processing_lead_time`<br>`min_order_qty`<br>`fixed_lot_multiple` | Supplier held order modifiers are read alongside the planning ones, because the two disagree more often than anyone expects and the recommendation has to say which it used. | _not yet used_ |
| `REQ.HEADER` | Oracle EBS | `PO_REQUISITION_HEADERS_ALL` | Field | Bronze | `requisition_header_id`<br>`segment1`<br>`authorization_status`<br>`org_id` | Requisition headers are landed unchanged. | _not yet used_ |
| `REQ.LINE` | Oracle EBS | `PO_REQUISITION_LINES_ALL` | Field | Silver | `item_id`<br>`quantity`<br>`unit_meas_lookup_code`<br>`need_by_date`<br>`suggested_vendor_id`<br>`unit_price`<br>`destination_organization_id`<br>`deliver_to_location_id`<br>`requisition_line_id` | A proposed requisition line is assembled from the demand signal, the approved supplier for the part and the current agreed price, and is held for a buyer to release. | 1 Problem selection<br>5 Automated procurement |
| `REQ.DISTRIBUTION` | Oracle EBS | `PO_REQ_DISTRIBUTIONS_ALL` | Field | Silver | `code_combination_id` | The charge account sits on the distribution rather than on the requisition line, so a proposed requisition has to assemble both. | 5 Automated procurement |
| `PO.HEADER` | Oracle EBS | `PO_HEADERS_ALL` | Field | Bronze | `po_header_id`<br>`segment1`<br>`type_lookup_code`<br>`vendor_id`<br>`vendor_site_id`<br>`authorization_status` | Order headers are landed unchanged. | _not yet used_ |
| `PO.LINE` | Oracle EBS | `PO_LINES_ALL` | Field | Silver | `po_line_id`<br>`item_id`<br>`quantity`<br>`unit_price`<br>`promised_date` | Order lines are joined to the part and the supplier and converted to a common currency and unit so prices can be compared across plants. | 1 Problem selection<br>3 Part master intelligence<br>5 Automated procurement |
| `PO.SHIPMENT` | Oracle EBS | `PO_LINE_LOCATIONS_ALL` | Field | Silver | `need_by_date`<br>`quantity_received` | Committed and required dates are held against each shipment so lateness can be measured against a promise rather than against a wish. | _not yet used_ |
| `PO.DISTRIBUTION` | Oracle EBS | `PO_DISTRIBUTIONS_ALL` | Field | Silver | `distribution_id` | Distributions attach each order line to the account the spend is charged to. | _not yet used_ |
| `RCV.RECEIPT` | Oracle EBS | `RCV_SHIPMENT_LINES joined to RCV_TRANSACTIONS` | **Object** | Silver | `receipt date`<br>`quantity received` | The source for the on time delivery calculation on the supplier panel. Receipts are matched to the promised date on the shipment. | _not yet used_ |
| `RFQ.CORE_DOCUMENT` | Oracle EBS | `PO_HEADERS_ALL where type_lookup_code in (RFQ, QUOTATION)` | Field | Silver | `po_header_id`<br>`segment1`<br>`type_lookup_code`<br>`vendor_id` | The core purchasing route for request and quotation documents. This is the route the branch runs through if Oracle Sourcing is not in use. | 5 Automated procurement |
| `RFQ.SOURCING_AUCTION` | Oracle EBS | `PON_AUCTION_HEADERS_ALL` | Field | Silver | `auction_header_id`<br>`document_number`<br>`close_bidding_date` | The Oracle Sourcing route. A request is raised as a sourcing event and issued to the invited panel. | 5 Automated procurement |
| `RFQ.SOURCING_BID` | Oracle EBS | `PON_BID_HEADERS` | Field | Silver | `bid_number`<br>`trading_partner_id`<br>`bid_status` | Supplier responses are read per event so a response and a declined line can be told apart. | _not yet used_ |
| `RFQ.SOURCING_BID_PRICE` | Oracle EBS | `PON_BID_ITEM_PRICES` | Field | Gold<br>`gold_supplier_performance` | `line_number`<br>`bid_currency_unit_price`<br>`promised_date` | Quotations are ranked on delivered feasibility first and price second. A quotation whose promised date falls after the need date is not eligible to win on price alone. | _not yet used_ |
| `WRITEBACK.REQ_INTERFACE` | Oracle EBS | `PO_REQUISITIONS_INTERFACE_ALL and PO_REQ_DIST_INTERFACE_ALL` | **Object** | Silver | `staged requisition line`<br>`staged distribution`<br>`unapproved status` | Staged rows are written to the requisition interface and processed by the Requisition Import concurrent program, which creates the document in an unapproved state. No commitment exists until a person approves it in the source system. | 5 Automated procurement<br>7 What it takes |
| `WRITEBACK.PO_INTERFACE` | Oracle EBS | `PO_HEADERS_INTERFACE and PO_LINES_INTERFACE` | **Object** | Silver | `staged order header`<br>`staged order line` | The Purchasing Documents Open Interface, for staged purchase order creation after an award. | _not yet used_ |
| `WRITEBACK.SOA_GATEWAY` | Oracle EBS | `Oracle E-Business Suite Integrated SOA Gateway` | **Object** | Silver | `service invocation` | Service based invocation as an alternative to the interface tables. The document it creates is still unapproved and still waits for a person. | 5 Automated procurement |
| `MRO.ASSET_REGISTER` | Oracle EBS | `Asset number` | **Object** | Bronze | `asset identifier`<br>`asset description`<br>`operating location` | The maintainable asset register is landed as held. | 1 Problem selection |
| `MRO.ASSET_CRITICALITY` | Oracle EBS | `Asset number` | **Object** | Silver | `criticality`<br>`asset identifier` | Criticality is mapped onto a single one to four scale used everywhere in the preview, where one is the most critical. | 1 Problem selection<br>4 MRO signals |
| `MRO.WORK_ORDER` | Oracle EBS | `Maintenance work order` | **Object** | Silver | `work order identifier`<br>`asset identifier`<br>`status`<br>`scheduled start` | Work orders are joined to the asset so repeat work on one asset can be counted. | 1 Problem selection |
| `MRO.WORK_ORDER_MATERIAL` | Oracle EBS | `Maintenance work order` | **Object** | Gold<br>`gold_replenishment_signal` | `part required`<br>`quantity required`<br>`date required` | Material requirements on open work orders become the forward demand signal a proposed requisition is built from. | 3 Part master intelligence |
| `MRO.PM_SCHEDULE` | Oracle EBS | `Preventive maintenance schedule` | **Object** | Silver | `asset identifier`<br>`next due`<br>`interval` | The planned service date is one of the two dates the timing condition is measured against. | _not yet used_ |
| `MRO.METER_READING` | Oracle EBS | `Meter reading` | **Object** | Silver | `meter`<br>`reading`<br>`reading date` | Readings are turned into a rate of use per asset so the next service interval can be estimated. | 1 Problem selection |
| `PART.TC_ITEM_IDENTITY` | Teamcenter | `Item`<br>SOA `Core · DataManagement` | Field | Bronze | `item_id`<br>`object_name` | Objects are loaded through the data management service and landed as returned. | 3 Part master intelligence |
| `PART.TC_REVISION` | Teamcenter | `ItemRevision`<br>SOA `Core · DataManagement` | Field | Silver | `item_revision_id`<br>`object_desc`<br>`release_status_list`<br>`owning_user`<br>`last_mod_date` | Revisions are ordered per item and the latest released revision is selected as the current engineering definition. | 1 Problem selection<br>3 Part master intelligence |
| `PART.TC_QUERY` | Teamcenter | `Saved query`<br>SOA `Query · SavedQuery` | **Object** | Bronze | `query criteria` | Part retrieval by attribute. This is how the extract is scoped and scheduled. | _not yet used_ |
| `PART.TC_BOM_USAGE` | Teamcenter | `BOMWindow, BOMLine and occurrence data`<br>SOA `StructureManagement` | **Object** | Silver | `parent assembly`<br>`position`<br>`quantity per` | The source of the same assembly evidence on the duplicate score. Structures are expanded so two parts sitting at different positions in one assembly can be recognised. | 3 Part master intelligence |
| `PART.TC_CLASSIFICATION` | Teamcenter | `Classification class and attribute values`<br>SOA `Classification` | **Object** | Silver | `class`<br>`attribute values` | Classified characteristics let two parts be compared on shape and material rather than on description text alone. | 3 Part master intelligence |
| `PART.TC_CHANGE_NOTICE` | Teamcenter | `ChangeNoticeRevision and ChangeRequestRevision`<br>SOA `Change Management` | **Object** | Silver | `delivered revisions`<br>`impacted revisions`<br>`release date` | Context for the revision anomaly evidence type. A revision that changes a part substantially with no change object behind it is the pattern seen when a revision is used to avoid the material creation cycle. | 3 Part master intelligence |
| `GOLD.PART_ENTITY` | Oracle EBS | `MTL_SYSTEM_ITEMS_B conformed with Item and ItemRevision` | Field | Gold<br>`gold_part_entity` | `segment1`<br>`inventory_item_id`<br>`item_id` | Resolved part entity with source lineage. One row per physical part, carrying every plant it is held in, its engineering revision, its duplicate cluster and its spend. | 2 Fabric skeleton<br>5 Automated procurement<br>6 Fabric populated<br>7 What it takes |
| `GOLD.SUPPLIER_PERFORMANCE` | Oracle EBS | `AP_SUPPLIERS conformed with PO_LINES_ALL and receiving` | Field | Gold<br>`gold_supplier_performance` | `vendor_id`<br>`unit_price` | Supplier on time delivery, quality rate and price history on one row per supplier. | 2 Fabric skeleton<br>5 Automated procurement<br>6 Fabric populated<br>7 What it takes |
| `GOLD.REPLENISHMENT_SIGNAL` | Oracle EBS | `Asset number conformed with MTL_SYSTEM_ITEMS_B and MTL_ONHAND_QUANTITIES_DETAIL` | **Object** | Gold<br>`gold_replenishment_signal` | `asset`<br>`spare part`<br>`stock position`<br>`timing` | Asset, spare part, stock position and timing on one row. A signal fires on either the stock condition or the timing condition, and the mart carries which one. | 1 Problem selection<br>2 Fabric skeleton<br>4 MRO signals<br>5 Automated procurement<br>6 Fabric populated<br>7 What it takes |
| `DUP.CLUSTER_MEMBERSHIP` | Oracle EBS | `MTL_SYSTEM_ITEMS_B` | Field | Gold<br>`gold_part_entity` | `segment1`<br>`inventory_item_id`<br>`organization_id` | Candidate members are grouped into a cluster when description, classified characteristics and supplier references agree closely enough to suggest one physical part. The score is a sum of evidence contributions, some of which subtract. | 2 Fabric skeleton<br>3 Part master intelligence<br>6 Fabric populated |
| `DUP.SPEND_EXPOSURE` | Oracle EBS | `PO_LINES_ALL` | Field | Gold<br>`gold_part_entity` | `unit_price`<br>`quantity`<br>`item_id` | Spend on every member of a cluster is added together and the price spread between members is shown as the exposure created by the duplication. | 1 Problem selection |
| `SUP.OTD_PERFORMANCE` | Oracle EBS | `RCV_SHIPMENT_LINES joined to RCV_TRANSACTIONS` | **Object** | Gold<br>`gold_supplier_performance` | `receipt date`<br>`promised date`<br>`supplier` | On time delivery is the share of receipts landing on or before the committed date, measured over a rolling twelve months per supplier. | 1 Problem selection |
| `SUP.PRICE_VARIANCE` | Oracle EBS | `PO_LINES_ALL` | Field | Gold<br>`gold_supplier_performance` | `unit_price`<br>`item_id`<br>`vendor_id` | For each part the spread between the lowest and highest price paid in the period is calculated and expressed as the gap between plants and suppliers. | 1 Problem selection |
| `FABRIC.BRONZE_ORACLE` | Oracle EBS | `MTL_SYSTEM_ITEMS_B` | Field | Bronze | `inventory_item_id`<br>`organization_id` | Tables are copied on a schedule with no reshaping, so the landed copy can always be compared back to the source. | 2 Fabric skeleton<br>6 Fabric populated<br>7 What it takes |
| `FABRIC.BRONZE_TEAMCENTER` | Teamcenter | `Item`<br>SOA `Query · SavedQuery` | Field | Bronze | `item_id`<br>`last_mod_date` | Objects are extracted through saved queries and landed as returned, with no reshaping and no direct database access. | 2 Fabric skeleton<br>6 Fabric populated<br>7 What it takes |
| `FABRIC.SILVER_PART_CONFORMED` | Oracle EBS | `MTL_SYSTEM_ITEMS_B matched to Item` | Field | Silver | `segment1`<br>`inventory_item_id` | The Oracle item and the Teamcenter item are matched into one conformed part record that keeps both original keys so nothing is lost. | 3 Part master intelligence |

## Field notes

What each field is for, in the words a reviewer would use.

### `PART.ORACLE_IDENTITY`

`MTL_SYSTEM_ITEMS_B` in Oracle EBS

- `inventory_item_id` — Internal key for the item
- `organization_id` — Inventory organization the item row belongs to
- `segment1` — Displayed part number
- `item_type` — Item classification
- `purchasing_item_flag` — Whether the item can be bought

### `PART.ORACLE_DESCRIPTION`

`MTL_SYSTEM_ITEMS_TL` in Oracle EBS

- `description` — Short description shown to buyers and planners
- `language` — Translation row filter

### `PART.ORACLE_REVISION`

`MTL_ITEM_REVISIONS_B` in Oracle EBS

- `revision` — Revision as the item master holds it
- `effectivity_date` — When the revision becomes effective
- `implementation_date` — When it was implemented

### `PART.ORACLE_SUPPLIER_CROSSREF`

`MTL_CROSS_REFERENCES_B` in Oracle EBS

- `cross_reference_type` — Identifies the row as a supplier reference
- `cross_reference` — Supplier part number carried against the item
- `inventory_item_id` — Item the reference points at

### `PART.ORACLE_COMMODITY`

`MTL_ITEM_CATEGORIES joined to MTL_CATEGORIES_B` in Oracle EBS

- `category_set_id` — Identifies the purchasing category set
- `segment1` — Commodity code on the category

### `PART.ORACLE_UOM`

`MTL_UNITS_OF_MEASURE_TL` in Oracle EBS

- `uom_code` — Unit of measure code
- `unit_of_measure` — Readable unit name

### `PART.ORACLE_ORG_ASSIGNMENT`

`MTL_PARAMETERS` in Oracle EBS

- `organization_id` — Inventory organization key
- `organization_code` — Short code shown in the interface

### `PART.ORACLE_ONHAND`

`MTL_ONHAND_QUANTITIES_DETAIL` in Oracle EBS

- `inventory_item_id` — Item the balance belongs to
- `organization_id` — Plant holding the stock
- `primary_transaction_quantity` — Quantity on hand in the primary unit

### `PART.ORACLE_SUBINVENTORY`

`MTL_SECONDARY_INVENTORIES` in Oracle EBS

- `subinventory` — Storage location within the plant

### `PART.ORACLE_PLANNING`

`MTL_SYSTEM_ITEMS_B` in Oracle EBS

- `primary_uom_code` — Primary unit the item is planned and bought in
- `planner_code` — Planner assigned to the item
- `buyer_id` — Buyer assigned to the item
- `full_lead_time` — Total lead time in days
- `preprocessing_lead_time` — Days before the order is placed
- `processing_lead_time` — Days the supplier takes
- `postprocessing_lead_time` — Days after receipt before the part is usable
- `fixed_lot_multiplier` — Order multiple applied by planning
- `minimum_order_quantity` — Order floor applied by planning

### `SUP.MASTER`

`AP_SUPPLIERS` in Oracle EBS

- `vendor_id` — Supplier key
- `vendor_name` — Supplier name
- `segment1` — Supplier number shown to buyers

### `SUP.SITE`

`AP_SUPPLIER_SITES_ALL` in Oracle EBS

- `vendor_site_id` — Supplier site key
- `vendor_site_code` — Site code used on the purchase order
- `org_id` — Operating unit the site belongs to

### `SUP.APPROVED_LIST`

`PO_APPROVED_SUPPLIER_LIST` in Oracle EBS

- `asl_id` — Approval record key
- `item_id` — Part the approval applies to
- `vendor_id` — Approved supplier
- `vendor_site_id` — Approved supplier site
- `asl_status_id` — Approval status of the pairing

### `SUP.ASL_ATTRIBUTES`

`PO_ASL_ATTRIBUTES` in Oracle EBS

- `processing_lead_time` — Lead time quoted by the approved supplier
- `min_order_qty` — Supplier's own order floor
- `fixed_lot_multiple` — Supplier's own order multiple

### `REQ.HEADER`

`PO_REQUISITION_HEADERS_ALL` in Oracle EBS

- `requisition_header_id` — Requisition key
- `segment1` — Requisition number
- `authorization_status` — Where the requisition sits in approval
- `org_id` — Operating unit the requisition belongs to

### `REQ.LINE`

`PO_REQUISITION_LINES_ALL` in Oracle EBS

- `item_id` — The part being requested
- `quantity` — How many, after order modifiers are applied
- `unit_meas_lookup_code` — Unit the quantity is expressed in
- `need_by_date` — Date the material is required on site
- `suggested_vendor_id` — Supplier proposed on the line
- `unit_price` — Agreed price where one exists, otherwise last paid
- `destination_organization_id` — Plant the material is for
- `deliver_to_location_id` — Where the material is delivered
- `requisition_line_id` — Line key, assigned on creation

### `REQ.DISTRIBUTION`

`PO_REQ_DISTRIBUTIONS_ALL` in Oracle EBS

- `code_combination_id` — Account the spend is charged to

### `PO.HEADER`

`PO_HEADERS_ALL` in Oracle EBS

- `po_header_id` — Purchase order key
- `segment1` — Purchase order number
- `type_lookup_code` — Document type
- `vendor_id` — Supplier the order was placed with
- `vendor_site_id` — Supplier site the order was placed against
- `authorization_status` — Approval state of the order

### `PO.LINE`

`PO_LINES_ALL` in Oracle EBS

- `po_line_id` — Order line key
- `item_id` — Part being bought
- `quantity` — Quantity ordered
- `unit_price` — Price agreed on the line
- `promised_date` — Date the supplier committed to

### `PO.SHIPMENT`

`PO_LINE_LOCATIONS_ALL` in Oracle EBS

- `need_by_date` — Date the plant required the material
- `quantity_received` — Quantity received against the shipment

### `PO.DISTRIBUTION`

`PO_DISTRIBUTIONS_ALL` in Oracle EBS

- `distribution_id` — Distribution key

### `RCV.RECEIPT`

`RCV_SHIPMENT_LINES joined to RCV_TRANSACTIONS` in Oracle EBS · registered at object level, field names not asserted

- `receipt date` — When the material was received
- `quantity received` — How much arrived

### `RFQ.CORE_DOCUMENT`

`PO_HEADERS_ALL where type_lookup_code in (RFQ, QUOTATION)` in Oracle EBS

- `po_header_id` — Document key
- `segment1` — Document number shown to buyers and suppliers
- `type_lookup_code` — Marks the document as a request or a quotation
- `vendor_id` — Supplier the quotation came from

### `RFQ.SOURCING_AUCTION`

`PON_AUCTION_HEADERS_ALL` in Oracle EBS

- `auction_header_id` — Sourcing event key
- `document_number` — Event number shown to suppliers
- `close_bidding_date` — Deadline suppliers respond by

### `RFQ.SOURCING_BID`

`PON_BID_HEADERS` in Oracle EBS

- `bid_number` — Response key
- `trading_partner_id` — Supplier the response came from
- `bid_status` — Whether the response is active, withdrawn or superseded

### `RFQ.SOURCING_BID_PRICE`

`PON_BID_ITEM_PRICES` in Oracle EBS

- `line_number` — Line the response covers
- `bid_currency_unit_price` — Price quoted on the line
- `promised_date` — Date the supplier offers to deliver by

### `WRITEBACK.REQ_INTERFACE`

`PO_REQUISITIONS_INTERFACE_ALL and PO_REQ_DIST_INTERFACE_ALL` in Oracle EBS · registered at object level, field names not asserted

- `staged requisition line` — The proposed line, written to the interface
- `staged distribution` — The charge account for that line
- `unapproved status` — What keeps a person in the loop

### `WRITEBACK.PO_INTERFACE`

`PO_HEADERS_INTERFACE and PO_LINES_INTERFACE` in Oracle EBS · registered at object level, field names not asserted

- `staged order header` — The proposed order, written to the interface
- `staged order line` — The proposed line

### `WRITEBACK.SOA_GATEWAY`

`Oracle E-Business Suite Integrated SOA Gateway` in Oracle EBS · registered at object level, field names not asserted

- `service invocation` — Creates the document through a service call rather than a staged row

### `MRO.ASSET_REGISTER`

`Asset number` in Oracle EBS · registered at object level, field names not asserted

- `asset identifier` — Whatever the maintenance system uses to identify an asset
- `asset description` — Readable description
- `operating location` — Plant or line the asset runs in

### `MRO.ASSET_CRITICALITY`

`Asset number` in Oracle EBS · registered at object level, field names not asserted

- `criticality` — How much it matters when this asset stops
- `asset identifier` — The asset the value belongs to

### `MRO.WORK_ORDER`

`Maintenance work order` in Oracle EBS · registered at object level, field names not asserted

- `work order identifier` — Identifies the job
- `asset identifier` — The asset the job is raised against
- `status` — Whether the job is open, released or complete
- `scheduled start` — When the work is planned to begin

### `MRO.WORK_ORDER_MATERIAL`

`Maintenance work order` in Oracle EBS · registered at object level, field names not asserted

- `part required` — The spare the job needs
- `quantity required` — How many
- `date required` — When the part has to be on the job

### `MRO.PM_SCHEDULE`

`Preventive maintenance schedule` in Oracle EBS · registered at object level, field names not asserted

- `asset identifier` — The asset the schedule covers
- `next due` — When the next planned service falls
- `interval` — How often the work repeats

### `MRO.METER_READING`

`Meter reading` in Oracle EBS · registered at object level, field names not asserted

- `meter` — The meter recorded against the asset
- `reading` — Latest value
- `reading date` — When it was taken

### `PART.TC_ITEM_IDENTITY`

`Item` in Teamcenter

- `item_id` — Engineering part number
- `object_name` — Part name as engineering maintains it

### `PART.TC_REVISION`

`ItemRevision` in Teamcenter

- `item_revision_id` — Revision identifier
- `object_desc` — Revision level description
- `release_status_list` — Statuses applied to the revision
- `owning_user` — Who owns the revision
- `last_mod_date` — Most recent change to the revision

### `PART.TC_QUERY`

`Saved query` in Teamcenter · registered at object level, field names not asserted

- `query criteria` — Attributes parts are retrieved by

### `PART.TC_BOM_USAGE`

`BOMWindow, BOMLine and occurrence data` in Teamcenter · registered at object level, field names not asserted

- `parent assembly` — The structure the line sits in
- `position` — Where in the structure the part appears
- `quantity per` — How many per parent

### `PART.TC_CLASSIFICATION`

`Classification class and attribute values` in Teamcenter · registered at object level, field names not asserted

- `class` — The class a part is filed under
- `attribute values` — Classified characteristics such as size or material

### `PART.TC_CHANGE_NOTICE`

`ChangeNoticeRevision and ChangeRequestRevision` in Teamcenter · registered at object level, field names not asserted

- `delivered revisions` — Revisions the change delivers
- `impacted revisions` — Revisions the change affects
- `release date` — When the change was released

### `GOLD.PART_ENTITY`

`MTL_SYSTEM_ITEMS_B conformed with Item and ItemRevision` in Oracle EBS

- `segment1` — Part number presented to the business
- `inventory_item_id` — Commercial key, carried so nothing is lost
- `item_id` — Engineering key, carried alongside it

### `GOLD.SUPPLIER_PERFORMANCE`

`AP_SUPPLIERS conformed with PO_LINES_ALL and receiving` in Oracle EBS

- `vendor_id` — Grain of the mart
- `unit_price` — Price history carried onto the mart

### `GOLD.REPLENISHMENT_SIGNAL`

`Asset number conformed with MTL_SYSTEM_ITEMS_B and MTL_ONHAND_QUANTITIES_DETAIL` in Oracle EBS · registered at object level, field names not asserted

- `asset` — The asset the signal belongs to
- `spare part` — The part it will need
- `stock position` — On hand against the reorder point
- `timing` — Need date against the supplier lead time

### `DUP.CLUSTER_MEMBERSHIP`

`MTL_SYSTEM_ITEMS_B` in Oracle EBS

- `segment1` — Part numbers grouped into a candidate cluster
- `inventory_item_id` — Cluster member keys
- `organization_id` — Plant each member sits in

### `DUP.SPEND_EXPOSURE`

`PO_LINES_ALL` in Oracle EBS

- `unit_price` — Price paid on each member of the cluster
- `quantity` — Quantity bought against each member
- `item_id` — Links the line back to the cluster member

### `SUP.OTD_PERFORMANCE`

`RCV_SHIPMENT_LINES joined to RCV_TRANSACTIONS` in Oracle EBS · registered at object level, field names not asserted

- `receipt date` — When the material arrived
- `promised date` — What the supplier committed to
- `supplier` — Who is being measured

### `SUP.PRICE_VARIANCE`

`PO_LINES_ALL` in Oracle EBS

- `unit_price` — Price paid on each line
- `item_id` — Part the price applies to
- `vendor_id` — Supplier the price was paid to

### `FABRIC.BRONZE_ORACLE`

`MTL_SYSTEM_ITEMS_B` in Oracle EBS

- `inventory_item_id` — Key carried through every layer unchanged
- `organization_id` — Carried with it

### `FABRIC.BRONZE_TEAMCENTER`

`Item` in Teamcenter

- `item_id` — Key carried through every layer unchanged
- `last_mod_date` — Used to pick up changed objects on each load

### `FABRIC.SILVER_PART_CONFORMED`

`MTL_SYSTEM_ITEMS_B matched to Item` in Oracle EBS

- `segment1` — Matched against the engineering part number
- `inventory_item_id` — Held alongside the engineering key

## Assumptions to confirm

These are the statements most worth arguing with.

- **`PART.ORACLE_IDENTITY`** — Part numbers are carried in segment1 rather than in a concatenated segment structure.
- **`PART.ORACLE_DESCRIPTION`** — Only the base language row is in scope.
- **`PART.ORACLE_SUPPLIER_CROSSREF`** — Supplier cross references are maintained here rather than only on the purchase order.
- **`PART.ORACLE_COMMODITY`** — One purchasing category set is authoritative for commodity reporting.
- **`PART.ORACLE_PLANNING`** — Full lead time is the figure to plan against. Whether the three component lead times are maintained separately needs checking.
- **`SUP.MASTER`** — On older releases these are PO_VENDORS and PO_VENDOR_SITES_ALL. Confirm the release before the call.
- **`SUP.SITE`** — On older releases these are PO_VENDORS and PO_VENDOR_SITES_ALL. Confirm the release before the call.
- **`SUP.APPROVED_LIST`** — The approved supplier list is maintained well enough to be the guard rail for automation. This is the assumption most worth testing early.
- **`REQ.LINE`** — Nothing is released to a supplier without a person approving it. Automation stops at the proposal. Note that requisition line type and supplier site are not registered on this object; if the manufacturer keys them, they need adding here first.
- **`PO.LINE`** — A single reporting currency is sufficient for this preview.
- **`RCV.RECEIPT`** — The appendix names these tables but not their columns, so no column is asserted here. Receipts with no committed date are excluded rather than counted as late.
- **`RFQ.CORE_DOCUMENT`** — Whether Oracle Sourcing is licensed and in use requires confirmation. If it is not, the request for quotation branch runs through the core purchasing route instead. Both are carried here and neither is committed to.
- **`RFQ.SOURCING_AUCTION`** — Whether Oracle Sourcing is licensed and in use requires confirmation. If it is not, the request for quotation branch runs through the core purchasing route instead. Both are carried here and neither is committed to.
- **`RFQ.SOURCING_BID`** — Whether Oracle Sourcing is licensed and in use requires confirmation. If it is not, the request for quotation branch runs through the core purchasing route instead. Both are carried here and neither is committed to.
- **`RFQ.SOURCING_BID_PRICE`** — The date a supplier offers is taken at face value here. In practice it would be weighted by that supplier's delivery record.
- **`WRITEBACK.REQ_INTERFACE`** — The choice between interface tables and the Integrated SOA Gateway depends on release and installed components. Both are carried here and neither is committed to.
- **`WRITEBACK.PO_INTERFACE`** — The choice between interface tables and the Integrated SOA Gateway depends on release and installed components. Both are carried here and neither is committed to.
- **`WRITEBACK.SOA_GATEWAY`** — The choice between interface tables and the Integrated SOA Gateway depends on release and installed components. Both are carried here and neither is committed to.
- **`MRO.ASSET_REGISTER`** — The maintenance system of record is assumed to be Oracle Enterprise Asset Management and has not been confirmed with the manufacturer. Registered at object level only; no column is named for these objects.
- **`MRO.ASSET_CRITICALITY`** — The maintenance system of record is assumed to be Oracle Enterprise Asset Management and has not been confirmed with the manufacturer. Registered at object level only; no column is named for these objects. Whether criticality is recorded at all, and on what scale, is the first thing to confirm.
- **`MRO.WORK_ORDER`** — The maintenance system of record is assumed to be Oracle Enterprise Asset Management and has not been confirmed with the manufacturer. Registered at object level only; no column is named for these objects.
- **`MRO.WORK_ORDER_MATERIAL`** — The maintenance system of record is assumed to be Oracle Enterprise Asset Management and has not been confirmed with the manufacturer. Registered at object level only; no column is named for these objects. The link from a work order to the part it consumes is the single most important thing to confirm, because the procurement signal is built on it.
- **`MRO.PM_SCHEDULE`** — The maintenance system of record is assumed to be Oracle Enterprise Asset Management and has not been confirmed with the manufacturer. Registered at object level only; no column is named for these objects.
- **`MRO.METER_READING`** — The maintenance system of record is assumed to be Oracle Enterprise Asset Management and has not been confirmed with the manufacturer. Registered at object level only; no column is named for these objects. Whether readings are taken often enough for a rate to mean anything also needs checking.
- **`PART.TC_ITEM_IDENTITY`** — Extraction is through the service layer only. No direct database access is contemplated anywhere in this design.
- **`PART.TC_QUERY`** — The appendix names the service but not the saved queries themselves. Which queries exist, and whether they cover the population we need, has to be confirmed.
- **`PART.TC_BOM_USAGE`** — The appendix names the objects but not their properties, so none is asserted. Which structure is expanded, working or released, needs deciding.
- **`PART.TC_CLASSIFICATION`** — Classification coverage is partial. Absence of a class is not evidence that two parts differ.
- **`PART.TC_CHANGE_NOTICE`** — The appendix names the objects but not their properties, so none is asserted.
- **`GOLD.PART_ENTITY`** — Part numbers agree between the two systems for most parts. Where they do not the record is kept unmatched rather than forced.
- **`GOLD.REPLENISHMENT_SIGNAL`** — The maintenance system of record is assumed to be Oracle Enterprise Asset Management and has not been confirmed with the manufacturer. Registered at object level only; no column is named for these objects. The weighting behind the condition estimate is illustrative and would be set with the manufacturer's reliability engineers.
- **`DUP.CLUSTER_MEMBERSHIP`** — A cluster is a candidate for review, not a decision. Nothing is merged automatically.
- **`DUP.SPEND_EXPOSURE`** — Price differences between members are treated as avoidable only where the members are genuinely the same part. Every figure is illustrative.
- **`SUP.OTD_PERFORMANCE`** — Receipts with no committed date are excluded rather than counted as late.
- **`FABRIC.BRONZE_ORACLE`** — Change capture strategy is not settled. Timestamp based capture is assumed here and needs confirming.
- **`FABRIC.SILVER_PART_CONFORMED`** — Where the two do not agree the record is kept unmatched rather than forced.
