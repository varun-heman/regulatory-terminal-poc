import { DXY_BOX, DeltaxyBrackets, DeltaxyWord } from './brandArt'

export function DeltaxyMark({ height = 16, className }: { height?: number; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${DXY_BOX.w} ${DXY_BOX.h}`}
      height={height}
      width={height * (DXY_BOX.w / DXY_BOX.h)}
      role="img"
      aria-label="DeltaXY"
      className={`dxymark ${className ?? ''}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2 }}
    >
      <DeltaxyBrackets />
      <DeltaxyWord />
    </svg>
  )
}
