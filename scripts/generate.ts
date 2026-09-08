/**
 * Deterministic dataset generation.
 *
 * Run at build time. Writes static JSON into /data/generated. Nothing in the
 * application generates data at runtime. Re parsing the same seed must produce
 * byte identical files, so there is no Math.random, no Date.now and no locale
 * dependent formatting below.
 *
 * All data is illustrative. It describes a fictional heavy manufacturer and is
 * not connected to any production system.
 */

import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { Rng } from "../lib/prng"
import type {
  CommodityGroup,
  DatasetMeta,
  DuplicateCause,
  DuplicateCluster,
  EngineeringPart,
  EngineeringRevision,
  InventoryOrg,
  MaintainableAsset,
  OrgId,
  PartRecord,
  PricePoint,
  PurchaseOrderLine,
  Requisition,
  Supplier,
} from "../lib/domain"

const SEED = 0x5eed1f4b
const OUT_DIR = join(process.cwd(), "data", "generated")

const DAY = 86_400_000
const PERIOD_START = Date.UTC(2024, 9, 1) // 2024-10-01
const PERIOD_END = Date.UTC(2026, 8, 30) // 2026-09-30
const AS_OF = Date.UTC(2026, 8, 1) // 2026-09-01

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const monthKey = (ms: number) => new Date(ms).toISOString().slice(0, 7)

const MONTHS: string[] = (() => {
  const out: string[] = []
  for (let i = 0; i < 24; i++) out.push(monthKey(Date.UTC(2024, 9 + i, 1)))
  return out
})()

/* ------------------------------------------------------------------ *
 * Reference data
 * ------------------------------------------------------------------ */

const ORGS: InventoryOrg[] = [
  { orgId: 101, orgCode: "PLT-N01", orgName: "Northern Assembly Plant", orgRole: "ASSEMBLY" },
  { orgId: 102, orgCode: "PLT-S02", orgName: "Southern Fabrication Plant", orgRole: "FABRICATION" },
  { orgId: 103, orgCode: "PLT-C03", orgName: "Central Machining Plant", orgRole: "MACHINING" },
  { orgId: 104, orgCode: "DEP-M04", orgName: "Sustainment Depot", orgRole: "DEPOT" },
]

type CommoditySpec = CommodityGroup & {
  nouns: string[]
  forms: string[]
  materials: string[]
  finishes: string[]
  uom: string
}

const COMMODITIES: CommoditySpec[] = [
  { code: "FSTN", name: "Fasteners", baseUnitCost: 2.4, uom: "EA",
    nouns: ["BOLT", "SCREW", "NUT", "WASHER", "STUD", "PIN"],
    forms: ["HEX HEAD", "SOCKET HEAD", "FLANGE", "CAP", "SHOULDER", "SELF LOCKING"],
    materials: ["GRADE 8.8 STEEL", "GRADE 10.9 STEEL", "STAINLESS 316", "ALLOY STEEL"],
    finishes: ["ZINC PLATED", "PHOSPHATE", "PASSIVATED", "BLACK OXIDE"] },
  { code: "BRNG", name: "Bearings", baseUnitCost: 68, uom: "EA",
    nouns: ["BEARING", "BUSHING", "RACE", "ROLLER"],
    forms: ["DEEP GROOVE", "TAPERED ROLLER", "SPHERICAL", "NEEDLE", "THRUST"],
    materials: ["CHROME STEEL", "STAINLESS", "BRONZE", "CERAMIC HYBRID"],
    finishes: ["SEALED", "SHIELDED", "OPEN", "GREASE PACKED"] },
  { code: "HYDR", name: "Hydraulics", baseUnitCost: 190, uom: "EA",
    nouns: ["CYLINDER", "VALVE", "PUMP", "HOSE", "MANIFOLD", "FITTING"],
    forms: ["DOUBLE ACTING", "PROPORTIONAL", "GEAR TYPE", "HIGH PRESSURE", "SWIVEL"],
    materials: ["CARBON STEEL", "DUCTILE IRON", "ALUMINIUM", "NITRILE LINED"],
    finishes: ["CHROME ROD", "PAINTED", "ANODISED", "UNCOATED"] },
  { code: "PNEU", name: "Pneumatics", baseUnitCost: 84, uom: "EA",
    nouns: ["ACTUATOR", "REGULATOR", "SOLENOID", "FILTER", "COUPLING"],
    forms: ["SINGLE ACTING", "TWO STAGE", "INLINE", "QUICK RELEASE"],
    materials: ["ALUMINIUM", "BRASS", "POLYMER", "STAINLESS"],
    finishes: ["ANODISED", "NICKEL PLATED", "UNCOATED"] },
  { code: "ELEC", name: "Electrical Components", baseUnitCost: 47, uom: "EA",
    nouns: ["RELAY", "CONNECTOR", "SWITCH", "SENSOR", "BREAKER", "TERMINAL"],
    forms: ["PANEL MOUNT", "CIRCULAR", "SEALED", "PUSH BUTTON", "INDUCTIVE"],
    materials: ["THERMOPLASTIC", "ALUMINIUM SHELL", "COPPER ALLOY"],
    finishes: ["GOLD PLATED", "TIN PLATED", "OLIVE DRAB", "UNPLATED"] },
  { code: "HRNS", name: "Wire Harness", baseUnitCost: 320, uom: "EA",
    nouns: ["HARNESS", "CABLE", "LOOM", "JUMPER"],
    forms: ["MAIN", "BRANCH", "POWER", "SIGNAL", "GROUND"],
    materials: ["COPPER 18 AWG", "COPPER 14 AWG", "TINNED COPPER"],
    finishes: ["BRAIDED SLEEVE", "CONVOLUTED", "HEAT SHRUNK"] },
  { code: "CAST", name: "Castings", baseUnitCost: 410, uom: "EA",
    nouns: ["HOUSING", "COVER", "BRACKET", "MANIFOLD", "END CAP"],
    forms: ["SAND CAST", "INVESTMENT CAST", "DIE CAST", "SHELL MOULDED"],
    materials: ["GREY IRON", "DUCTILE IRON", "ALUMINIUM A356", "STEEL WCB"],
    finishes: ["MACHINED", "AS CAST", "PRIMED", "SHOT BLASTED"] },
  { code: "FORG", name: "Forgings", baseUnitCost: 560, uom: "EA",
    nouns: ["SHAFT", "YOKE", "LEVER", "HUB", "LINK"],
    forms: ["CLOSED DIE", "OPEN DIE", "UPSET", "ROLLED RING"],
    materials: ["4140 STEEL", "4340 STEEL", "17-4 PH", "TITANIUM"],
    finishes: ["NORMALISED", "QUENCHED AND TEMPERED", "ROUGH MACHINED"] },
  { code: "MACH", name: "Machined Components", baseUnitCost: 275, uom: "EA",
    nouns: ["PLATE", "SPACER", "ADAPTER", "FLANGE", "GUIDE", "RETAINER"],
    forms: ["TURNED", "MILLED", "GROUND", "BORED", "BROACHED"],
    materials: ["ALUMINIUM 7075", "ALUMINIUM 6061", "1045 STEEL", "STAINLESS 304"],
    finishes: ["ANODISED", "PASSIVATED", "PAINTED", "AS MACHINED"] },
  { code: "SEAL", name: "Seals and Gaskets", baseUnitCost: 18, uom: "EA",
    nouns: ["SEAL", "GASKET", "O RING", "WIPER", "BOOT"],
    forms: ["ROTARY", "STATIC", "FACE", "LIP", "DUST"],
    materials: ["NITRILE", "VITON", "PTFE", "SILICONE", "EPDM"],
    finishes: ["MOULDED", "DIE CUT", "BONDED"] },
  { code: "STRC", name: "Structural Steel", baseUnitCost: 730, uom: "EA",
    nouns: ["BEAM", "CHANNEL", "GUSSET", "FRAME", "CROSSMEMBER"],
    forms: ["WELDED", "BOLTED", "FORMED", "LASER CUT"],
    materials: ["A36 STEEL", "HSLA STEEL", "ABRASION RESISTANT PLATE"],
    finishes: ["PRIMED", "GALVANISED", "PAINTED", "MILL FINISH"] },
  { code: "COAT", name: "Coatings and Chemicals", baseUnitCost: 96, uom: "LT",
    nouns: ["PRIMER", "TOPCOAT", "SEALANT", "ADHESIVE", "LUBRICANT"],
    forms: ["TWO PART", "SINGLE PART", "AEROSOL", "BULK"],
    materials: ["EPOXY", "POLYURETHANE", "SILICONE", "SYNTHETIC"],
    finishes: ["MATT", "SATIN", "GLOSS", "CLEAR"] },
]

const SUPPLIER_PREFIX = ["Meridian", "Halcyon", "Ironvale", "Northbridge", "Kestrel", "Granite",
  "Cobalt", "Summit", "Redstone", "Lakeshore", "Pinnacle", "Vantage", "Ridgeline", "Copperfield",
  "Sterling", "Eastgate", "Windrow", "Brightwater", "Alderpoint", "Foundrygate"]
const SUPPLIER_MID = ["Forge", "Machine", "Precision", "Industrial", "Metalworks", "Components",
  "Fabrication", "Bearing", "Hydraulic", "Electrical", "Castings", "Fastener", "Tooling",
  "Systems", "Alloys", "Sealing"]
const SUPPLIER_SUFFIX = ["Co.", "Group", "Works", "Industries", "Partners", "Holdings"]

const ASSET_GROUPS = ["CNC MACHINING CENTRE", "HYDRAULIC PRESS", "OVERHEAD CRANE", "PAINT BOOTH",
  "WELDING CELL", "HEAT TREAT FURNACE", "CONVEYOR LINE", "AIR COMPRESSOR", "TEST RIG",
  "MATERIAL HANDLER"]

/* ------------------------------------------------------------------ *
 * Generation
 * ------------------------------------------------------------------ */

const rng = new Rng(SEED)

// --- suppliers -----------------------------------------------------
const supplierNames: string[] = []
{
  const seen = new Set<string>()
  const names = new Rng(SEED ^ 0x11)
  while (supplierNames.length < 320) {
    const n = `${names.pick(SUPPLIER_PREFIX)} ${names.pick(SUPPLIER_MID)} ${names.pick(SUPPLIER_SUFFIX)}`
    if (!seen.has(n)) {
      seen.add(n)
      supplierNames.push(n)
    }
  }
}

const suppliers: Supplier[] = supplierNames.map((supplierName, i) => {
  const commodity = COMMODITIES[i % COMMODITIES.length].code
  return {
    supplierId: `SUP-${String(10_000 + i)}`,
    supplierNumber: `V${String(400_000 + i * 7)}`,
    supplierName,
    primaryCommodity: commodity,
    siteCount: rng.int(1, 4),
    active: rng.bool(0.91),
    onTimeDeliveryPct: rng.normal(58, 99, 1),
    qualityDefectPpm: rng.int(40, 4200),
    approvedPartCount: 0,
    spend24m: 0,
  }
})
const supplierById = new Map(suppliers.map((s) => [s.supplierId, s]))

// --- parts ---------------------------------------------------------
function describe(c: CommoditySpec, r: Rng): string {
  const size = r.bool(0.5) ? `M${r.int(4, 30)} X ${r.int(10, 180)}` : `${r.int(10, 400)} MM`
  return [r.pick(c.nouns), r.pick(c.forms), size, r.pick(c.materials), r.pick(c.finishes)].join(", ")
}

const parts: PartRecord[] = []
const usedPartNumbers = new Set<string>()

for (let i = 0; i < 2400; i++) {
  const commodity = COMMODITIES[rng.int(0, COMMODITIES.length - 1)]
  let partNumber = ""
  do {
    partNumber = `${rng.int(1_000_000, 9_999_999)}-${String(rng.int(1, 999)).padStart(3, "0")}`
  } while (usedPartNumbers.has(partNumber))
  usedPartNumbers.add(partNumber)

  const makeBuy = rng.weighted([
    { value: "BUY" as const, weight: 72 },
    { value: "MAKE" as const, weight: 28 },
  ])
  const unitCost = Math.round(commodity.baseUnitCost * rng.float(0.45, 2.6, 3) * 100) / 100

  parts.push({
    partKey: `P-${String(i + 1).padStart(6, "0")}`,
    partNumber,
    orgId: rng.weighted([
      { value: 101 as OrgId, weight: 34 },
      { value: 102 as OrgId, weight: 27 },
      { value: 103 as OrgId, weight: 24 },
      { value: 104 as OrgId, weight: 15 },
    ]),
    description: describe(commodity, rng),
    commodity: commodity.code,
    itemType: makeBuy === "BUY" ? "PURCHASED" : rng.bool(0.9) ? "MANUFACTURED" : "PHANTOM",
    makeBuy,
    unitOfMeasure: commodity.uom,
    lifecycleStatus: rng.weighted([
      { value: "ACTIVE" as const, weight: 78 },
      { value: "RESTRICTED" as const, weight: 12 },
      { value: "OBSOLETE" as const, weight: 10 },
    ]),
    leadTimeDays: rng.int(5, 210),
    reorderPoint: rng.int(0, 240),
    reorderUpTo: 0,
    onHandQty: rng.int(0, 1800),
    unitCost,
    spend24m: 0,
    createdOn: iso(Date.UTC(2009, 0, 1) + rng.int(0, 6100) * DAY),
    supplierPartRef: null,
    primarySupplierId: null,
    engineeringItemId: null,
    duplicateClusterId: null,
  })
}

for (const p of parts) {
  p.reorderUpTo = p.reorderPoint + rng.int(20, 500)
  if (p.makeBuy === "BUY") {
    const candidates = suppliers.filter((s) => s.primaryCommodity === p.commodity && s.active)
    const s = candidates.length ? candidates[rng.int(0, candidates.length - 1)] : rng.pick(suppliers)
    p.primarySupplierId = s.supplierId
    p.supplierPartRef = rng.bool(0.62)
      ? `${String.fromCharCode(65 + rng.int(0, 25))}${String.fromCharCode(65 + rng.int(0, 25))}-${rng.int(10_000, 99_999)}`
      : null
    s.approvedPartCount += 1
  }
}
const partByKey = new Map(parts.map((p) => [p.partKey, p]))

// --- engineering parts ---------------------------------------------
const REV_LETTERS = "ABCDEFGH".split("")
const engineeringParts: EngineeringPart[] = []
{
  const engineered = rng.sample(parts, 1850)
  for (const p of engineered) {
    const revCount = rng.weighted([
      { value: 1, weight: 30 }, { value: 2, weight: 28 }, { value: 3, weight: 20 },
      { value: 4, weight: 12 }, { value: 5, weight: 6 }, { value: 6, weight: 4 },
    ])
    const revisions: EngineeringRevision[] = []
    let cursor = Date.UTC(2011, 0, 1) + rng.int(0, 3800) * DAY
    for (let r = 0; r < revCount; r++) {
      cursor += rng.int(60, 900) * DAY
      const hasChangeNotice = rng.bool(0.74)
      revisions.push({
        revisionId: REV_LETTERS[r],
        description: r === 0 ? "Initial release" : `Revision ${REV_LETTERS[r]} of the released definition`,
        releasedOn: rng.bool(0.88) ? iso(Math.min(cursor, AS_OF)) : null,
        changeNoticeId: hasChangeNotice ? `CN-${rng.int(100_000, 999_999)}` : null,
      })
    }
    const current = revisions[revisions.length - 1]
    const engineeringItemId = `E${p.partNumber.replace("-", "")}`
    p.engineeringItemId = engineeringItemId
    engineeringParts.push({
      engineeringItemId,
      objectName: p.description,
      objectType: p.makeBuy === "BUY" ? "PurchasedPart" : rng.bool(0.7) ? "DesignPart" : "StandardPart",
      classificationClass: `CLS-${p.commodity}-${String(rng.int(1, 40)).padStart(3, "0")}`,
      currentRevisionId: current.revisionId,
      released: current.releasedOn !== null,
      revisions,
      bomUsageCount: rng.weighted([
        { value: 0, weight: 14 }, { value: rng.int(1, 3), weight: 42 },
        { value: rng.int(4, 12), weight: 32 }, { value: rng.int(13, 60), weight: 12 },
      ]),
      lastModifiedOn: iso(Math.min(cursor, AS_OF)),
      oraclePartNumber: p.partNumber,
    })
  }
}
const engineeringById = new Map(engineeringParts.map((e) => [e.engineeringItemId, e]))

// --- duplicate clusters ---------------------------------------------
const ABBREV: [string, string][] = [
  ["STAINLESS", "SS"], ["HEX HEAD", "HH"], ["ALUMINIUM", "ALUM"], ["ASSEMBLY", "ASSY"],
  ["BRACKET", "BRKT"], ["PLATED", "PLT"], ["PRESSURE", "PRESS"], ["DOUBLE ACTING", "DBL ACT"],
  ["GRADE", "GR"], ["STEEL", "STL"],
]

function vary(desc: string, r: Rng): string {
  let out = desc
  const mode = r.int(0, 3)
  if (mode === 0) {
    for (const [long, short] of ABBREV) out = out.split(long).join(short)
  } else if (mode === 1) {
    out = out.replace(/, /g, " ")
  } else if (mode === 2) {
    const tokens = out.split(", ")
    if (tokens.length > 2) {
      const t = tokens.slice()
      const last = t.pop()!
      t.splice(1, 0, last)
      out = t.join(", ")
    }
  } else {
    out = `${out} ALT`
  }
  return out
}

const CAUSE_PLAN: { cause: DuplicateCause; count: number }[] = [
  { cause: "COPY_PASTE_VARIATION", count: 56 },
  { cause: "REVISION_ABUSE", count: 35 },
  { cause: "SUPPLIER_PART_NUMBER", count: 28 },
  { cause: "ORG_REGISTRATION_SPLIT", count: 21 },
]

const duplicateClusters: DuplicateCluster[] = []
{
  const pool = rng.shuffle(parts.filter((p) => p.duplicateClusterId === null))
  let cursor = 0
  const take = () => pool[cursor++]
  let clusterIndex = 0

  for (const plan of CAUSE_PLAN) {
    for (let c = 0; c < plan.count; c++) {
      const size = rng.weighted([
        { value: 2, weight: 52 }, { value: 3, weight: 27 },
        { value: 4, weight: 14 }, { value: 5, weight: 7 },
      ])
      const clusterId = `DUP-${String(++clusterIndex).padStart(4, "0")}`
      const seedPart = take()
      const members = [seedPart]

      for (let m = 1; m < size; m++) {
        const sib = take()
        sib.commodity = seedPart.commodity
        sib.unitOfMeasure = seedPart.unitOfMeasure
        sib.unitCost = Math.round(seedPart.unitCost * rng.float(0.82, 1.34, 3) * 100) / 100

        switch (plan.cause) {
          case "COPY_PASTE_VARIATION":
            sib.description = vary(seedPart.description, rng)
            sib.orgId = seedPart.orgId
            break
          case "REVISION_ABUSE":
            sib.description = `${vary(seedPart.description, rng)} REV ${REV_LETTERS[m]}`
            sib.orgId = seedPart.orgId
            sib.engineeringItemId = seedPart.engineeringItemId
            break
          case "SUPPLIER_PART_NUMBER":
            sib.description = vary(seedPart.description, rng)
            sib.primarySupplierId = seedPart.primarySupplierId
            sib.supplierPartRef =
              seedPart.supplierPartRef ??
              `${String.fromCharCode(65 + rng.int(0, 25))}${String.fromCharCode(65 + rng.int(0, 25))}-${rng.int(10_000, 99_999)}`
            seedPart.supplierPartRef = sib.supplierPartRef
            break
          case "ORG_REGISTRATION_SPLIT": {
            sib.description = seedPart.description
            const others = ORGS.filter((o) => !members.some((mm) => mm.orgId === o.orgId))
            sib.orgId = (others.length ? rng.pick(others) : rng.pick(ORGS)).orgId
            break
          }
        }
        members.push(sib)
      }

      for (const m of members) m.duplicateClusterId = clusterId

      const similarity =
        plan.cause === "ORG_REGISTRATION_SPLIT" ? rng.float(0.93, 0.995, 3)
        : plan.cause === "SUPPLIER_PART_NUMBER" ? rng.float(0.78, 0.93, 3)
        : plan.cause === "REVISION_ABUSE" ? rng.float(0.71, 0.9, 3)
        : rng.float(0.84, 0.98, 3)

      const costs = members.map((m) => m.unitCost)
      const low = Math.min(...costs)
      const high = Math.max(...costs)

      duplicateClusters.push({
        clusterId,
        cause: plan.cause,
        memberPartKeys: members.map((m) => m.partKey),
        memberCount: members.length,
        similarityScore: similarity,
        combinedSpend24m: 0,
        priceSpreadPct: Math.round(((high - low) / low) * 1000) / 10,
        recommendedSurvivorPartKey: members
          .slice()
          .sort((a, b) => a.createdOn.localeCompare(b.createdOn) || a.partKey.localeCompare(b.partKey))[0].partKey,
        orgSpread: Array.from(new Set(members.map((m) => m.orgId))).sort((a, b) => a - b) as OrgId[],
        reviewState: "UNREVIEWED",
      })
    }
  }
}

// --- purchase order lines -------------------------------------------
const buyableParts = parts.filter((p) => p.makeBuy === "BUY" && p.primarySupplierId)
const commodityDrift = new Map<string, number[]>()
for (const c of COMMODITIES) {
  const drift: number[] = []
  let level = 1
  const trend = rng.float(-0.004, 0.012, 5)
  for (let m = 0; m < 24; m++) {
    level = level * (1 + trend) + rng.float(-0.018, 0.018, 5)
    drift.push(Math.round(level * 10_000) / 10_000)
  }
  commodityDrift.set(c.code, drift)
}

const purchaseOrderLines: PurchaseOrderLine[] = []
{
  let poCounter = 0
  let lineCounter = 0
  while (purchaseOrderLines.length < 5600) {
    const monthIndex = rng.int(0, 23)
    const orderedMs = Date.UTC(2024, 9 + monthIndex, rng.int(1, 28))
    const poNumber = `PO-${String(820_000 + ++poCounter)}`
    const seedPart = buyableParts[rng.int(0, buyableParts.length - 1)]
    const supplierId = seedPart.primarySupplierId!
    const lineCount = Math.min(rng.int(1, 5), 5600 - purchaseOrderLines.length)

    for (let l = 0; l < lineCount; l++) {
      const part =
        l === 0
          ? seedPart
          : buyableParts.filter((p) => p.primarySupplierId === supplierId)[
              rng.int(0, Math.max(0, buyableParts.filter((p) => p.primarySupplierId === supplierId).length - 1))
            ] ?? seedPart
      const supplier = supplierById.get(supplierId)!
      const drift = commodityDrift.get(part.commodity)![monthIndex]
      const unitPrice = Math.round(part.unitCost * drift * rng.float(0.88, 1.19, 4) * 100) / 100
      const quantity = rng.weighted([
        { value: rng.int(1, 10), weight: 40 },
        { value: rng.int(11, 120), weight: 42 },
        { value: rng.int(121, 900), weight: 18 },
      ])
      const leadDays = rng.int(Math.max(5, part.leadTimeDays - 20), part.leadTimeDays + 25)
      const needByMs = orderedMs + leadDays * DAY
      const promisedMs = needByMs + rng.int(-6, 10) * DAY
      const onTime = rng.unit() * 100 < supplier.onTimeDeliveryPct
      const receivedMs = promisedMs + (onTime ? -rng.int(0, 5) : rng.int(1, 34)) * DAY
      const received = receivedMs <= AS_OF

      purchaseOrderLines.push({
        poLineKey: `POL-${String(++lineCounter).padStart(6, "0")}`,
        poNumber,
        lineNumber: l + 1,
        partKey: part.partKey,
        partNumber: part.partNumber,
        supplierId,
        orgId: part.orgId,
        commodity: part.commodity,
        quantity,
        unitPrice,
        lineValue: Math.round(unitPrice * quantity * 100) / 100,
        orderedOn: iso(orderedMs),
        needByOn: iso(needByMs),
        promisedOn: iso(promisedMs),
        receivedOn: received ? iso(receivedMs) : null,
        daysLate: received ? Math.round((receivedMs - promisedMs) / DAY) : null,
        status: received ? (rng.bool(0.7) ? "CLOSED" : "RECEIVED") : rng.bool(0.94) ? "OPEN" : "CANCELLED",
      })
    }
  }
}

// --- spend rollups ---------------------------------------------------
for (const line of purchaseOrderLines) {
  if (line.status === "CANCELLED") continue
  const p = partByKey.get(line.partKey)
  if (p) p.spend24m = Math.round((p.spend24m + line.lineValue) * 100) / 100
  const s = supplierById.get(line.supplierId)
  if (s) s.spend24m = Math.round((s.spend24m + line.lineValue) * 100) / 100
}
for (const cluster of duplicateClusters) {
  cluster.combinedSpend24m =
    Math.round(cluster.memberPartKeys.reduce((sum, k) => sum + (partByKey.get(k)?.spend24m ?? 0), 0) * 100) / 100
}

// --- price history ---------------------------------------------------
const pricePoints: PricePoint[] = []
for (const c of COMMODITIES) {
  const drift = commodityDrift.get(c.code)!
  let baseline = 0
  MONTHS.forEach((month, m) => {
    const lines = purchaseOrderLines.filter((l) => l.commodity === c.code && l.orderedOn.slice(0, 7) === month)
    const volume = lines.reduce((s, l) => s + l.quantity, 0)
    const value = lines.reduce((s, l) => s + l.lineValue, 0)
    const avg = volume > 0 ? value / volume : c.baseUnitCost * drift[m]
    if (m === 0) baseline = avg
    pricePoints.push({
      commodity: c.code,
      month,
      index: Math.round((avg / baseline) * 1000) / 10,
      weightedAvgUnitPrice: Math.round(avg * 100) / 100,
      volume,
    })
  })
}

// --- maintainable assets ---------------------------------------------
const assets: MaintainableAsset[] = []
for (let i = 0; i < 210; i++) {
  const group = rng.pick(ASSET_GROUPS)
  const criticality = rng.weighted([
    { value: "HIGH" as const, weight: 24 },
    { value: "MEDIUM" as const, weight: 45 },
    { value: "LOW" as const, weight: 31 },
  ])
  const conditionScore = rng.normal(18, 99, 1)
  const failures12m = rng.weighted([
    { value: 0, weight: 38 }, { value: rng.int(1, 2), weight: 34 },
    { value: rng.int(3, 6), weight: 20 }, { value: rng.int(7, 14), weight: 8 },
  ])
  const critWeight = criticality === "HIGH" ? 1 : criticality === "MEDIUM" ? 0.6 : 0.3
  const lastServicedMs = AS_OF - rng.int(5, 640) * DAY
  const signalScore =
    Math.round(((100 - conditionScore) * 0.45 + Math.min(failures12m, 14) * 3.2 + critWeight * 22) * 10) / 10

  assets.push({
    assetNumber: `AST-${String(3000 + i * 3)}`,
    description: `${group} ${String(rng.int(1, 40)).padStart(2, "0")}`,
    orgId: rng.pick(ORGS).orgId,
    assetGroup: group,
    criticality,
    conditionScore,
    meterReading: rng.int(1200, 96_000),
    meterRatePerDay: rng.float(1.2, 22, 1),
    failures12m,
    lastServicedOn: iso(lastServicedMs),
    nextServiceDueOn: iso(lastServicedMs + rng.int(90, 400) * DAY),
    consumesPartKeys: rng.sample(buyableParts, rng.int(3, 8)).map((p) => p.partKey),
    signalScore,
    signalBand: signalScore >= 62 ? "ATTENTION" : signalScore >= 42 ? "WATCH" : "HEALTHY",
  })
}
assets.sort((a, b) => b.signalScore - a.signalScore || a.assetNumber.localeCompare(b.assetNumber))

// --- requisitions -----------------------------------------------------
const requisitions: Requisition[] = []
for (let i = 0; i < 480; i++) {
  const part = buyableParts[rng.int(0, buyableParts.length - 1)]
  const raisedMs = AS_OF - rng.int(0, 180) * DAY
  const quantity = rng.int(1, 400)
  const origin = rng.weighted([
    { value: "SYSTEM_PROPOSED" as const, weight: 56 },
    { value: "BUYER_RAISED" as const, weight: 44 },
  ])
  const supplier = part.primarySupplierId ? supplierById.get(part.primarySupplierId) : undefined
  const blocked =
    part.lifecycleStatus === "OBSOLETE"
      ? "Part is obsolete in the item master"
      : !supplier?.active
        ? "No active approved supplier for this part"
        : part.duplicateClusterId
          ? "Part sits in an unresolved duplicate cluster"
          : null

  requisitions.push({
    requisitionNumber: `REQ-${String(51_000 + i * 3)}`,
    partKey: part.partKey,
    partNumber: part.partNumber,
    quantity,
    needByOn: iso(raisedMs + rng.int(10, 160) * DAY),
    raisedOn: iso(raisedMs),
    suggestedSupplierId: part.primarySupplierId,
    estimatedValue: Math.round(part.unitCost * quantity * 100) / 100,
    demandSource: rng.weighted([
      { value: "MRO_WORK_ORDER" as const, weight: 31 },
      { value: "MIN_MAX_REPLENISHMENT" as const, weight: 38 },
      { value: "FORECAST" as const, weight: 17 },
      { value: "MANUAL" as const, weight: 14 },
    ]),
    origin,
    status: blocked
      ? "DRAFT"
      : rng.weighted([
          { value: "DRAFT" as const, weight: 22 },
          { value: "PENDING_APPROVAL" as const, weight: 30 },
          { value: "APPROVED" as const, weight: 26 },
          { value: "CONVERTED_TO_ORDER" as const, weight: 22 },
        ]),
    blockedReason: blocked,
  })
}

/* ------------------------------------------------------------------ *
 * Write
 * ------------------------------------------------------------------ */

const meta: DatasetMeta = {
  seed: SEED,
  generatedFor: "Industrial data fabric preview for the manufacturer",
  periodStart: iso(PERIOD_START),
  periodEnd: iso(PERIOD_END),
  asOf: iso(AS_OF),
  counts: {
    inventoryOrgs: ORGS.length,
    commodityGroups: COMMODITIES.length,
    suppliers: suppliers.length,
    parts: parts.length,
    engineeringParts: engineeringParts.length,
    duplicateClusters: duplicateClusters.length,
    duplicateMembers: duplicateClusters.reduce((s, c) => s + c.memberCount, 0),
    purchaseOrderLines: purchaseOrderLines.length,
    requisitions: requisitions.length,
    maintainableAssets: assets.length,
    pricePoints: pricePoints.length,
  },
  notice: "Illustrative data. Not connected to any production system.",
}

mkdirSync(OUT_DIR, { recursive: true })

const write = (name: string, value: unknown) => {
  writeFileSync(join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

write("meta.json", meta)
write("orgs.json", ORGS)
write("commodities.json", COMMODITIES.map(({ code, name, baseUnitCost }) => ({ code, name, baseUnitCost })))
write("suppliers.json", suppliers)
write("parts.json", parts)
write("engineering-parts.json", engineeringParts)
write("duplicate-clusters.json", duplicateClusters)
write("purchase-order-lines.json", purchaseOrderLines)
write("requisitions.json", requisitions)
write("assets.json", assets)
write("price-history.json", pricePoints)

const causeTally = CAUSE_PLAN.map((p) => `${p.cause}=${p.count}`).join(" ")
console.log(
  [
    `seed ${SEED}`,
    ...Object.entries(meta.counts).map(([k, v]) => `${k} ${v}`),
    `causes ${causeTally}`,
  ].join("\n")
)
