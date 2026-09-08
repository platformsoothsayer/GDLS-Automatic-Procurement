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
| Navigation, routing and the walkthrough order | — |
| Design system and layout frame | — |
| Nomenclature registry | — |
| Deterministic data generation | — |
| Business view / Data view overlay and lineage panel | — |
| Cross module session state | — |
| Screen 1, problem selection | — |
| Screens 2 and 6, the fabric | — |
| Screen 3, part master intelligence | — |
| Screen 4, MRO signals | — |
| Screen 5, automated procurement | — |
| Screen 7, what it takes | — |

All seven screens are built. No scaffolds remain.

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
npm run verify     # both guards, typecheck, production build
npm run review     # regenerate docs/nomenclature-review.md
```

## Deploying

The production build is verified from a clean checkout. Deploy with the Vercel CLI:

```bash
npm i -g vercel
vercel login
vercel deploy --prod
```

`vercel.json` pins the framework, the build command and the region. `.vercelignore`
keeps `docs/` out of the deployment. Nothing else is needed: there are no environment
variables, no secrets and no external services.

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

### 4. The dataset never reaches the browser

`lib/dataset.ts` imports roughly six megabytes of generated JSON. Anything that value
imports a module reaching it drags all of that into the client bundle. Enforced:

```bash
npm run check:bundles        # also runs on every build via prebuild
```

This check exists because it happened. One client component imported a constant from
`lib/procurement`, and that route shipped 808kB to the browser instead of 121kB.
Nothing about the screen looked wrong, which is why it needs a check rather than an
eye.

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

### Screens 2 and 6 · The fabric

One component, `components/screens/fabric/FabricDiagram.tsx`, rendered twice.
`/fabric` passes `populated={false}`, `/fabric/live` passes `populated` and reads the
session context. The two states occupy exactly the same footprint down to the pixel,
so the room sees one diagram filling in rather than two different pictures.

Every figure in it is derived, never written by hand. `lib/fabric.ts` computes row
counts from the seeded dataset, object counts by counting distinct objects in the
registry, and mart names from the registry entry for each mart. The resolve stage
takes its parts and suppliers figures from the dataset and its merged and routed
figures from the session action log.

The accretion slider and the residency control both animate the diagram in place.
Nothing unmounts: dormant source boxes transition colour, and the resolved entity
chips are all mounted at every position and expand into view. The residency control
changes one line of text and nothing else, which is the point of it.

Copy lives in `data/fabric-content.ts` so the argument can be edited without touching
the diagram.

### Screen 3 · Part master intelligence

Three tabs over one work queue: duplicate clusters, cluster detail, completeness.
The frame is a queue for a small team rather than an autonomous cleaner. Every
decision is taken by a person, and the top strip is about the team's throughput.

The confidence score is a real model. Discrete evidence contributes fixed points and
description similarity is the continuous term that settles the total. Contributions
can subtract: a pair of parts sitting at different positions in the same assembly
loses fifteen points, because interchangeability is unlikely whatever else matches.
Twenty five of the 140 clusters carry a negative contribution, and the detail tab
opens on one of them.

Merge, keep separate and route to engineering each open a confirmation naming what
would change and in which system. The surviving item number is proposed rather than
chosen, the write back is a staged update held for approval, and the wording says
so. Nothing on the screen implies a write to a production system.

Completeness is organised by the process that needs the field, not as a score. A
missing lead time is not a low quality record in the abstract, it is a part that
cannot be bought automatically, and the card says which parts and how many.

### Screen 4 · MRO signals

Deliberately lean. It exists to produce a signal screen 5 consumes, not to be a
maintenance product. An asset register on the left, active signals on the right, one
action per signal.

A signal is evaluated rather than stored. Two conditions fire it: on hand at or below
the reorder point, or a predicted need date falling inside the supplier lead time
window. The second is the one that matters, and it is drawn loudest, with a timeline
showing today, the lead time window and the predicted need date so the collision is
obvious. Twenty six of the 210 assets are signalling, fifteen of them on timing.

Send to procurement writes the signal into the session and navigates to
`/procurement`, which acknowledges receipt on arrival. That receipt component is
temporary scaffolding: when screen 5 is built it reads the same session value.

#### Nomenclature at object level

We do not know whether the manufacturer runs an enterprise asset management module,
so the MRO sources are registered at **object level only**. They name the object and
the data elements needed, and assert no field names. `SourceRef` gained an optional
`granularity` field to carry this; the overlay marks those entries with an object
level chip, changes the heading to "data elements needed", and states that the field
names describe what is needed rather than what the source calls it. Every assumption
now renders in amber rather than as a footnote.

### Screen 5 · Automated procurement

The largest screen. Four stages left to right, the active one expanded and the rest
collapsed to summary tiles. A rail on the right names the gold mart each stage reads
from and stays visible in Business view, so the presenter can point at it without
toggling.

Stage 1 has three signal sources and only one is live. The other two are outlined and
labelled phase 2 and phase 3, which is the staged build rather than an all at once
promise. Stage 2 derives the recommendation: economic order quantity against the
minimum order quantity and the order multiple, the order by date from lead time and
need date, the approved supplier list with delivery and quality records, contract
price where one exists and last paid where one does not, and the reasoning as a list
of input, value and effect rather than a paragraph.

Stage 3 is the change management answer. Both modes are the same size, carry the same
field values, and each says plainly where it stops. Advisory needs no integration at
all and is positioned as where most organizations start. Pre-populated names its
integration mechanism from the registry and states that the document is created
unapproved. Neither shows a document being approved automatically.

Stage 4 is the RFQ branch, reached from a control at stage 3 and treated as a first
class path. Ranking gates on feasibility before it looks at price, so the cheapest
response loses when it cannot arrive before the need date, and the row says why. An
award that is not the top ranked response cannot be recorded without a justification.

### Screen 7 · What it takes

The closing screen, and the only one with no new demonstration content. The
architecture diagram reads the same derived figures the fabric screen uses, so the
two cannot disagree, and the roadmap bands are the accretion horizons from screen 6.

Five sections in order: the end to end architecture with the human approval gate drawn
as its own element on the write back path; three deployment options with no
recommendation between them; what we need from the manufacturer; a roadmap whose later
bands are deliberately thinner; and staffing by role. No pricing, no logos, no
testimonials.

This is the one screen that scrolls. It is a document rather than a view, and
compressing five sections into a single 900px viewport would mean type too small to
read on a projector. Roughly one screen of scroll, with clearance so nothing sits
under the end of walkthrough marker.

## Cross module session state

`context/SessionContext.tsx` holds the selected problem, the selected part, the
selected MRO signal and an ordered log of every action the presenter takes, plus a
tally per action kind. Screens 5 and 6 read from it — the populated fabric screen
must reflect what actually happened in the session rather than fixed numbers.

The context is mounted above the router, so it survives navigation between screens
and is cleared by a page reload. Verified in a browser, along with the fact that the
build touches no browser storage at all.

Screen 3 emits `CLUSTER_MERGED`, `CLUSTER_KEPT_SEPARATE` and
`CLUSTER_ROUTED_TO_ENGINEERING`, and the populated fabric reads them: merging a
cluster on screen 3 and walking to screen 6 shows it in the resolve stage and in the
engineering review queue. Verified in a browser. Screen 4 emits `SIGNAL_SELECTED` and
screen 5 emits `REQUISITION_PROPOSED` and `REQUISITION_RELEASED`, so all three tiles
on the populated fabric now fill from the walkthrough itself.

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
