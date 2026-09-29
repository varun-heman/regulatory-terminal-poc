# Regulatory Terminal — Working Agreement

**Terminal** is DeltaXY's product shell. This repository is **Regulatory Terminal**: the same
shell, the same design language, pointed at regulation instead of leasing.

The firm using it is **Eisenrhamper**. Its clients are the regulated entities whose conduct it
reviews — credit unions first, chosen from the Central Bank's register.

**Two frameworks, and only two:**

| | |
|---|---|
| **CPC** | Consumer Protection Code 2025 — S.I. No. 81/2025 and the Standards for Business Regulations 2025, in force 24 March 2026 |
| **DORA** | Regulation (EU) 2022/2554, in application since 17 January 2025 |

Everything else in Terminal hangs off these. A provision belongs to a framework, a control
discharges a provision, an engagement is scoped to one or both.

This is a sibling of [`../terminal-product-sketch`](../terminal-product-sketch), which remains
the aircraft-leasing build. Shell, tokens, components and motion are shared by copy; the domain
layer is not.

## Status

Early. Real: the shell, the gate, the desktop, the App Store, **Clients**, **Frameworks** and
**Horizon Scanning**. Every other module is a **placeholder** that renders `ModuleScaffold` —
it states that its screens are not yet specified rather than inventing one. That is
deliberate: modules are specified with the client before they are built.

## Applicability is the load-bearing idea

A framework does not apply to "firms". It applies to a **kind of entity**, sometimes only to
**part** of what that entity does, and sometimes **not until a date**. `src/data/frameworks.ts`
models those separately, and the Clients module will not let a reviewer scope a framework that
does not bind the entity.

Two facts drive most of the product, and both were read from the Central Bank:

- **CPC reaches a credit union only where it acts as an insurance intermediary.** Core savings
  and lending are outside it. CP165 consulted on changing that; the consultation closed on
  6 March 2026 and no outcome has been read.
- **DORA does not apply to credit unions until 17 January 2028.** Ireland's implementing
  regulations disapply it until then.

Collapsing either of these is how a review ends up testing a book the Code does not reach, or
missing a regulation that arrives in 2028. Never state an applicability position without a
source; `unverified` is a real, usable state and must not be treated as "applies".

## Rules

1. **Don't invent regulatory facts.** A citation is either verifiable or it does not appear.
   Instrument names, section numbers, commencement dates and regulator decisions are checked
   against the source or left out. Getting a citation wrong here is worse than having none.
2. **Every value carries provenance** — source, method, as-of date. `src/data/sourced.ts`
   carries the type; `NoSource` renders the honest answer when a value is not known. A
   plausible zero is never acceptable.
3. **Placeholder data says so.** Illustrative figures are labelled illustrative, in the file
   header and on the screen. See the banner on Compliance Overview.
4. **A client is chosen, never typed** — where a register exists. Credit unions come from the
   Central Bank's register (`src/data/creditUnions.ts`), so the registered number is the
   identity and one society cannot become two clients under two spellings.
5. **Registered names are never abbreviated.** A registered name is the client's legal identity
   and the thing a finding is addressed to. There was a `shortName` helper that stripped
   "Credit Union Limited" to save column width; it made the list tidier and the record wrong.
   Let the column be wide.
6. **Horizon items earn their place.** An item goes on the board because it changes what has to
   be tested, not because it happened. Anything whose date or status cannot be established
   against a source is left off rather than carried with a guess, and anything read from a
   briefing rather than the instrument is marked `secondary`.
7. **Mini apps, not a monolith.** Each mini app owns one job over a shared domain core.
8. **Speak the domain's language.** Framework → instrument → provision → control → evidence →
   finding. Not "rule", not "requirement", not "task".

## Design system — Future Tense

The design language is **Future Tense**, and it is the same grammar as the leasing build. The
written specification and the living design book live in
[`../terminal-product-sketch`](../terminal-product-sketch) —
`DESIGN_SYSTEM.md` and `design-book/` — and remain the authority for both products. This
repository deliberately does not carry a second copy: two copies of a design system is two
things to drift.

**A design change made here that changes the grammar must be made in the design book in
`../terminal-product-sketch` too.** A token, component, variant, state, spacing, radius, type
scale, easing or duration change is a grammar change. A module that only consumes the grammar
is not.

### Standing design rules

- **No left-accent edge treatments.** States use fill, border, weight or a corner indicator.
- **No ambient text.** No fake telemetry, session ids, latency readouts or decorative status
  lines. Density comes from data, never filler.
- **No frame around an icon.** Content glyphs stand alone; only controls carry a border.
- **A module stylesheet namespaces every class it invents.** `.cli`, never `.client`. Module
  CSS is bundled globally and is not scoped by its folder. (D82)
- **Anything that expands carries a chevron**, before it is clicked.
- **Tabs are not segmented controls.** Sized to their labels, underlined across the panel rule.
- **Every section folds to its title** — any titled region takes `Fold` (via `Block`).
- **Every table column sorts, filters and resizes**, using `ColumnHead` / `ColGroup` /
  `useColumns` from `src/components/common/columns.tsx`.
- **State on a column is never the accent colour.** The accent means *chosen by you*.
- **Dark and light themes**, dark by default, driven by root-level tokens.
- **Motion is the default state**, not a garnish.
- **Layouts respond to their container** (`@container pane`), never the viewport.

## The background field

`src/components/common/RegulationField.tsx` is the gate's moving field, and it is the
regulation analogue of the leasing build's radar. Ledger rules and a margin rule under
everything; the island of Ireland as a coastline; instruments drifting upward on bowed paths
leaving a dotted citation trail; a citation lattice; and a **review line** that reads down the
page and stamps each instrument as it passes. A regulated business's radar is not a rotating
sweep — it is somebody going through the book from the top.

The coastline is in `src/components/common/ireland.ts`: real headlands, coarse on purpose.

## Repo layout

```
CLAUDE.md                     This file
src/domain/access.ts          The Irish Regulation domain and its roles
src/domain/apps.ts            The module catalogue, tagged by framework
src/domain/store.ts           App Store listings, categories and role gates
src/data/frameworks.ts        CPC and DORA, entity kinds, and the applicability matrix
src/data/horizon.ts           Horizon items — six, each with its source
src/data/creditUnions.ts      Central Bank Register of Credit Unions (185, sourced)
src/data/clients.ts           Eisenrhamper's clients, persisted locally
src/components/login/         The gate and the boot sequence
src/components/desktop/       The shell: launcher, panes, windows, dock
src/components/modules/       Module screens — Clients and the App Store are real
server/                       The production server — no dependencies
deploy/                       systemd unit, nginx vhost, first-run setup script
```

## Running it

```
npm run dev      Vite dev server, port 5174
npm run build    Typecheck and build to dist/
npm start        Serve the build on PORT (default 8080)
```

Port 5174 so it can run beside the leasing build on 5173.
