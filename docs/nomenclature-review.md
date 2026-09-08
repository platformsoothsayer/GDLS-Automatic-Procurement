# Nomenclature review

Every source system mapping used by the preview, for subject matter expert review.

**Internal review document. Not part of the deployed application.**

All mappings are a working draft. Nothing here has been confirmed against the manufacturer's own systems, which is why every entry reads `NEEDS_SME_REVIEW`. Correcting this file corrects the whole application: no screen names a source object directly, and a build fails if one tries.

Regenerate with `npm run review`. Do not edit by hand.

## How to read this

- **56 entries**, every one of them `NEEDS_SME_REVIEW` (Needs SME review).
- **7 entries are registered at object level.** For those, the field names describe what is needed, not what the source calls it, because the source system itself is still an assumption. They are the maintenance entries and they are the ones to look at first.
- **30 entries carry an explicit assumption.** Those are listed again in full at the end.
- **20 entries are registered but not yet read by any screen**, marked _not yet used_ below. They are mappings the build will need and are worth reviewing, but nothing currently depends on them being right.

## Every entry

| Key | System | Object | Level | Layer | Fields | Transform | Used on |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PART.ORACLE_IDENTITY` | Oracle EBS | `MTL_SYSTEM_ITEMS_B` | Field | Bronze | `INVENTORY_ITEM_ID`<br>`ORGANIZATION_ID`<br>`SEGMENT1`<br>`ITEM_TYPE`<br>`CREATION_DATE` | Landed row for row from the item master with no reshaping. | 1 Problem selection<br>3 Part master intelligence<br>5 Automated procurement |
| `PART.ORACLE_DESCRIPTION` | Oracle EBS | `MTL_SYSTEM_ITEMS_TL` | Field | Silver | `DESCRIPTION`<br>`LONG_DESCRIPTION`<br>`LANGUAGE` | Descriptions are filtered to the base language, trimmed, case folded and stripped of punctuation so near identical text can be compared. | 1 Problem selection<br>3 Part master intelligence |
| `PART.ORACLE_ORG_ASSIGNMENT` | Oracle EBS | `MTL_PARAMETERS` | Field | Silver | `ORGANIZATION_ID`<br>`ORGANIZATION_CODE`<br>`MASTER_ORGANIZATION_ID` | Organization rows are joined to each item so the same part can be seen in every plant that carries it. | _not yet used_ |
| `PART.ORACLE_COMMODITY` | Oracle EBS | `MTL_ITEM_CATEGORIES` | Field | Silver | `CATEGORY_ID`<br>`CATEGORY_SET_ID`<br>`SEGMENT1` | The purchasing category set assignment is resolved to a single commodity group label per part. | 3 Part master intelligence |
| `PART.ORACLE_UOM` | Oracle EBS | `MTL_UNITS_OF_MEASURE_TL` | Field | Silver | `UOM_CODE`<br>`UNIT_OF_MEASURE` | Unit codes are resolved to names and normalised so quantities from different plants can be added together. | 3 Part master intelligence |
| `PART.ORACLE_PLANNING` | Oracle EBS | `MTL_SYSTEM_ITEMS_B` | Field | Silver | `PLANNING_MAKE_BUY_CODE`<br>`FULL_LEAD_TIME`<br>`MIN_MINMAX_QUANTITY`<br>`MAX_MINMAX_QUANTITY`<br>`FIXED_LOT_MULTIPLIER` | Planning attributes are read per organization and compared across plants to expose parts planned inconsistently. | 3 Part master intelligence<br>4 MRO signals |
| `PART.ORACLE_LIFECYCLE_STATUS` | Oracle EBS | `MTL_ITEM_STATUS` | Field | Silver | `INVENTORY_ITEM_STATUS_CODE`<br>`DISABLE_DATE` | Status codes are mapped to a common active, restricted or obsolete vocabulary shared with the engineering side. | _not yet used_ |
| `PART.ORACLE_ONHAND` | Oracle EBS | `MTL_ONHAND_QUANTITIES_DETAIL` | Field | Silver | `INVENTORY_ITEM_ID`<br>`ORGANIZATION_ID`<br>`TRANSACTION_QUANTITY`<br>`SUBINVENTORY_CODE` | Detail balances are summed to one on hand figure per part per plant. | 3 Part master intelligence<br>4 MRO signals |
| `PART.ORACLE_SUPPLIER_CROSSREF` | Oracle EBS | `MTL_CROSS_REFERENCES` | Field | Silver | `CROSS_REFERENCE`<br>`CROSS_REFERENCE_TYPE`<br>`INVENTORY_ITEM_ID` | Supplier references are matched across items so one physical part bought under two supplier numbers can be recognised. | 1 Problem selection<br>3 Part master intelligence |
| `PART.ORACLE_MATERIAL_TXN` | Oracle EBS | `MTL_MATERIAL_TRANSACTIONS` | Field | Silver | `TRANSACTION_TYPE_ID`<br>`TRANSACTION_DATE`<br>`PRIMARY_QUANTITY` | Movements are aggregated by month to give each part a consumption profile. | 3 Part master intelligence |
| `PART.TC_ITEM_IDENTITY` | Teamcenter | `Item`<br>SOA `Core-2011-06-DataManagement` | Field | Bronze | `item_id`<br>`object_name`<br>`object_type`<br>`creation_date` | Objects are loaded through the data management service and landed as returned. | 3 Part master intelligence |
| `PART.TC_REVISION` | Teamcenter | `ItemRevision`<br>SOA `Core-2011-06-DataManagement` | Field | Silver | `item_revision_id`<br>`object_desc`<br>`last_mod_date`<br>`items_tag` | Revisions are ordered per item and the latest released revision is selected as the current engineering definition. | 1 Problem selection<br>3 Part master intelligence |
| `PART.TC_MASTER_FORM` | Teamcenter | `ItemMasterForm`<br>SOA `Core-2011-06-DataManagement` | Field | Silver | `IMAN_master_form`<br>`unit_of_measure`<br>`make_buy` | Master form attributes are flattened onto the part so the engineering view can be compared with the Oracle planning view. | _not yet used_ |
| `PART.TC_RELEASE_STATUS` | Teamcenter | `ReleaseStatus`<br>SOA `Core-2011-06-DataManagement` | Field | Silver | `release_status_list`<br>`date_released` | Release statuses are reduced to one released or not released flag with the release date. | 3 Part master intelligence |
| `PART.TC_CLASSIFICATION` | Teamcenter | `ICO`<br>SOA `Classification-2017-05-Classification` | Field | Silver | `class_id`<br>`ico_id`<br>`attribute_values` | Classified characteristics are read so two parts can be compared on shape and material rather than on description text alone. | 3 Part master intelligence |
| `PART.TC_BOM_USAGE` | Teamcenter | `BOMLine`<br>SOA `Cad-2007-01-StructureManagement` | Field | Silver | `bl_line_object`<br>`bl_quantity`<br>`bl_indented_title` | Structures are expanded so each part carries the count of assemblies that use it. | 3 Part master intelligence |
| `PART.TC_CHANGE_NOTICE` | Teamcenter | `ChangeNoticeRevision`<br>SOA `ChangeManagement-2012-09-ChangeManagement` | Field | Silver | `CMHasSolutionItem`<br>`CMHasImpactedItem`<br>`date_released` | Change notices are linked to the revisions they deliver so a new revision can be tested for whether a change actually justified it. | 3 Part master intelligence |
| `PART.TC_DATASET` | Teamcenter | `Dataset`<br>SOA `Core-2011-06-DataManagement` | Field | Bronze | `object_name`<br>`ref_list`<br>`last_mod_date` | Attachment metadata only is landed. No file content is read in this preview. | _not yet used_ |
| `DUP.CLUSTER_MEMBERSHIP` | Oracle EBS | `MTL_SYSTEM_ITEMS_B` | Field | Gold<br>`duplicate_resolution_mart` | `SEGMENT1`<br>`INVENTORY_ITEM_ID`<br>`ORGANIZATION_ID` | Candidate members are grouped into a cluster when description, classified characteristics and supplier references agree closely enough to suggest one physical part. | 2 Fabric skeleton<br>3 Part master intelligence<br>6 Fabric populated |
| `DUP.CAUSE_COPY_PASTE` | Oracle EBS | `MTL_SYSTEM_ITEMS_TL` | Field | Gold<br>`duplicate_resolution_mart` | `DESCRIPTION`<br>`CREATION_DATE` | A cluster is attributed to copying when descriptions differ only by spacing, abbreviation or word order and no engineering change links the members. | _not yet used_ |
| `DUP.CAUSE_REVISION_ABUSE` | Teamcenter | `ItemRevision`<br>SOA `Core-2011-06-DataManagement` | Field | Gold<br>`duplicate_resolution_mart` | `item_revision_id`<br>`object_desc`<br>`CMHasSolutionItem` | A cluster is attributed to revision abuse when a revision changes the part substantially yet no change notice delivered it, which is the pattern seen when a new revision is used to avoid the material creation cycle. | _not yet used_ |
| `DUP.CAUSE_SUPPLIER_PART` | Oracle EBS | `MTL_CROSS_REFERENCES` | Field | Gold<br>`duplicate_resolution_mart` | `CROSS_REFERENCE`<br>`CROSS_REFERENCE_TYPE` | A cluster is attributed to supplier numbering when separate internal parts resolve to the same supplier part number at the same supplier. | _not yet used_ |
| `DUP.CAUSE_ORG_SPLIT` | Oracle EBS | `MTL_SYSTEM_ITEMS_B` | Field | Gold<br>`duplicate_resolution_mart` | `ORGANIZATION_ID`<br>`SEGMENT1` | A cluster is attributed to organization split when members are near identical but were created separately in different plants rather than shared from the master organization. | _not yet used_ |
| `DUP.DESCRIPTION_SIMILARITY` | Oracle EBS | `MTL_SYSTEM_ITEMS_TL` | Field | Gold<br>`duplicate_resolution_mart` | `DESCRIPTION`<br>`LONG_DESCRIPTION` | Descriptions are normalised and scored for similarity, and the score is shown so a reviewer can see how strong the match is rather than being given a yes or no. | _not yet used_ |
| `DUP.SPEND_EXPOSURE` | Oracle EBS | `PO_LINES_ALL` | Field | Gold<br>`duplicate_resolution_mart` | `UNIT_PRICE`<br>`QUANTITY`<br>`ITEM_ID` | Spend on every member of a cluster is added together and the price spread between members is shown as the exposure created by the duplication. | 1 Problem selection |
| `SUP.MASTER` | Oracle EBS | `AP_SUPPLIERS` | Field | Bronze | `VENDOR_ID`<br>`VENDOR_NAME`<br>`SEGMENT1`<br>`ENABLED_FLAG` | Supplier records are landed as held, including inactive suppliers so history stays readable. | _not yet used_ |
| `SUP.SITE` | Oracle EBS | `AP_SUPPLIER_SITES_ALL` | Field | Silver | `VENDOR_SITE_ID`<br>`VENDOR_SITE_CODE`<br>`PURCHASING_SITE_FLAG` | Sites are rolled up to the parent supplier so performance is measured on the company rather than on each shipping location. | 2 Fabric skeleton<br>6 Fabric populated |
| `SUP.APPROVED_LIST` | Oracle EBS | `PO_APPROVED_SUPPLIER_LIST` | Field | Silver | `ITEM_ID`<br>`VENDOR_ID`<br>`ASL_STATUS_ID`<br>`PROCESSING_LEAD_TIME` | Approved pairings of part and supplier are read so an automated requisition can only ever propose a supplier that is already approved for that part. | 1 Problem selection<br>3 Part master intelligence |
| `PO.HEADER` | Oracle EBS | `PO_HEADERS_ALL` | Field | Bronze | `PO_HEADER_ID`<br>`SEGMENT1`<br>`VENDOR_ID`<br>`AUTHORIZATION_STATUS` | Order headers are landed unchanged. | _not yet used_ |
| `PO.LINE` | Oracle EBS | `PO_LINES_ALL` | Field | Silver | `PO_LINE_ID`<br>`ITEM_ID`<br>`UNIT_PRICE`<br>`QUANTITY`<br>`CREATION_DATE` | Order lines are joined to the part and the supplier and converted to a common currency and unit so prices can be compared across plants. | 1 Problem selection<br>3 Part master intelligence<br>5 Automated procurement |
| `PO.SHIPMENT` | Oracle EBS | `PO_LINE_LOCATIONS_ALL` | Field | Silver | `PROMISED_DATE`<br>`NEED_BY_DATE`<br>`QUANTITY_RECEIVED` | Committed and required dates are held against each shipment so lateness can be measured against a promise rather than against a wish. | _not yet used_ |
| `PO.DISTRIBUTION` | Oracle EBS | `PO_DISTRIBUTIONS_ALL` | Field | Silver | `CODE_COMBINATION_ID`<br>`DESTINATION_ORGANIZATION_ID` | Distributions attach each order line to the receiving plant and the charge account. | _not yet used_ |
| `REQ.HEADER` | Oracle EBS | `PO_REQUISITION_HEADERS_ALL` | Field | Bronze | `REQUISITION_HEADER_ID`<br>`SEGMENT1`<br>`AUTHORIZATION_STATUS` | Requisition headers are landed unchanged. | _not yet used_ |
| `REQ.LINE` | Oracle EBS | `PO_REQUISITION_LINES_ALL` | Field | Gold<br>`procurement_automation_mart` | `LINE_TYPE_ID`<br>`ITEM_ID`<br>`QUANTITY`<br>`UNIT_MEAS_LOOKUP_CODE`<br>`NEED_BY_DATE`<br>`SUGGESTED_VENDOR_ID`<br>`SUGGESTED_VENDOR_SITE_ID`<br>`UNIT_PRICE`<br>`CHARGE_ACCOUNT_ID`<br>`DELIVER_TO_LOCATION_ID` | A proposed requisition line is assembled from the demand signal, the approved supplier for the part and the current agreed price, and is held for a buyer to release. | 1 Problem selection<br>5 Automated procurement |
| `REQ.IMPORT_INTERFACE` | Oracle EBS | `PO_REQUISITIONS_INTERFACE_ALL` | Field | Gold<br>`procurement_automation_mart` | `INTERFACE_SOURCE_CODE`<br>`AUTHORIZATION_STATUS`<br>`PROCESS_FLAG`<br>`REQUISITION_TYPE` | Staged rows are written to the requisition interface and the standard requisition import creates the document in an unapproved state. No commitment exists until a person approves it in the source system. | 5 Automated procurement<br>7 What it takes |
| `RFQ.REQUEST` | Oracle EBS | `PO_HEADERS_ALL` | Field | Gold<br>`procurement_automation_mart` | `TYPE_LOOKUP_CODE`<br>`QUOTE_TYPE_LOOKUP_CODE`<br>`RFQ_CLOSE_DATE`<br>`SEGMENT1` | A request for quotation is assembled from the same recommendation the requisition would have used, so the two paths start from one set of numbers. | _not yet used_ |
| `RFQ.QUOTATION` | Oracle EBS | `PO_LINES_ALL` | Field | Gold<br>`supplier_performance_mart` | `UNIT_PRICE`<br>`QUANTITY`<br>`VENDOR_ID`<br>`PAYMENT_TERMS_ID` | Quotations are ranked on delivered feasibility first and price second. A quotation that cannot meet the need date is not eligible to win on price alone. | 5 Automated procurement |
| `RCV.TRANSACTION` | Oracle EBS | `RCV_TRANSACTIONS` | Field | Silver | `TRANSACTION_DATE`<br>`QUANTITY`<br>`PO_LINE_ID` | Receipts are matched to the promised date on the shipment to produce an on time measure per supplier. | _not yet used_ |
| `AP.INVOICE_MATCH` | Oracle EBS | `AP_INVOICE_LINES_ALL` | Field | Silver | `INVOICE_ID`<br>`PO_LINE_ID`<br>`UNIT_PRICE` | Invoiced price is compared with ordered price so the difference between what was agreed and what was paid is visible. | _not yet used_ |
| `SUP.OTD_PERFORMANCE` | Oracle EBS | `RCV_TRANSACTIONS` | Field | Gold<br>`supplier_performance_mart` | `TRANSACTION_DATE`<br>`PROMISED_DATE`<br>`VENDOR_ID` | On time delivery is the share of receipts landing on or before the committed date, measured over a rolling twelve months per supplier. | 1 Problem selection |
| `SUP.PRICE_VARIANCE` | Oracle EBS | `PO_LINES_ALL` | Field | Gold<br>`supplier_performance_mart` | `UNIT_PRICE`<br>`ITEM_ID`<br>`VENDOR_ID` | For each part the spread between the lowest and highest price paid in the period is calculated and expressed as the gap between plants and suppliers. | 1 Problem selection |
| `PRICE.COMMODITY_INDEX` | Oracle EBS | `PO_LINES_ALL` | Field | Gold<br>`commodity_price_mart` | `UNIT_PRICE`<br>`QUANTITY`<br>`CREATION_DATE` | Prices are weighted by quantity and averaged by month for each commodity group to give a twenty four month movement per group. | _not yet used_ |
| `MRO.ASSET_REGISTER` | Oracle EBS | `Asset register` | **Object** | Bronze | `asset identifier`<br>`asset description`<br>`operating location`<br>`asset group` | The maintainable asset register is landed as held, without reshaping. | 1 Problem selection |
| `MRO.ASSET_CRITICALITY` | Oracle EBS | `Asset attributes` | **Object** | Silver | `criticality`<br>`asset identifier` | Criticality is read from the asset attributes and mapped onto a single one to four scale used everywhere in the preview, where one is the most critical. | 1 Problem selection<br>4 MRO signals |
| `MRO.WORK_ORDER` | Oracle EBS | `Maintenance work order` | **Object** | Silver | `work order identifier`<br>`asset identifier`<br>`status`<br>`scheduled start` | Work orders are joined to the asset so repeat work on one asset can be counted. | 1 Problem selection |
| `MRO.WORK_ORDER_MATERIAL` | Oracle EBS | `Work order material requirement` | **Object** | Gold<br>`mro_reliability_mart` | `part required`<br>`quantity required`<br>`date required` | Material requirements on open work orders become the forward demand signal a proposed requisition is built from. | 3 Part master intelligence |
| `MRO.METER_READING` | Oracle EBS | `Meter reading` | **Object** | Silver | `meter`<br>`reading`<br>`reading date` | Readings are turned into a rate of use per asset so the next service interval can be estimated. | 1 Problem selection |
| `MRO.FAILURE_HISTORY` | Oracle EBS | `Failure record` | **Object** | Silver | `failure classification`<br>`asset identifier`<br>`failure date` | Failures are counted per asset and per classification over the period to show which assets fail repeatedly for the same reason. | _not yet used_ |
| `MRO.CONDITION_SIGNAL` | Oracle EBS | `Asset condition` | **Object** | Gold<br>`mro_reliability_mart` | `condition observation`<br>`asset identifier` | Condition, meter rate, failure history and criticality are combined into one signal per asset, and the signal fires on either a stock condition or a timing condition. | 1 Problem selection<br>4 MRO signals<br>5 Automated procurement |
| `FABRIC.BRONZE_ORACLE` | Oracle EBS | `MTL_SYSTEM_ITEMS_B` | Field | Bronze | `LAST_UPDATE_DATE`<br>`INVENTORY_ITEM_ID` | Tables are copied on a schedule with no reshaping, so the landed copy can always be compared back to the source. | 2 Fabric skeleton<br>6 Fabric populated<br>7 What it takes |
| `FABRIC.BRONZE_TEAMCENTER` | Teamcenter | `Item`<br>SOA `Query-2014-11-SavedQuery` | Field | Bronze | `item_id`<br>`last_mod_date` | Objects are extracted through saved queries and landed as returned, with no reshaping. | 2 Fabric skeleton<br>6 Fabric populated<br>7 What it takes |
| `FABRIC.SILVER_PART_CONFORMED` | Oracle EBS | `MTL_SYSTEM_ITEMS_B` | Field | Silver | `SEGMENT1`<br>`INVENTORY_ITEM_ID` | The Oracle item and the Teamcenter item are matched into one conformed part record that keeps both original keys so nothing is lost. | 3 Part master intelligence |
| `FABRIC.SILVER_TC_CONFORMED` | Teamcenter | `ItemRevision`<br>SOA `Core-2011-06-DataManagement` | Field | Silver | `item_id`<br>`item_revision_id` | The current released revision is attached to the conformed part record so the commercial view and the engineering view sit on one row. | _not yet used_ |
| `FABRIC.GOLD_PART_MASTER` | Oracle EBS | `MTL_SYSTEM_ITEMS_B` | Field | Gold<br>`part_master_mart` | `SEGMENT1`<br>`DESCRIPTION` | One row per physical part, carrying every plant it is held in, its engineering revision, its duplicate cluster and its spend, ready for a business question to be asked of it directly. | 2 Fabric skeleton<br>6 Fabric populated<br>7 What it takes |
| `FABRIC.GOLD_PROCUREMENT` | Oracle EBS | `PO_LINES_ALL` | Field | Gold<br>`procurement_automation_mart` | `PO_LINE_ID`<br>`UNIT_PRICE` | Demand, approved supplier, agreed price and delivery performance are brought onto one row so a proposed requisition can be assembled and explained. | 2 Fabric skeleton<br>5 Automated procurement<br>6 Fabric populated<br>7 What it takes |
| `FABRIC.GOLD_MRO` | Oracle EBS | `MTL_EAM_ASSET_NUMBERS` | Field | Gold<br>`mro_reliability_mart` | `ASSET_NUMBER`<br>`CURRENT_ORGANIZATION_ID` | One row per maintainable asset carrying condition, criticality, failure history and the parts it consumes. | 2 Fabric skeleton<br>6 Fabric populated<br>7 What it takes |

## Field notes

What each field is for, in the words a reviewer would use.

### `PART.ORACLE_IDENTITY`

`MTL_SYSTEM_ITEMS_B` in Oracle EBS

- `INVENTORY_ITEM_ID` — Internal surrogate key for the item
- `ORGANIZATION_ID` — Inventory organization the item row belongs to
- `SEGMENT1` — Displayed part number
- `ITEM_TYPE` — Purchased, manufactured or phantom classification
- `CREATION_DATE` — Row creation timestamp, used to order duplicates

### `PART.ORACLE_DESCRIPTION`

`MTL_SYSTEM_ITEMS_TL` in Oracle EBS

- `DESCRIPTION` — Short description shown to buyers and planners
- `LONG_DESCRIPTION` — Extended description where maintained
- `LANGUAGE` — Translation row filter

### `PART.ORACLE_ORG_ASSIGNMENT`

`MTL_PARAMETERS` in Oracle EBS

- `ORGANIZATION_ID` — Inventory organization key
- `ORGANIZATION_CODE` — Short code shown in the interface
- `MASTER_ORGANIZATION_ID` — Controlling master organization

### `PART.ORACLE_COMMODITY`

`MTL_ITEM_CATEGORIES` in Oracle EBS

- `CATEGORY_ID` — Assigned category key
- `CATEGORY_SET_ID` — Identifies the purchasing category set
- `SEGMENT1` — Commodity group value on the category

### `PART.ORACLE_UOM`

`MTL_UNITS_OF_MEASURE_TL` in Oracle EBS

- `UOM_CODE` — Unit of measure code held on the item
- `UNIT_OF_MEASURE` — Readable unit name

### `PART.ORACLE_PLANNING`

`MTL_SYSTEM_ITEMS_B` in Oracle EBS

- `PLANNING_MAKE_BUY_CODE` — Whether the part is made or bought
- `FULL_LEAD_TIME` — Total lead time in days
- `MIN_MINMAX_QUANTITY` — Reorder point where min max planning is used
- `MAX_MINMAX_QUANTITY` — Reorder up to level
- `FIXED_LOT_MULTIPLIER` — Order multiple applied by planning

### `PART.ORACLE_LIFECYCLE_STATUS`

`MTL_ITEM_STATUS` in Oracle EBS

- `INVENTORY_ITEM_STATUS_CODE` — Active, obsolete or engineering status
- `DISABLE_DATE` — Date the status was retired

### `PART.ORACLE_ONHAND`

`MTL_ONHAND_QUANTITIES_DETAIL` in Oracle EBS

- `INVENTORY_ITEM_ID` — Item the balance belongs to
- `ORGANIZATION_ID` — Plant holding the stock
- `TRANSACTION_QUANTITY` — Quantity on hand in the primary unit
- `SUBINVENTORY_CODE` — Storage location within the plant

### `PART.ORACLE_SUPPLIER_CROSSREF`

`MTL_CROSS_REFERENCES` in Oracle EBS

- `CROSS_REFERENCE` — Supplier part number carried against the item
- `CROSS_REFERENCE_TYPE` — Identifies the row as a supplier reference
- `INVENTORY_ITEM_ID` — Item the reference points at

### `PART.ORACLE_MATERIAL_TXN`

`MTL_MATERIAL_TRANSACTIONS` in Oracle EBS

- `TRANSACTION_TYPE_ID` — Issue, receipt or transfer classification
- `TRANSACTION_DATE` — When the movement happened
- `PRIMARY_QUANTITY` — Signed quantity moved

### `PART.TC_ITEM_IDENTITY`

`Item` in Teamcenter

- `item_id` — Engineering part number
- `object_name` — Part name as engineering maintains it
- `object_type` — Item subtype, for example a design or standard part
- `creation_date` — When engineering first created the part

### `PART.TC_REVISION`

`ItemRevision` in Teamcenter

- `item_revision_id` — Revision identifier such as A or B
- `object_desc` — Revision level description
- `last_mod_date` — Most recent change to the revision
- `items_tag` — Reference back to the owning item

### `PART.TC_MASTER_FORM`

`ItemMasterForm` in Teamcenter

- `IMAN_master_form` — Relation from the item to its master form
- `unit_of_measure` — Engineering unit of measure
- `make_buy` — Engineering view of make or buy

### `PART.TC_RELEASE_STATUS`

`ReleaseStatus` in Teamcenter

- `release_status_list` — Statuses applied to the revision
- `date_released` — When the revision was released

### `PART.TC_CLASSIFICATION`

`ICO` in Teamcenter

- `class_id` — Classification class the part is filed under
- `ico_id` — Classification object instance for the part
- `attribute_values` — Classified characteristics such as size or material

### `PART.TC_BOM_USAGE`

`BOMLine` in Teamcenter

- `bl_line_object` — The revision occupying the line
- `bl_quantity` — Quantity per parent assembly
- `bl_indented_title` — Position of the line in the structure

### `PART.TC_CHANGE_NOTICE`

`ChangeNoticeRevision` in Teamcenter

- `CMHasSolutionItem` — Revisions the change notice delivers
- `CMHasImpactedItem` — Revisions the change notice affects
- `date_released` — When the change was released

### `PART.TC_DATASET`

`Dataset` in Teamcenter

- `object_name` — Name of the attached model or drawing
- `ref_list` — Named references holding the files
- `last_mod_date` — When the attachment last changed

### `DUP.CLUSTER_MEMBERSHIP`

`MTL_SYSTEM_ITEMS_B` in Oracle EBS

- `SEGMENT1` — Part numbers grouped into a candidate cluster
- `INVENTORY_ITEM_ID` — Cluster member keys
- `ORGANIZATION_ID` — Plant each member sits in

### `DUP.CAUSE_COPY_PASTE`

`MTL_SYSTEM_ITEMS_TL` in Oracle EBS

- `DESCRIPTION` — Near identical description text between members
- `CREATION_DATE` — Close creation dates typical of a copied record

### `DUP.CAUSE_REVISION_ABUSE`

`ItemRevision` in Teamcenter

- `item_revision_id` — Revision created instead of a new part
- `object_desc` — Description change large enough to indicate a different part
- `CMHasSolutionItem` — Absence of a change notice delivering the revision

### `DUP.CAUSE_SUPPLIER_PART`

`MTL_CROSS_REFERENCES` in Oracle EBS

- `CROSS_REFERENCE` — Two internal parts carrying the same supplier number
- `CROSS_REFERENCE_TYPE` — Supplier reference type filter

### `DUP.CAUSE_ORG_SPLIT`

`MTL_SYSTEM_ITEMS_B` in Oracle EBS

- `ORGANIZATION_ID` — Members registered in different plants
- `SEGMENT1` — Different part numbers for the same physical part

### `DUP.DESCRIPTION_SIMILARITY`

`MTL_SYSTEM_ITEMS_TL` in Oracle EBS

- `DESCRIPTION` — Text compared between two candidate members
- `LONG_DESCRIPTION` — Used where the short description is truncated

### `DUP.SPEND_EXPOSURE`

`PO_LINES_ALL` in Oracle EBS

- `UNIT_PRICE` — Price paid on each member of the cluster
- `QUANTITY` — Quantity bought against each member
- `ITEM_ID` — Links the line back to the cluster member

### `SUP.MASTER`

`AP_SUPPLIERS` in Oracle EBS

- `VENDOR_ID` — Supplier key
- `VENDOR_NAME` — Supplier name
- `SEGMENT1` — Supplier number shown to buyers
- `ENABLED_FLAG` — Whether the supplier is active

### `SUP.SITE`

`AP_SUPPLIER_SITES_ALL` in Oracle EBS

- `VENDOR_SITE_ID` — Supplier site key
- `VENDOR_SITE_CODE` — Site code used on the purchase order
- `PURCHASING_SITE_FLAG` — Whether the site can be bought from

### `SUP.APPROVED_LIST`

`PO_APPROVED_SUPPLIER_LIST` in Oracle EBS

- `ITEM_ID` — Part the approval applies to
- `VENDOR_ID` — Approved supplier
- `ASL_STATUS_ID` — Approval status of the pairing
- `PROCESSING_LEAD_TIME` — Quoted lead time from the approved supplier

### `PO.HEADER`

`PO_HEADERS_ALL` in Oracle EBS

- `PO_HEADER_ID` — Purchase order key
- `SEGMENT1` — Purchase order number
- `VENDOR_ID` — Supplier the order was placed with
- `AUTHORIZATION_STATUS` — Approval state of the order

### `PO.LINE`

`PO_LINES_ALL` in Oracle EBS

- `PO_LINE_ID` — Order line key
- `ITEM_ID` — Part being bought
- `UNIT_PRICE` — Price agreed on the line
- `QUANTITY` — Quantity ordered
- `CREATION_DATE` — When the line was raised

### `PO.SHIPMENT`

`PO_LINE_LOCATIONS_ALL` in Oracle EBS

- `PROMISED_DATE` — Date the supplier committed to
- `NEED_BY_DATE` — Date the plant required the material
- `QUANTITY_RECEIVED` — Quantity received against the shipment

### `PO.DISTRIBUTION`

`PO_DISTRIBUTIONS_ALL` in Oracle EBS

- `CODE_COMBINATION_ID` — Account the spend is charged to
- `DESTINATION_ORGANIZATION_ID` — Plant receiving the material

### `REQ.HEADER`

`PO_REQUISITION_HEADERS_ALL` in Oracle EBS

- `REQUISITION_HEADER_ID` — Requisition key
- `SEGMENT1` — Requisition number
- `AUTHORIZATION_STATUS` — Where the requisition sits in approval

### `REQ.LINE`

`PO_REQUISITION_LINES_ALL` in Oracle EBS

- `LINE_TYPE_ID` — Requisition line type, goods or services
- `ITEM_ID` — The part being requested
- `QUANTITY` — How many, after order modifiers are applied
- `UNIT_MEAS_LOOKUP_CODE` — Unit of measure the quantity is expressed in
- `NEED_BY_DATE` — Date the material is required on site
- `SUGGESTED_VENDOR_ID` — Supplier proposed on the line
- `SUGGESTED_VENDOR_SITE_ID` — Supplier site the order would be placed against
- `UNIT_PRICE` — Contract price where one exists, otherwise last paid
- `CHARGE_ACCOUNT_ID` — Account the spend is charged to
- `DELIVER_TO_LOCATION_ID` — Where the material is delivered

### `REQ.IMPORT_INTERFACE`

`PO_REQUISITIONS_INTERFACE_ALL` in Oracle EBS

- `INTERFACE_SOURCE_CODE` — Marks the row as raised by the fabric rather than by a person
- `AUTHORIZATION_STATUS` — Set to an unapproved state on creation. This is what keeps a human in the loop
- `PROCESS_FLAG` — Whether the import has picked the row up yet
- `REQUISITION_TYPE` — Purchase requisition rather than internal

### `RFQ.REQUEST`

`PO_HEADERS_ALL` in Oracle EBS

- `TYPE_LOOKUP_CODE` — Marks the document as a request for quotation
- `QUOTE_TYPE_LOOKUP_CODE` — Whether the request is by quantity or by catalogue
- `RFQ_CLOSE_DATE` — Deadline the suppliers respond by
- `SEGMENT1` — Request number shown to buyers and suppliers

### `RFQ.QUOTATION`

`PO_LINES_ALL` in Oracle EBS

- `UNIT_PRICE` — Price the supplier quoted on the line
- `QUANTITY` — Quantity the supplier quoted for
- `VENDOR_ID` — Supplier the quotation came from
- `PAYMENT_TERMS_ID` — Terms offered with the quotation

### `RCV.TRANSACTION`

`RCV_TRANSACTIONS` in Oracle EBS

- `TRANSACTION_DATE` — When the material was received
- `QUANTITY` — Quantity received
- `PO_LINE_ID` — Order line the receipt satisfies

### `AP.INVOICE_MATCH`

`AP_INVOICE_LINES_ALL` in Oracle EBS

- `INVOICE_ID` — Invoice key
- `PO_LINE_ID` — Order line the invoice was matched to
- `UNIT_PRICE` — Price actually invoiced

### `SUP.OTD_PERFORMANCE`

`RCV_TRANSACTIONS` in Oracle EBS

- `TRANSACTION_DATE` — Receipt date
- `PROMISED_DATE` — Committed date from the shipment
- `VENDOR_ID` — Supplier being measured

### `SUP.PRICE_VARIANCE`

`PO_LINES_ALL` in Oracle EBS

- `UNIT_PRICE` — Price paid on each line
- `ITEM_ID` — Part the price applies to
- `VENDOR_ID` — Supplier the price was paid to

### `PRICE.COMMODITY_INDEX`

`PO_LINES_ALL` in Oracle EBS

- `UNIT_PRICE` — Price paid, weighted by quantity
- `QUANTITY` — Weighting for the index
- `CREATION_DATE` — Month the price applies to

### `MRO.ASSET_REGISTER`

`Asset register` in Oracle EBS · registered at object level, field names not asserted

- `asset identifier` — Whatever the maintenance system uses to identify an asset
- `asset description` — Readable description of the asset
- `operating location` — Plant or line the asset runs in
- `asset group` — Family the asset belongs to

### `MRO.ASSET_CRITICALITY`

`Asset attributes` in Oracle EBS · registered at object level, field names not asserted

- `criticality` — How much it matters when this asset stops
- `asset identifier` — The asset the attribute belongs to

### `MRO.WORK_ORDER`

`Maintenance work order` in Oracle EBS · registered at object level, field names not asserted

- `work order identifier` — Identifies the job
- `asset identifier` — The asset the job is raised against
- `status` — Whether the job is open, released or complete
- `scheduled start` — When the work is planned to begin

### `MRO.WORK_ORDER_MATERIAL`

`Work order material requirement` in Oracle EBS · registered at object level, field names not asserted

- `part required` — The spare the job needs
- `quantity required` — How many
- `date required` — When the part has to be on the job

### `MRO.METER_READING`

`Meter reading` in Oracle EBS · registered at object level, field names not asserted

- `meter` — The meter recorded against the asset
- `reading` — Latest value
- `reading date` — When it was taken

### `MRO.FAILURE_HISTORY`

`Failure record` in Oracle EBS · registered at object level, field names not asserted

- `failure classification` — How the failure was coded
- `asset identifier` — The asset that failed
- `failure date` — When it was recorded

### `MRO.CONDITION_SIGNAL`

`Asset condition` in Oracle EBS · registered at object level, field names not asserted

- `condition observation` — What the asset is reporting about itself
- `asset identifier` — The asset the observation belongs to

### `FABRIC.BRONZE_ORACLE`

`MTL_SYSTEM_ITEMS_B` in Oracle EBS

- `LAST_UPDATE_DATE` — Used to pick up changed rows on each load
- `INVENTORY_ITEM_ID` — Key carried through every layer unchanged

### `FABRIC.BRONZE_TEAMCENTER`

`Item` in Teamcenter

- `item_id` — Key carried through every layer unchanged
- `last_mod_date` — Used to pick up changed objects on each load

### `FABRIC.SILVER_PART_CONFORMED`

`MTL_SYSTEM_ITEMS_B` in Oracle EBS

- `SEGMENT1` — Matched against the engineering part number
- `INVENTORY_ITEM_ID` — Held alongside the engineering key

### `FABRIC.SILVER_TC_CONFORMED`

`ItemRevision` in Teamcenter

- `item_id` — Matched against the Oracle part number
- `item_revision_id` — Current released revision carried onto the conformed record

### `FABRIC.GOLD_PART_MASTER`

`MTL_SYSTEM_ITEMS_B` in Oracle EBS

- `SEGMENT1` — Part number presented to the business
- `DESCRIPTION` — Description presented to the business

### `FABRIC.GOLD_PROCUREMENT`

`PO_LINES_ALL` in Oracle EBS

- `PO_LINE_ID` — Grain of the procurement mart
- `UNIT_PRICE` — Price carried onto the mart

### `FABRIC.GOLD_MRO`

`MTL_EAM_ASSET_NUMBERS` in Oracle EBS

- `ASSET_NUMBER` — Grain of the reliability mart
- `CURRENT_ORGANIZATION_ID` — Plant the asset sits in

## Assumptions to confirm

These are the statements most worth arguing with.

- **`PART.ORACLE_IDENTITY`** — Part numbers are carried in SEGMENT1 rather than a concatenated segment structure.
- **`PART.ORACLE_DESCRIPTION`** — Only the base language row is in scope for this preview.
- **`PART.ORACLE_COMMODITY`** — One purchasing category set is authoritative for commodity reporting.
- **`PART.ORACLE_LIFECYCLE_STATUS`** — Locally defined status codes map cleanly onto three states.
- **`PART.ORACLE_SUPPLIER_CROSSREF`** — Supplier cross references are maintained rather than held only on the purchase order.
- **`PART.TC_ITEM_IDENTITY`** — A single item type hierarchy is in use for production parts.
- **`PART.TC_MASTER_FORM`** — Attributes of interest sit on the standard master form rather than a site specific extension.
- **`PART.TC_CLASSIFICATION`** — Classification coverage is partial and absence of a class is not evidence that parts differ.
- **`PART.TC_BOM_USAGE`** — The latest working structure is expanded rather than a released configuration.
- **`DUP.CLUSTER_MEMBERSHIP`** — A cluster is a candidate for review, not a decision. Nothing is merged automatically.
- **`DUP.CAUSE_REVISION_ABUSE`** — The material creation cycle is long enough that engineers have a standing incentive to avoid it. This needs confirming with the manufacturer.
- **`DUP.SPEND_EXPOSURE`** — Price differences between cluster members are treated as avoidable only where the members are genuinely the same part.
- **`SUP.APPROVED_LIST`** — The approved supplier list is maintained well enough to be the guard rail for automation. This is the assumption most worth testing early.
- **`PO.LINE`** — A single reporting currency is sufficient for this preview.
- **`REQ.LINE`** — Nothing is released to a supplier without a person approving it. Automation stops at the proposal.
- **`REQ.IMPORT_INTERFACE`** — This is the integration mechanism for the pre-populated mode only. The advisory mode needs none of it. Interface access, approval hierarchy mapping and an audit trail all have to be agreed before this mode is possible.
- **`RFQ.REQUEST`** — Whether requests are issued through the supplier portal or by another channel needs confirming with the manufacturer's sourcing team.
- **`RFQ.QUOTATION`** — The lead time a supplier offers on a quotation is taken at face value here. In practice it would be weighted by that supplier's delivery record.
- **`SUP.OTD_PERFORMANCE`** — Receipts without a committed date are excluded rather than counted as late.
- **`PRICE.COMMODITY_INDEX`** — One off and expedited buys are left in the index and are not treated separately.
- **`MRO.ASSET_REGISTER`** — The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted.
- **`MRO.ASSET_CRITICALITY`** — The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted. Whether criticality is recorded as an attribute at all, and on what scale, is the first thing to confirm.
- **`MRO.WORK_ORDER`** — The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted.
- **`MRO.WORK_ORDER_MATERIAL`** — The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted. The link from a work order to the part it consumes is the single most important thing to confirm, because the procurement signal is built on it.
- **`MRO.METER_READING`** — The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted. Whether readings are taken often enough for a rate to mean anything also needs checking.
- **`MRO.FAILURE_HISTORY`** — The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted. Coding discipline varies between crews, so coverage should be measured before this drives anything.
- **`MRO.CONDITION_SIGNAL`** — The maintenance system of record is assumed and requires confirmation. We do not know that the manufacturer runs the enterprise asset management module of the same instance. These objects are registered at object level only and no field name here is asserted. The weighting between the inputs is illustrative and would be set with the manufacturer's reliability engineers.
- **`FABRIC.BRONZE_ORACLE`** — Change capture is by last update date rather than by database log reading.
- **`FABRIC.BRONZE_TEAMCENTER`** — Extraction is through the service layer rather than direct database access.
- **`FABRIC.SILVER_PART_CONFORMED`** — Part numbers agree between the two systems for most parts. Where they do not the record is kept unmatched rather than forced.
