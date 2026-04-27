import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { type Watchlist, type ProgressExport } from './lib/schema'
import { loadWatchlist } from './lib/watchlist'
import { useProgress } from './lib/progress'

function App() {
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null)
  const [watchlistError, setWatchlistError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unwatched' | 'watched'>('all')
  const [query, setQuery] = useState('')

  const { progressByContentId, setWatched, ready, clearAll, exportAll, importAll } = useProgress()

  useEffect(() => {
    let cancelled = false
    loadWatchlist()
      .then((data) => {
        if (!cancelled) setWatchlist(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setWatchlistError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    if (!watchlist) return null
    const contentIds = Object.keys(watchlist.contents)
    const watchedCount = contentIds.reduce((acc, contentId) => acc + (progressByContentId[contentId]?.watched ? 1 : 0), 0)
    return { watchedCount, totalCount: contentIds.length }
  }, [progressByContentId, watchlist])

  const visibleTimeline = useMemo(() => {
    if (!watchlist) return []
    const q = query.trim().toLowerCase()
    return watchlist.timeline.filter((entry) => {
      const content = watchlist.contents[entry.contentId]
      if (!content) return false

      const watched = Boolean(progressByContentId[entry.contentId]?.watched)
      if (filter === 'watched' && !watched) return false
      if (filter === 'unwatched' && watched) return false

      if (!q) return true
      const haystack = `${content.displayTitle} ${content.title} ${entry.sourceText}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [filter, progressByContentId, query, watchlist])

  const nextUp = useMemo(() => {
    if (!watchlist) return null
    for (const entry of watchlist.timeline) {
      if (!progressByContentId[entry.contentId]?.watched) return entry
    }
    return null
  }, [progressByContentId, watchlist])

  async function onExport() {
    const payload = await exportAll()
    const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = `mcu-tracker-progress-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  async function onImport(file: File | null) {
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text) as ProgressExport
    await importAll(data)
  }

  async function onReset() {
    const ok = window.confirm('Clear all watched progress on this device/browser?')
    if (!ok) return
    await clearAll()
  }

  return (
    <div className="app">
      <header className="header">
        <div className="title">
          <h1>MCU Tracker</h1>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={onExport} disabled={!ready}>
            Export
          </button>
          <label className="btn btn-secondary">
            Import
            <input
              className="file"
              type="file"
              accept="application/json"
              onChange={(e) => void onImport(e.target.files?.[0] ?? null)}
            />
          </label>
          <button type="button" className="btn btn-danger" onClick={onReset} disabled={!ready}>
            Reset
          </button>
        </div>
      </header>

      {watchlistError ? (
        <div className="card error">
          <h2>Failed to load watchlist</h2>
          <p>{watchlistError}</p>
          <p>
            Make sure <code>web/public/watchlist.json</code> exists (run <code>node tools/build-watchlist.mjs</code>).
          </p>
        </div>
      ) : null}

      {!watchlist ? (
        <div className="card">
          <p>Loading watchlist…</p>
        </div>
      ) : (
        <>
          <div className="card grid">
            <div>
              <h2>Next up</h2>
              {nextUp ? (
                <p className="nextup">
                  <span className="mono">#{nextUp.order}</span>{' '}
                  {watchlist.contents[nextUp.contentId]?.displayTitle ?? nextUp.contentId}
                </p>
              ) : (
                <p>All caught up.</p>
              )}
            </div>
            <div>
              <h2>Progress</h2>
              <p>
                {stats ? (
                  <>
                    <span className="mono">
                      {stats.watchedCount}/{stats.totalCount}
                    </span>{' '}
                    unique items watched
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </div>

          <div className="card controls">
            <div className="filters" role="group" aria-label="Filters">
              <button
                type="button"
                className={filter === 'all' ? 'pill pill-active' : 'pill'}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={filter === 'unwatched' ? 'pill pill-active' : 'pill'}
                onClick={() => setFilter('unwatched')}
              >
                Unwatched
              </button>
              <button
                type="button"
                className={filter === 'watched' ? 'pill pill-active' : 'pill'}
                onClick={() => setFilter('watched')}
              >
                Watched
              </button>
            </div>

            <input
              className="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Search"
            />
          </div>

          <div className="card list">
            <ol className="timeline">
              {visibleTimeline.map((entry) => {
                const content = watchlist.contents[entry.contentId]
                if (!content) return null
                const watched = Boolean(progressByContentId[entry.contentId]?.watched)

                return (
                  <li key={entry.entryId} className={watched ? 'row row-watched' : 'row'}>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={watched}
                        onChange={(e) => void setWatched(entry.contentId, e.target.checked)}
                      />
                      <span className="label">
                        <span className="main">
                          <span className="mono">#{entry.order}</span> {content.displayTitle}
                        </span>
                        <span className="meta">
                          <span className="mono">list.txt:{entry.sourceLine}</span>
                          {content.unreleased ? <span className="tag">Unreleased</span> : null}
                          {content.kind === 'unexpanded_series' ? (
                            <span className="tag tag-warn">Needs expansion</span>
                          ) : null}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ol>
          </div>
        </>
      )}
    </div>
  )
}

export default App
