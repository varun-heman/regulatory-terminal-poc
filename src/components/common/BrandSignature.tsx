import { useId } from 'react'
import {
  DXY_IN_TERMINAL, DeltaxyWord, TERMINAL_BOX, TERMINAL_GAP, TERMINAL_SHORT,
  TerminalBracketLeft, TerminalBracketRight, TerminalCursor,
  TerminalWordHead, TerminalWordTail,
} from './brandArt'

export type SignatureMode = 'short' | 'full' | 'dxy'

export function BrandSignature({
  height = 15,
  trigger = 'hover',
  mode = 'full',
  onEnter,
  onLeave,
  className,
}: {
  height?: number
  trigger?: 'hover' | 'auto'
  mode?: SignatureMode
  onEnter?: () => void
  onLeave?: () => void
  className?: string
}) {
  const clip = `sigclip-${useId().replace(/:/g, '')}`

  return (
    <span
      className={`sig sig--${trigger} is-${mode} ${className ?? ''}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        ['--sig-h' as string]: `${height}px`,
        ['--sig-w-full' as string]: `${(height * TERMINAL_BOX.w) / TERMINAL_BOX.h}px`,
        ['--sig-w-short' as string]: `${(height * TERMINAL_SHORT.w) / TERMINAL_BOX.h}px`,
        ['--sig-bracket-travel' as string]: `${TERMINAL_SHORT.rightBracketX - 1394.8}`,
      }}
      tabIndex={trigger === 'hover' ? 0 : undefined}
      onFocus={onEnter}
      onBlur={onLeave}
      aria-label="Terminal, by DeltaXY"
      title={trigger === 'hover' ? 'Terminal — by DeltaXY' : undefined}
    >
      <svg
        viewBox={`0 0 ${TERMINAL_BOX.w} ${TERMINAL_BOX.h}`}
        height={height}
        width={height * (TERMINAL_BOX.w / TERMINAL_BOX.h)}
        role="img"
        aria-hidden
        className="sig__svg"
        xmlns="http://www.w3.org/2000/svg"
        style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2 }}
      >
        <defs>
          {/* The frame does the cutting, so a name leaving is occluded by the
              brackets rather than dissolving in front of them */}
          {/* Horizontal only: the frame cuts the name's travel, but must not
              crop DeltaXY's descender, which hangs below the brackets in its
              own lockup too. */}
          <clipPath id={clip}>
            <rect x={TERMINAL_GAP.x} y={-260} width={TERMINAL_GAP.w} height={TERMINAL_BOX.h + 520} />
          </clipPath>
          <clipPath id={`${clip}-box`}>
            <rect x={0} y={0} width={TERMINAL_BOX.w} height={TERMINAL_BOX.h} />
          </clipPath>
        </defs>

        {/* Every moving piece is wrapped in a root-level group. The artwork's
            own nesting is rotated and scaled 50×, so a transform applied to an
            element travels in the wrong direction by the wrong amount — the
            wrapper is the only place a translation means what it says. */}
        <g className="sig__frame">
          <TerminalBracketLeft />
        </g>
        <g className="sig__frame sig__bracketR">
          <TerminalBracketRight />
        </g>

        {/* Clipped to the artboard, the way the short lockup's own viewport
            clips it — the cursor is drawn taller than the box it lives in */}
        <g className="sig__cursor" clipPath={`url(#${clip}-box)`}>
          <TerminalCursor />
        </g>

        <g clipPath={`url(#${clip})`}>
          <g className="sig__name sig__name--term">
            <g className="sig__head"><TerminalWordHead /></g>
            <g className="sig__tail"><TerminalWordTail /></g>
          </g>

          <g className="sig__name sig__name--dxy">
            {/* Placed by mapping DeltaXY's bracket pair onto Terminal's, so the
                name keeps its own spacing inside the frame rather than being
                re-centred on Terminal's terms */}
            <g transform={DXY_IN_TERMINAL}>
              <DeltaxyWord />
            </g>
          </g>
        </g>
      </svg>
    </span>
  )
}
