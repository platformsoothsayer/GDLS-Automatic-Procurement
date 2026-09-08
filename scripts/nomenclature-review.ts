/**
 * Generates the subject matter expert review artifact.
 *
 * Every registry entry, with the screens that use it, worked out by scanning the
 * codebase for the key rather than by hand, so the document cannot drift from the
 * code. Internal review only. It lives under /docs and is not part of the deployed
 * application.
 *
 *   npm run review
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, relative } from "node:path"
import {
  LAYER_LABEL,
  NOMENCLATURE,
  SOURCE_KEYS,
  SYSTEM_LABEL,
  VERIFIED_LABEL,
} from "../data/nomenclature"

const ROOT = process.cwd()
const SKIP = new Set(["node_modules", ".next", ".git", "docs", "data/generated"])

/** Which screen a file belongs to. A file can serve more than one. */
const SCREEN_OF: { match: RegExp; screens: string[] }[] = [
  { match: /screens\/problems|app\/problems|data\/problems\.ts/, screens: ["1 Problem selection"] },
  { match: /screens\/fabric|app\/fabric|data\/fabric-content\.ts/, screens: ["2 Fabric skeleton", "6 Fabric populated"] },
  { match: /lib\/fabric\.ts/, screens: ["2 Fabric skeleton", "6 Fabric populated", "7 What it takes"] },
  { match: /screens\/parts|app\/parts|lib\/parts\.ts|data\/parts-content\.ts/, screens: ["3 Part master intelligence"] },
  { match: /screens\/mro|app\/mro|lib\/mro\.ts/, screens: ["4 MRO signals"] },
  { match: /screens\/procurement|app\/procurement|lib\/procurement\.ts|data\/procurement-content\.ts/, screens: ["5 Automated procurement"] },
  { match: /screens\/engagement|app\/engagement|data\/engagement-content\.ts/, screens: ["7 What it takes"] },
]

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = relative(ROOT, full)
    if (SKIP.has(entry) || SKIP.has(rel)) continue
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(entry) && rel !== "data/nomenclature.ts") out.push(rel)
  }
  return out
}

const files = walk(ROOT).map((path) => ({ path, text: readFileSync(join(ROOT, path), "utf8") }))

function screensUsing(key: string): string[] {
  const needle = `"${key}"`
  const found = new Set<string>()
  for (const file of files) {
    if (!file.text.includes(needle)) continue
    for (const rule of SCREEN_OF) {
      if (rule.match.test(file.path)) rule.screens.forEach((s) => found.add(s))
    }
  }
  return [...found].sort()
}

const rows = SOURCE_KEYS.map((key) => {
  const entry = NOMENCLATURE[key]
  const screens = screensUsing(key)
  return { entry, screens }
})

const cell = (s: string) => s.replace(/\|/g, "\\|")

const lines: string[] = []
lines.push("# Nomenclature review")
lines.push("")
lines.push("Every source system mapping used by the preview, for subject matter expert review.")
lines.push("")
lines.push("**Internal review document. Not part of the deployed application.**")
lines.push("")
lines.push(
  "All mappings are a working draft. Nothing here has been confirmed against the manufacturer's own systems, which is why every entry reads `NEEDS_SME_REVIEW`. Correcting this file corrects the whole application: no screen names a source object directly, and a build fails if one tries."
)
lines.push("")
lines.push("Regenerate with `npm run review`. Do not edit by hand.")
lines.push("")

const objectLevel = rows.filter((r) => r.entry.granularity === "OBJECT")
lines.push("## How to read this")
lines.push("")
lines.push(`- **${rows.length} entries**, every one of them \`NEEDS_SME_REVIEW\` (${VERIFIED_LABEL.NEEDS_SME_REVIEW}).`)
lines.push(
  `- **${objectLevel.length} entries are registered at object level.** For those, the field names describe what is needed, not what the source calls it, because the source system itself is still an assumption. They are the maintenance entries and they are the ones to look at first.`
)
lines.push(
  `- **${rows.filter((r) => r.entry.assumption).length} entries carry an explicit assumption.** Those are listed again in full at the end.`
)
const unusedRows = rows.filter((r) => r.screens.length === 0)
lines.push(
  `- **${unusedRows.length} entries are registered but not yet read by any screen**, marked _not yet used_ below. They are mappings the build will need and are worth reviewing, but nothing currently depends on them being right.`
)
lines.push("")

lines.push("## Every entry")
lines.push("")
lines.push("| Key | System | Object | Level | Layer | Fields | Transform | Used on |")
lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |")
for (const { entry, screens } of rows) {
  const object = entry.service ? `\`${entry.object}\`<br>SOA \`${entry.service}\`` : `\`${entry.object}\``
  const level = entry.granularity === "OBJECT" ? "**Object**" : "Field"
  const layer = entry.mart
    ? `${LAYER_LABEL[entry.layer]}<br>\`${entry.mart}\``
    : LAYER_LABEL[entry.layer]
  const fields = entry.fields.map((f) => `\`${f.name}\``).join("<br>")
  lines.push(
    `| \`${entry.key}\` | ${SYSTEM_LABEL[entry.system]} | ${object} | ${level} | ${layer} | ${fields} | ${cell(entry.transform)} | ${screens.length ? screens.join("<br>") : "_not yet used_"} |`
  )
}
lines.push("")

lines.push("## Field notes")
lines.push("")
lines.push("What each field is for, in the words a reviewer would use.")
lines.push("")
for (const { entry } of rows) {
  lines.push(`### \`${entry.key}\``)
  lines.push("")
  lines.push(`\`${entry.object}\` in ${SYSTEM_LABEL[entry.system]}${entry.granularity === "OBJECT" ? " · registered at object level, field names not asserted" : ""}`)
  lines.push("")
  for (const field of entry.fields) lines.push(`- \`${field.name}\` — ${field.note}`)
  lines.push("")
}

lines.push("## Assumptions to confirm")
lines.push("")
lines.push("These are the statements most worth arguing with.")
lines.push("")
for (const { entry } of rows.filter((r) => r.entry.assumption)) {
  lines.push(`- **\`${entry.key}\`** — ${entry.assumption}`)
}
lines.push("")

writeFileSync(join(ROOT, "docs", "nomenclature-review.md"), lines.join("\n"), "utf8")

const unused = rows.filter((r) => r.screens.length === 0).map((r) => r.entry.key)
console.log(`docs/nomenclature-review.md written: ${rows.length} entries`)
console.log(`object level: ${objectLevel.length} · with assumptions: ${rows.filter((r) => r.entry.assumption).length}`)
if (unused.length) console.log(`registered but not used on any screen: ${unused.join(", ")}`)
