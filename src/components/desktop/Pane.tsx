import { OverviewCard } from './OverviewCard'
import { ModuleScaffold } from './ModuleScaffold'
import { MODULE_VIEWS } from '../modules'
import { IconClose, IconCollapse, IconExpand, IconPopOut, IconSplitAdd } from '../common/icons'
import { HORIZON_AS_OF, fmtDate } from '../../data/horizon'
import type { MiniApp } from '../../domain/apps'

interface Props {
  app: MiniApp
  expanded: boolean
  active?: boolean
  onClosePane?: () => void
  onToggleExpand: () => void
  onPopOut: () => void
  onDuplicate?: () => void
}

export function Pane({
  app, expanded, active, onClosePane, onToggleExpand, onPopOut, onDuplicate,
}: Props) {
  const View = MODULE_VIEWS[app.id]

  return (
    <section className={`pane ${active ? 'is-focused' : ''}`}>
      <header className="pane__head">
        <h2 className="pane__title">{app.name}</h2>
        <div className="pane__ctls">
          {app.id === 'overview' && <span className="label">As of {fmtDate(HORIZON_AS_OF)}</span>}
          {/* One pill, not four buttons. Each control keeps its own hue the way
              a Mac window's does, and the pill sizes itself to whatever
              controls this pane actually has. */}
          <div className="panectl">
            {onDuplicate && (
              <button
                className="panectl__btn panectl__btn--dup"
                onClick={onDuplicate}
                title={`Open a second ${app.name} beside this one`}
              >
                <IconSplitAdd width={15} height={15} strokeWidth={1.7} />
              </button>
            )}
            <button className="panectl__btn panectl__btn--pop" onClick={onPopOut} title="Open in a window">
              <IconPopOut width={15} height={15} strokeWidth={1.7} />
            </button>
            <button
              className="panectl__btn panectl__btn--exp"
              onClick={onToggleExpand}
              title={expanded ? 'Restore' : 'Expand'}
            >
              {expanded
                ? <IconCollapse width={15} height={15} strokeWidth={1.7} />
                : <IconExpand width={15} height={15} strokeWidth={1.7} />}
            </button>
            {onClosePane && (
              <button className="panectl__btn panectl__btn--close" onClick={onClosePane} title="Close this split">
                <IconClose width={15} height={15} strokeWidth={1.7} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="pane__body">
        {app.id === 'overview' ? <OverviewCard /> : View ? <View /> : <ModuleScaffold app={app} />}
      </div>
    </section>
  )
}
