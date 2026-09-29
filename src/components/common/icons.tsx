import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = (p: P) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  xmlns: 'http://www.w3.org/2000/svg',
  ...p,
})

export const IconOverview = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 15a8.5 8.5 0 0 1 17 0" />
    <path d="M12 15l4.2-4.6" />
    <circle cx="12" cy="15" r="1.3" />
    <path d="M3.5 19.5h17" />
    <path d="m6.6 11.4 1.4 1.4 2.6-2.8" opacity=".5" />
  </svg>
)









export const IconSystem = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.6 7.2h16.8M3.6 12h16.8M3.6 16.8h16.8" />
    <circle cx="8.4" cy="7.2" r="2" fill="var(--bg-elev-1)" />
    <circle cx="15.6" cy="12" r="2" fill="var(--bg-elev-1)" />
    <circle cx="10" cy="16.8" r="2" fill="var(--bg-elev-1)" />
  </svg>
)

export const IconChevron = (p: P) => (
  <svg {...base(p)}><path d="M6 9.5 12 15.5 18 9.5" /></svg>
)

export const IconFilter = (p: P) => (
  <svg {...base(p)}><path d="M4 5.5h16l-6.3 7.4v5.4l-3.4 1.7v-7.1z" /></svg>
)

export const IconGrip = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" />
    <circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" />
    <circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" />
  </svg>
)

export const IconTick = (p: P) => (
  <svg {...base(p)}><path d="M5 12.5 10 17.5 19 7" /></svg>
)

export const IconClose = (p: P) => (
  <svg {...base(p)}><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" /></svg>
)

export const IconMinimize = (p: P) => (
  <svg {...base(p)}><path d="M6 12h12" /></svg>
)

export const IconExpand = (p: P) => (
  <svg {...base(p)}>
    <path d="M9.5 4.5H4.5V9.5M14.5 4.5h5V9.5M19.5 14.5v5h-5M4.5 14.5v5h5" />
  </svg>
)

export const IconSplitAdd = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4.5" width="7" height="15" rx="1.5" />
    <path d="M16 8.5v7M12.5 12h7" />
  </svg>
)

export const IconCollapse = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 9.5h5v-5M19.5 9.5h-5v-5M14.5 19.5v-5h5M9.5 19.5v-5h-5" />
  </svg>
)

export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.4" width="14" height="9.6" rx="1.2" />
    <path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8" />
  </svg>
)

export const IconPower = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.4v8" />
    <path d="M17.7 6.6a8 8 0 1 1-11.4 0" />
  </svg>
)

export const IconSearch = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="6.4" /><path d="M15.8 15.8 20.5 20.5" /></svg>
)

export const IconSignal = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 19.5v-4M9.5 19.5v-8M14.5 19.5v-11.5M19.5 19.5v-15" />
  </svg>
)

export const IconGlobe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M3.2 12h17.6" />
    <path d="M12 3.2a13.4 13.4 0 0 1 0 17.6 13.4 13.4 0 0 1 0-17.6Z" />
  </svg>
)

export const IconArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M4.5 12h15M14 6.5 19.5 12 14 17.5" /></svg>
)

export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" />
    <rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" />
  </svg>
)

export const IconSun = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.4 5.4l1.8 1.8M16.8 16.8l1.8 1.8M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8" />
  </svg>
)

export const IconMoon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20.5 14.4A8.8 8.8 0 0 1 9.6 3.5a8.8 8.8 0 1 0 10.9 10.9Z" />
  </svg>
)

export const IconPopOut = (p: P) => (
  <svg {...base(p)}>
    <path d="M13.5 4.5H5.2a.7.7 0 0 0-.7.7v13.6c0 .4.3.7.7.7h13.6a.7.7 0 0 0 .7-.7v-8.3" />
    <path d="M13.8 10.2 20 4M15.4 3.5h4.6v4.6" />
  </svg>
)

export const IconDock = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1" />
    <path d="M12 4.5v15" opacity=".5" />
    <path d="M6.4 12h3.4M8.2 10.2 6.4 12l1.8 1.8" />
  </svg>
)

export const IconList = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6.5h16M4 12h16M4 17.5h16" />
  </svg>
)

export const IconBoard = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1" />
    <rect x="13" y="3.5" width="7.5" height="7.5" rx="1" />
    <rect x="3.5" y="13" width="7.5" height="7.5" rx="1" />
    <rect x="13" y="13" width="7.5" height="7.5" rx="1" />
  </svg>
)

export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.1 14.4a1.5 1.5 0 0 0 .3 1.7l.1.1a1.9 1.9 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.9 1.4v.2a1.8 1.8 0 1 1-3.7 0v-.1a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.7.3l-.1.1a1.9 1.9 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.4-.9h-.2a1.8 1.8 0 1 1 0-3.7h.1a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.7l-.1-.1a1.9 1.9 0 1 1 2.6-2.6l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4v-.2a1.8 1.8 0 1 1 3.7 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.7-.3l.1-.1a1.9 1.9 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.9h.2a1.8 1.8 0 1 1 0 3.7h-.1a1.5 1.5 0 0 0-1.4.9Z" />
  </svg>
)

export const IconInbox = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 13.5h4.2l1.4 2.6h5.8l1.4-2.6h4.2" />
    <path d="M3.5 13.5 6.2 5.1a1 1 0 0 1 .95-.7h9.7a1 1 0 0 1 .95.7l2.7 8.4v5a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1Z" />
  </svg>
)




export const IconMegaphone = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.4h3.4L18 4.6v14.8L7.4 14.6H4a1 1 0 0 1-1-1v-3.2a1 1 0 0 1 1-1Z" />
    <path d="M7.4 14.6v4a1 1 0 0 0 1 1h1.8a1 1 0 0 0 1-1v-2.4" opacity=".7" />
    <path d="M20.6 9.2v5.6" opacity=".6" />
  </svg>
)

export const IconWarn = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.6 21.4 20H2.6Z" />
    <path d="M12 9.6v4.6" />
    <circle cx="12" cy="17.1" r=".75" fill="currentColor" stroke="none" />
  </svg>
)

export const IconQueue = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.6 6.4h9.8M16.2 6.4h4.2" />
    <path d="M3.6 12h4.6M11 12h9.4" />
    <path d="M3.6 17.6h11.6M18 17.6h2.4" />
    <path d="M12.2 4.8 13.8 6.4 12.2 8M9.8 10.4 11.4 12 9.8 13.6M14 16 15.6 17.6 14 19.2" opacity=".7" />
  </svg>
)

export const IconApproval = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.4 3.6h8l4 4v12.8H6.4Z" />
    <path d="M14.2 3.6v4.2h4.2" />
    <path d="m9.4 14.4 2 2 4-4.4" />
  </svg>
)

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.2V12l3.2 2" />
  </svg>
)


export const IconStore = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.4" y="3.4" width="7.2" height="7.2" rx="1.4" />
    <rect x="13.4" y="3.4" width="7.2" height="7.2" rx="1.4" />
    <rect x="3.4" y="13.4" width="7.2" height="7.2" rx="1.4" />
    <path d="M17 13.6v7M13.5 17.1h7" />
  </svg>
)

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5.2v13.6M5.2 12h13.6" />
  </svg>
)

/* ---- Regulation ---------------------------------------------------------- */

/** The bound statute — primary legislation on a shelf */
export const IconStatute = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5.2a1.6 1.6 0 0 1 1.6-1.6h5.2a1.6 1.6 0 0 1 1.6 1.6v14.2a1.3 1.3 0 0 0-1.3-1.3H4Z" />
    <path d="M20 5.2a1.6 1.6 0 0 0-1.6-1.6h-5.2a1.6 1.6 0 0 0-1.6 1.6v14.2a1.3 1.3 0 0 1 1.3-1.3H20Z" />
    <path d="M6.4 8.2h3.8M6.4 11h3.8M13.8 8.2h3.8M13.8 11h3.8" opacity=".55" />
  </svg>
)

/** Obligation — a clause with a duty attached */
export const IconObligation = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.6 3.6h8l4.8 4.8v12H5.6Z" />
    <path d="M13.6 3.6v4.8h4.8" />
    <path d="M8.4 12.4h7.2M8.4 15.4h5" opacity=".7" />
    <circle cx="8.4" cy="18.2" r=".8" fill="currentColor" stroke="none" opacity=".7" />
  </svg>
)

/** Control — a check inside a frame, the thing that satisfies a duty */
export const IconControl = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="2" />
    <path d="m7.8 12.2 2.8 2.8 5.6-6" />
  </svg>
)

/** Filing — a return going up to a regulator */
export const IconFiling = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.6 14.6v4.4a1.4 1.4 0 0 0 1.4 1.4h14a1.4 1.4 0 0 0 1.4-1.4v-4.4" />
    <path d="M12 15.6V3.6" />
    <path d="m7.6 8 4.4-4.4L16.4 8" />
  </svg>
)

/** Horizon — what is coming, over the line */
export const IconHorizon = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.6 16.4h18.8" />
    <path d="M6.6 16.4a5.4 5.4 0 0 1 10.8 0" />
    <path d="M12 6.4V3.4M5.2 8.2 3.4 6.4M18.8 8.2l1.8-1.8" opacity=".6" />
    <path d="M4.4 20h5M12.6 20h7" opacity=".45" />
  </svg>
)

/** Authorisation — a permission stamped and held */
export const IconAuthorisation = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.2 19.6 6v6c0 4-3.2 7.2-7.6 8.8C7.6 19.2 4.4 16 4.4 12V6Z" />
    <path d="m8.8 12 2.4 2.4 4.2-4.6" />
  </svg>
)

/** Breach — a rule broken */
export const IconBreach = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.4 3.6h8.2l4.8 4.8v11.8H5.4Z" opacity=".9" />
    <path d="M13.6 3.6v4.8h4.8" />
    <path d="m9 11.4 6 6M15 11.4l-6 6" />
  </svg>
)

/** Enforcement — the scales, decided */
export const IconEnforcement = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4.2v15.4M7.4 19.6h9.2" />
    <path d="M4 7.6h16" />
    <path d="M4 7.6 1.8 13.4h4.4ZM20 7.6l-2.2 5.8h4.4" />
    <circle cx="12" cy="4.2" r="1.1" fill="currentColor" stroke="none" />
  </svg>
)

/** Consultation — a paper out for comment */
export const IconConsultation = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.6 5.2a1.4 1.4 0 0 1 1.4-1.4h10a1.4 1.4 0 0 1 1.4 1.4v8a1.4 1.4 0 0 1-1.4 1.4H8.2L4.6 17.4v-2.8H5a1.4 1.4 0 0 1-1.4-1.4Z" />
    <path d="M7 7.6h6M7 10.4h4" opacity=".65" />
    <path d="M19 8.2a1.4 1.4 0 0 1 1.4 1.4v7.8a1.4 1.4 0 0 1-1.4 1.4h-.4v2.6l-3-2.6" opacity=".8" />
  </svg>
)

/** Impact — the gap between what is required and what is in place */
export const IconImpact = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.6 20.4h16.8" />
    <path d="M5.2 16.8V9.4M10.4 16.8V5.2M15.6 16.8v-5.6" />
    <path d="M19.4 16.8V7.4" strokeDasharray="2 1.6" opacity=".75" />
    <path d="m3.8 5.8 3 3 4.4-5 4 3.2" opacity=".45" />
  </svg>
)

/** Policy — the internal document that discharges the duty */
export const IconPolicy = (p: P) => (
  <svg {...base(p)}>
    <rect x="4.6" y="3.4" width="14.8" height="17.2" rx="1.6" />
    <path d="M8 3.4v17.2" opacity=".55" />
    <path d="M10.6 8h6.2M10.6 11.4h6.2M10.6 14.8h4" opacity=".7" />
  </svg>
)

/** Attestation — a signature given */
export const IconAttestation = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.6 17.4c2.6 0 3-4.8 4.8-4.8 1.3 0 1.4 2.6 2.7 2.6 1.9 0 2.1-8.2 4.2-8.2 1.6 0 1.5 5.4 3 5.4.9 0 1.4-1 2.1-1" />
    <path d="M3.6 20.6h16.8" opacity=".55" />
    <path d="M17.6 3.4 19.4 5.2" opacity=".5" />
  </svg>
)

/** Register of instruments — the numbered stack */
export const IconInstrument = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.4 6.6h13.2a.8.8 0 0 1 .8.8v11.4a1.8 1.8 0 0 1-1.8 1.8H6.4Z" />
    <path d="M6.4 6.6a1.8 1.8 0 0 0-1.8 1.8v10.4a1.8 1.8 0 0 0 1.8 1.8" />
    <path d="M9.4 10.6h7.6M9.4 13.6h7.6M9.4 16.6h4.6" opacity=".65" />
    <path d="M7.2 3.4h11.4" opacity=".4" />
  </svg>
)

/** Audit trail — a sequence that cannot be edited */
export const IconAudit = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.2 4.6v14.8" opacity=".55" />
    <circle cx="6.2" cy="7.4" r="1.7" />
    <circle cx="6.2" cy="13" r="1.7" />
    <circle cx="6.2" cy="18.2" r="1.7" />
    <path d="M10.4 7.4h9.4M10.4 13h7M10.4 18.2h8.2" opacity=".7" />
  </svg>
)

/** Clients — the societies under review, as a set of records held together */
export const IconClients = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.2 7.4h8.4a1 1 0 0 1 1 1v11.2H4.2a1 1 0 0 1-1-1V8.4a1 1 0 0 1 1-1Z" />
    <path d="M13.6 11h6.2a1 1 0 0 1 1 1v7.6h-7.2" />
    <path d="M6 10.6h4.6M6 13.6h4.6M6 16.6h3" opacity=".6" />
    <path d="M15.8 14.4h3M15.8 17h2" opacity=".6" />
    <path d="M6.4 4.6h6" opacity=".4" />
  </svg>
)
