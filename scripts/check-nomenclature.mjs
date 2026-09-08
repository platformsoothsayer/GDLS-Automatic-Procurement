/**
 * Enforces the single source of nomenclature rule.
 *
 * /data/nomenclature.ts is the only file allowed to contain an Oracle EBS table or
 * column name, or a Teamcenter business object, service or property name. Everything
 * else imports by key. This check exists so the rule cannot quietly rot as screens
 * are added, and so a subject matter expert reviewing one file is reviewing all of it.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

const ROOT = process.cwd()
const ALLOWED = [
  "data/nomenclature.ts",
  "scripts/check-nomenclature.mjs",
  // Generated from the registry by scripts/nomenclature-review.ts. It is a rendering
  // of the one file, not a second copy of the names, and it is not deployed.
  "docs/nomenclature-review.md",
]
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "data/generated"])

const RULES = [
  {
    what: "Oracle EBS table or column name",
    // Module prefixed upper snake case identifiers, which is how the EBS schema names things.
    pattern: /\b(?:MTL|PO|AP|AR|GL|RCV|WIP|EAM|MRP|CST|INV|FND|BOM|ENG|OE|QA|CSI|HR)_[A-Z][A-Z0-9_]{2,}\b/g,
  },
  {
    what: "Teamcenter SOA service name",
    pattern: /\b(?:Core|Query|Cad|Structure|Classification|Workflow|ChangeManagement|BOM|Administration|Internal)-\d{4}-\d{2}-[A-Za-z]+\b/g,
  },
  {
    what: "Teamcenter business object name",
    pattern: /\b(?:ItemRevision|ItemMasterForm|BOMLine|ChangeNoticeRevision|ChangeRequestRevision|ReleaseStatus|MEProcess)\b/g,
  },
  {
    what: "Oracle EBS column name",
    // The appendix writes columns in lower snake case, so the upper case table
    // pattern above does not catch them. Only distinctive identifiers are listed;
    // bare words like "quantity" would be nothing but false positives.
    pattern: /\b(?:inventory_item_id|organization_id|organization_code|segment1|primary_uom_code|purchasing_item_flag|planner_code|buyer_id|full_lead_time|preprocessing_lead_time|processing_lead_time|postprocessing_lead_time|fixed_lot_multiplier|minimum_order_quantity|effectivity_date|implementation_date|cross_reference_type|cross_reference|category_set_id|uom_code|unit_of_measure|primary_transaction_quantity|vendor_id|vendor_name|vendor_site_id|vendor_site_code|org_id|asl_id|asl_status_id|min_order_qty|fixed_lot_multiple|requisition_header_id|requisition_line_id|authorization_status|unit_meas_lookup_code|need_by_date|suggested_vendor_id|unit_price|destination_organization_id|deliver_to_location_id|code_combination_id|po_header_id|po_line_id|type_lookup_code|promised_date|quantity_received|distribution_id|auction_header_id|close_bidding_date|bid_number|trading_partner_id|bid_status|bid_currency_unit_price)\b/g,
  },
  {
    what: "Teamcenter direct database access, which the appendix forbids outright",
    pattern: /\b(?:PPOM_[A-Za-z]|POM_[A-Za-z]|infodba\.|TCENG\.|plmxml_pom)/g,
  },
  {
    what: "Teamcenter property name",
    pattern: /\b(?:item_id|item_revision_id|object_name|object_desc|object_type|release_status_list|date_released|last_mod_date|items_tag|IMAN_master_form|bl_line_object|bl_quantity|bl_indented_title|bl_occ_type|ref_list|class_id|ico_id|attribute_values|owning_user|CMHasSolutionItem|CMHasImpactedItem)\b/g,
  },
]

/** Path separators differ between platforms. Compare on forward slashes always. */
const toPosix = (full) => relative(ROOT, full).split(sep).join("/")

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = toPosix(full)
    if (SKIP_DIRS.has(entry) || SKIP_DIRS.has(rel)) continue
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx|js|jsx|mjs|css|md)$/.test(entry)) out.push(rel)
  }
  return out
}

const violations = []
for (const file of walk(ROOT)) {
  if (ALLOWED.includes(file)) continue
  const lines = readFileSync(join(ROOT, file), "utf8").split("\n")
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      rule.pattern.lastIndex = 0
      for (const match of line.matchAll(rule.pattern)) {
        violations.push({ file, line: i + 1, what: rule.what, text: match[0] })
      }
    }
  })
}

if (violations.length) {
  console.error("Nomenclature rule violated. These belong in /data/nomenclature.ts only:\n")
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}  (${v.what})`)
  }
  console.error(`\n${violations.length} violation(s). Import from the registry by key instead.`)
  process.exit(1)
}

console.log("Nomenclature rule holds. Source system names appear only in /data/nomenclature.ts.")
