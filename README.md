# Industrial Data Fabric — Preview

A client facing pre-sales preview of an industrial data fabric for a heavy
manufacturer, presented live at 1440x900.

**All data is illustrative. There is no backend and no connection to any real
system.** The client is referred to throughout the code as "the manufacturer".

---

## What is built

This commit is the **shell only**. Screen content is deliberately not built yet.

| Built | Not built |
| --- | --- |
| Navigation, routing and the walkthrough order | Screens 2 to 7 |
| Design system and layout frame | — |
| Nomenclature registry | — |
| Deterministic data generation | — |
| Business view / Data view overlay and lineage panel | — |
| Cross module session state | — |
| Screen 1, problem selection | — |

Screens 2 to 7 render a scaffold that names the screen, states its intent and
exercises the overlay. Those scaffolds are deleted one at a time as real screens land.

### Screen 1 · Problem selection

Runs for about ninety seconds and establishes that the problem is chosen before any
tool is shown. A scatter plot of fourteen candidates, size of prize on a logarithmic
axis against strategic alignment, with circle area proportional to the data readiness
effort each needs. A faint diagonal band marks where to start. Three candidates are
highlighted and expanded in the detail panel beneath.

The candidate catalogue is in `data/problems.ts`. It is curated content rather than
seeded data: the positions are composed by hand so the plot reads in the few seconds
a presenter has, which is not something random generation can do. Every figure in it
is illustrative.

## Running it

```bash
npm install
npm run generate   # writes /data/generated, deterministic from a fixed seed
npm run dev        # http://localhost:3000 → redirects to /problems
npm run verify     # nomenclature guard, typecheck, production build
```

## Routes

| Step | Route | Screen |
| --- | --- | --- |
| — | `/` | redirects to `/problems` |
| 1 | `/problems` | Problem selection |
| 2 | `/fabric` | Fabric skeleton |
| 3 | `/parts` | Part master intelligence |
| 4 | `/mro` | MRO signals |
| 5 | `/procurement` | Automated procurement |
| 6 | `/fabric/live` | Fabric populated |
| 7 | `/engagement` | What it takes |

The order lives once, in `lib/routes.ts`. The left nav, the step numbers and the
next control at the bottom right all read from it, so the presenter can never be
shown two different orders.

---

## Hard rules

### 1. Single source of nomenclature

`data/nomenclature.ts` is the **only** file permitted to contain an Oracle EBS table
name, an Oracle EBS column name, a Teamcenter business object name, a Teamcenter SOA
service name or a Teamcenter property name. Every screen imports by key:

```tsx
<Traced sourceKey="PART.ORACLE_DESCRIPTION" label="Description">
  <span className="mono">{part.description}</span>
</Traced>
```

This exists so a subject matter expert can review one file instead of the whole
codebase. It is enforced, not just documented:

```bash
npm run check:nomenclature   # also runs on every build via prebuild
```

Every entry is marked `NEEDS_SME_REVIEW`. The verification chip renders from that
field and appears **only in Data view** — it can never leak into the client's view.

### 2. Determinism

`scripts/generate.ts` writes static JSON into `data/generated` at build time. The
whole dataset is a pure function of one seed: no `Math.random`, no `Date.now`, no
locale dependent formatting. Two builds produce byte identical files. Nothing is
generated at runtime.

### 3. No storage

No database, no API routes calling external services, no `localStorage`, no
`sessionStorage`. All state is React state or context. Reloading the page starts a
clean demonstration, which is what a presenter wants.

---

## The data view overlay

The most important shared component in the build.

- A global **Business view / Data view** toggle sits in the top bar.
- In Data view every data bearing element gains a thin cyan dotted outline and a
  small monospace tag showing its medallion layer and source object.
- Clicking a tagged element opens a 420px right side panel showing the source
  system, the source object (with SOA service for Teamcenter), the fields involved,
  the medallion layer and mart, the transform in one plain sentence, any assumption,
  and the verification chip.
- Opening the panel narrows the content rather than covering it, so the presenter
  never loses the value they just clicked. Escape closes it.
- Leaving Data view closes the panel. No source detail survives into Business view.

Files: `context/DataViewContext.tsx`, `components/lineage/Traced.tsx`,
`components/lineage/LineagePanel.tsx`.

## Cross module session state

`context/SessionContext.tsx` holds the selected problem, the selected part, the
selected MRO signal and an ordered log of every action the presenter takes. Screens
5 and 6 read from it — the populated fabric screen must reflect what actually
happened in the session rather than fixed numbers.

## Generated dataset

| Records | Detail |
| --- | --- |
| 2,400 parts | across 4 inventory organizations |
| 1,850 engineering parts | with revision history |
| 140 duplicate clusters | 2 to 5 members each, 391 members total |
| 320 suppliers | with delivery and quality performance |
| 5,600 purchase order lines | across 24 months |
| 480 requisitions | system proposed and buyer raised |
| 210 maintainable assets | with condition and criticality |
| 288 price points | 24 months across 12 commodity groups |

Duplicate cause distribution, seeded exactly:

| Cause | Share | Clusters |
| --- | --- | --- |
| Copy and paste with minor description variation | 40% | 56 |
| Revision abuse — a genuinely different part created as a new revision to avoid a four week material creation cycle | 25% | 35 |
| Same physical part under different supplier part numbers | 20% | 28 |
| Same part registered separately in different inventory organizations | 15% | 21 |

Each cluster's member records are mutated to be consistent with its cause, so an
organization split cluster really does span plants and a supplier number cluster
really does share a supplier reference.

---

## Design system

| Token | Value |
| --- | --- |
| Background | `#F7F8FA` |
| Surface | `#FFFFFF` |
| Border | `#E4E9ED` at 1px |
| Navy — primary text and headers | `#0F2B46` |
| Cyan — accents and active states | `#00A3C4` |
| Amber — attention | `#B45309` |
| Green — healthy | `#15803D` |
| Red — blocked | `#B91C1C` |

Cards use an 8px radius, a subtle shadow and generous padding. The only gradient in
the build is the 3px cyan top bar on primary cards. IBM Plex Sans for UI text, IBM
Plex Mono for every number and every identifier. Verified at 1440x900 with no
horizontal scroll at 1280px.

## Open items for the client

- **The nomenclature appendix was not supplied with the brief.** The registry has
  been populated from standard Oracle EBS and Teamcenter naming as a working draft.
  When the appendix arrives, replacing `data/nomenclature.ts` is the whole change —
  no screen touches a source name directly. Everything is flagged
  `NEEDS_SME_REVIEW` in the meantime.
- The riskiest assumption in the registry is that the approved supplier list is
  maintained well enough to be the guard rail for automated procurement. Worth
  testing before screen 5 is designed.
