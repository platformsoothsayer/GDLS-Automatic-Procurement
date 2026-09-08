/**
 * Enforces the single source of nomenclature rule.
 *
 * /data/nomenclature.ts is the only file allowed to contain an Oracle EBS table or
 * column name, or a Teamcenter business object, service or property name. Everything
 * else imports by key. This check exists so the rule cannot quietly rot as screens
 * are added, and so a subject matter expert reviewing one file is reviewing all of it.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

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
    what: "Teamcenter property name",
    pattern: /\b(?:item_id|item_revision_id|object_name|object_desc|object_type|release_status_list|date_released|last_mod_date|items_tag|IMAN_master_form|bl_line_object|bl_quantity|bl_indented_title|bl_occ_type|ref_list|class_id|ico_id|attribute_values|CMHasSolutionItem|CMHasImpactedItem)\b/g,
  },
]

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = relative(ROOT, full)
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
