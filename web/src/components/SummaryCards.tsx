import { type TimelineEntry, type Watchlist } from '../lib/schema'

export function SummaryCards(props: {
  watchlist: Watchlist
  nextUp: TimelineEntry | null
  watchedCount: number
  totalCount: number
}) {
  const { watchlist, nextUp, watchedCount, totalCount } = props

  return (
    <div className="card grid">
      <div>
        <h2>Next up</h2>
        {nextUp ? (
          <p className="nextup">
            <span className="mono">#{nextUp.order}</span> {watchlist.contents[nextUp.contentId]?.displayTitle ?? nextUp.contentId}
          </p>
        ) : (
          <p>All caught up.</p>
        )}
      </div>
      <div>
        <h2>Progress</h2>
        <p>
          <span className="mono">
            {watchedCount}/{totalCount}
          </span>{' '}
          unique items watched
        </p>
      </div>
    </div>
  )
}

