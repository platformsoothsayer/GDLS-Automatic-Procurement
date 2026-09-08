/**
 * Keeps the generated dataset out of the browser.
 *
 * lib/dataset.ts imports every generated JSON file, roughly six megabytes. Anything
 * that value imports a module which reaches it drags all of that into the client
 * bundle. Type only imports are erased at compile time and are fine.
 *
 * This exists because it happened: one client component imported a constant from
 * lib/procurement, and the procurement route shipped 808kB to the browser instead of
 * 121kB. Nothing about the screen looked wrong, which is why it needs a check.
 */

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

const ROOT = process.cwd()
const SKIP = new Set(["node_modules", ".next", ".git", "docs", "data/generated"])

/** Modules that reach the generated dataset. Server side only. */
const SERVER_ONLY = ["@/lib/dataset", "@/lib/parts", "@/lib/mro", "@/lib/fabric", "@/lib/procurement"]

/** Path separators differ between platforms. Compare on forward slashes always. */
const toPosix = (full) => relative(ROOT, full).split(sep).join("/")

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = toPosix(full)
    if (SKIP.has(entry) || SKIP.has(rel)) continue
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry)) out.push(rel)
  }
  return out
}

const violations = []
for (const file of walk(ROOT)) {
  const text = readFileSync(join(ROOT, file), "utf8")
  if (!/^\s*["']use client["']/m.test(text)) continue

  for (const mod of SERVER_ONLY) {
    // A value import. "import type { … }" and "import { type X }" are erased.
    const pattern = new RegExp(`import\\s+(?!type\\s)\\{([^}]*)\\}\\s+from\\s+["']${mod}["']`, "g")
    for (const match of text.matchAll(pattern)) {
      const named = match[1]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("type "))
      if (named.length) {
        violations.push({ file, mod, named: named.join(", ") })
      }
    }
  }
}

if (violations.length) {
  console.error("Client components must not value import a module that reaches the dataset:\n")
  for (const v of violations) {
    console.error(`  ${v.file}\n    imports { ${v.named} } from "${v.mod}"`)
  }
  console.error(
    "\nUse `import type` for types, or move the value into a content module under /data."
  )
  process.exit(1)
}

console.log("Client bundles clean. No client component reaches the generated dataset.")
