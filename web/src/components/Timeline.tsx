import { type Watchlist } from '../lib/schema'
import { type TimelineGroup } from '../lib/timeline'

export function Timeline(props: {
  watchlist: Watchlist
  groups: TimelineGroup[]
  expandedGroups: Record<string, boolean>
  onToggleExpanded: (groupId: string) => void
  progressByContentId: Record<string, { watched: boolean } | undefined>
  onSetWatched: (contentId: string, watched: boolean) => void
  onSetManyWatched: (contentIds: string[], watched: boolean) => void
}) {
  const {
    watchlist,
    groups,
    expandedGroups,
    onToggleExpanded,
    progressByContentId,
    onSetWatched,
    onSetManyWatched,
  } = props

  return (
    <div className="card list">
      <ol className="timeline">
        {groups.map((group) => {
          const contents = group.contentIds.map((id) => watchlist.contents[id]).filter(Boolean)
          if (contents.length === 0) return null

          const watchedCount = group.contentIds.reduce((acc, id) => acc + (progressByContentId[id]?.watched ? 1 : 0), 0)
          const isAllWatched = watchedCount === group.contentIds.length
          const isAnyWatched = watchedCount > 0
          const expanded = Boolean(expandedGroups[group.groupId])
          const rangeLabel = group.orderStart === group.orderEnd ? `#${group.orderStart}` : `#${group.orderStart} - #${group.orderEnd}`

          const hasUnexpanded = contents.some((c) => c.kind === 'unexpanded_series')
          const hasUnreleased = contents.some((c) => Boolean(c.unreleased))

          return (
            <li key={group.groupId} className={isAllWatched ? 'row row-watched' : 'row'}>
              <div className="group">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={isAllWatched}
                    ref={(el) => {
                      if (!el) return
                      el.indeterminate = isAnyWatched && !isAllWatched
                    }}
                    onChange={(e) => void onSetManyWatched(group.contentIds, e.target.checked)}
                  />
                  <span className="label">
                    <span className="main">
                      <span className="mono">{rangeLabel}</span> {group.displayText}
                    </span>
                    <span className="meta">
                      <span className="mono">list.txt:{group.sourceLine}</span>
                      {group.contentIds.length > 1 ? (
                        <span className="tag">
                          {watchedCount}/{group.contentIds.length}
                        </span>
                      ) : null}
                      {hasUnreleased ? <span className="tag">Unreleased</span> : null}
                      {hasUnexpanded ? <span className="tag tag-warn">Needs expansion</span> : null}
                    </span>
                  </span>
                </label>

                {group.contentIds.length > 1 ? (
                  <button type="button" className="btn btn-small" onClick={() => onToggleExpanded(group.groupId)}>
                    {expanded ? 'Hide episodes' : 'Show episodes'}
                  </button>
                ) : null}
              </div>

              {expanded ? (
                <ol className="episodes">
                  {group.contentIds.map((contentId, idx) => {
                    const content = watchlist.contents[contentId]
                    if (!content) return null
                    const watched = Boolean(progressByContentId[contentId]?.watched)
                    const watchNumber = group.orderStart + idx
                    return (
                      <li key={contentId} className={watched ? 'episode episode-watched' : 'episode'}>
                        <label className="check check-episode">
                          <input type="checkbox" checked={watched} onChange={(e) => void onSetWatched(contentId, e.target.checked)} />
                          <span className="label">
                            <span className="main">
                              <span className="mono">#{watchNumber}</span> {content.displayTitle}
                            </span>
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ol>
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

