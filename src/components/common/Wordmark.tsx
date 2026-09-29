import { TERMINAL_BOX, TerminalBrackets, TerminalWord } from './brandArt'

export function Wordmark({ height = 20, className }: { height?: number; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${TERMINAL_BOX.w} ${TERMINAL_BOX.h}`}
      height={height}
      width={height * (TERMINAL_BOX.w / TERMINAL_BOX.h)}
      role="img"
      aria-label="Terminal"
      className={`wordmark ${className ?? ''}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2 }}
    >
      <TerminalBrackets />
      <TerminalWord />
    </svg>
  )
}
