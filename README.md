# Regulatory Terminal

**Terminal** is DeltaXY's product shell. This is **Regulatory Terminal** — the same shell and
the same design language, pointed at regulation.

The firm using it is **Eisenrhamper**; its clients are the regulated entities whose conduct it
reviews, credit unions first. It covers **two frameworks**: the Central Bank's **Consumer
Protection Code 2025** and **DORA**.

It is a sibling of [`../terminal-product-sketch`](../terminal-product-sketch), the aircraft
leasing build. The shell, tokens, components and motion are shared; the domain is not.

## What it is

An operating-system-shaped shell — a launcher of mini apps on the left, resizable panes on the
right, pop-out windows, a dock — over one domain core.

### Built

| Module | What it owns |
|---|---|
| **Clients** | The entities under review. The kind of entity decides which frameworks can be scoped; credit unions are chosen from the Central Bank's register, so the registered number is the identity |
| **Frameworks** | CPC and DORA — the instruments behind each, the Code's Parts, DORA's five pillars, and an applicability matrix across six kinds of entity |
| **Horizon Scanning** | Six items that change what has to be tested, on one timeline, each resolved against the client book |
| **App Store** | Every module, what it does, where its data comes from, and the two gates between it and your desktop |
| **Engagement Overview** | The resident home screen — the shape of the book, not a compliance score |

### Placeholders

Thirteen further modules are registered, categorised, framework-tagged and role-gated, and
render a specification-pending state rather than a fake screen. The engagement spine —
Provision Register, Controls & Evidence, Gap Analysis & Findings — plus the CPC modules
(Consumer File Review, Advertising Review, Errors & Complaints), the DORA modules (ICT
Third-Party Register, ICT Incidents, Resilience Testing), the Regulatory Inbox, Enforcement
Watch, the Engagement Audit Trail and System Administration.

## What applies to whom

The product refuses to let a framework be scoped to an entity it does not bind. Two findings
from the Central Bank drive this:

- The **Consumer Protection Code reaches a credit union only where it acts as an insurance
  intermediary** — core savings and lending are outside it. [CP165] consulted on extending it
  to all regulated credit union activities; the consultation closed 6 March 2026 and no
  outcome has been read.
- **DORA does not apply to credit unions until 17 January 2028**, under Ireland's implementing
  regulations.

So a credit union client can carry CPC (in part) and cannot carry DORA. A bank carries both.
Where the position has not been established from a source, the matrix says *not established*
and the framework stays unselectable — rather than guessing.

[CP165]: https://www.centralbank.ie/publication/consultation-papers/cp165-application-of-consumer-protection-code-to-all-regulated-credit-union-activities

## The credit union register

`src/data/creditUnions.ts` holds all **185** societies on the Central Bank of Ireland's
Register of Credit Unions, maintained under the Credit Union Act 1997 (as amended), as at
**21 September 2026**. Registered number and registered name are verbatim; nothing was added.

Source: [Central Bank of Ireland, Register of Credit
Unions](https://registers.centralbank.ie/DownloadsPage.aspx) — downloaded as the published PDF
and parsed.

The Central Bank notes on the register itself that societies which have transferred,
amalgamated, are being wound up by dissolution or are in liquidation remain listed until
de-registration completes. Being listed is therefore not evidence that a society is trading,
and the Clients module says so.

## Logins

Eight roles under the one domain: Administrator, Head of Compliance, Compliance Officer, Legal
Counsel, Risk Officer, Data Protection Officer, Money Laundering Reporting Officer, Internal
Audit. Role gates the module catalogue — System Administration is the Administrator's alone,
and several modules require a named role to install.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5174. Port 5174 so it runs beside the leasing build on 5173.

```bash
npm run build    # typecheck and build to dist/
npm start        # serve the build on PORT (default 8080)
```

The server is Node's own `http`, `fs` and `zlib` — no dependencies, no third-party calls at
runtime. Set `AUTH_USER` and `AUTH_PASS` to put the whole site behind HTTP basic auth.

## Honesty

Two things are real: the credit union register, and the shell. Everything else that looks like
data is illustrative and labelled so — on the screen, not only in a comment. A regulatory tool
that guesses a citation is worse than no tool, so nothing here invents one.
