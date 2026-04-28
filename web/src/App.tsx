import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { type Watchlist, type ProgressExport } from './lib/schema'
import { loadWatchlist } from './lib/watchlist'
import { useProgress } from './lib/progress'

type TimelineGroup = {
  groupId: string
  orderStart: number
  orderEnd: number
  sourceLine: number
  sourceText: string
  displayText: string
  contentIds: string[]
}

function App() {
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null)
  const [watchlistError, setWatchlistError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unwatched' | 'watched'>('all')
  const [query, setQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

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

  const visibleGroups = useMemo(() => {
    if (!watchlist) return []

    const groups: TimelineGroup[] = []
    const bySourceLine = new Map<number, TimelineGroup>()

    for (const entry of watchlist.timeline) {
      const existing = bySourceLine.get(entry.sourceLine)
      if (existing) {
        existing.orderEnd = entry.order
        existing.contentIds.push(entry.contentId)
      } else {
        const group: TimelineGroup = {
          groupId: `line:${entry.sourceLine}`,
          orderStart: entry.order,
          orderEnd: entry.order,
          sourceLine: entry.sourceLine,
          sourceText: entry.sourceText,
          displayText: entry.sourceText,
          contentIds: [entry.contentId],
        }
        bySourceLine.set(entry.sourceLine, group)
        groups.push(group)
      }
    }

    const flattened: TimelineGroup[] = []
    for (const group of groups) {
      const contents = group.contentIds.map((id) => watchlist.contents[id]).filter(Boolean)
      const isMultiMovie =
        group.contentIds.length > 1 && contents.length === group.contentIds.length && contents.every((c) => c.kind === 'movie' || c.kind === 'special')

      if (!isMultiMovie) {
        flattened.push(group)
        continue
      }

      for (let idx = 0; idx < group.contentIds.length; idx += 1) {
        const contentId = group.contentIds[idx]
        const content = watchlist.contents[contentId]
        if (!content) continue
        const order = group.orderStart + idx
        flattened.push({
          groupId: `${group.groupId}:entry:${order}`,
          orderStart: order,
          orderEnd: order,
          sourceLine: group.sourceLine,
          sourceText: group.sourceText,
          displayText: content.displayTitle,
          contentIds: [contentId],
        })
      }
    }

    const q = query.trim().toLowerCase()

    return flattened.filter((group) => {
      const contents = group.contentIds.map((id) => watchlist.contents[id]).filter(Boolean)
      if (contents.length === 0) return false

      const watchedCount = group.contentIds.reduce((acc, id) => acc + (progressByContentId[id]?.watched ? 1 : 0), 0)
      const isAllWatched = watchedCount === group.contentIds.length
      const isAnyWatched = watchedCount > 0

      if (filter === 'watched' && !isAllWatched) return false
      if (filter === 'unwatched' && isAnyWatched) return false

      if (!q) return true
      const haystack = `${group.sourceText} ${group.displayText} ${contents.map((c) => `${c.displayTitle} ${c.title}`).join(' ')}`.toLowerCase()
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

  async function setManyWatched(contentIds: string[], watched: boolean) {
    for (const contentId of contentIds) {
      // eslint-disable-next-line no-await-in-loop
      await setWatched(contentId, watched)
    }
  }

  function toggleGroupExpanded(groupId: string) {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
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
              {visibleGroups.map((group) => {
                const contents = group.contentIds.map((id) => watchlist.contents[id]).filter(Boolean)
                if (contents.length === 0) return null

                const watchedCount = group.contentIds.reduce((acc, id) => acc + (progressByContentId[id]?.watched ? 1 : 0), 0)
                const isAllWatched = watchedCount === group.contentIds.length
                const isAnyWatched = watchedCount > 0
                const expanded = Boolean(expandedGroups[group.groupId])
                const rangeLabel =
                  group.orderStart === group.orderEnd ? `#${group.orderStart}` : `#${group.orderStart} - #${group.orderEnd}`

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
                          onChange={(e) => void setManyWatched(group.contentIds, e.target.checked)}
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
                        <button type="button" className="btn btn-small" onClick={() => toggleGroupExpanded(group.groupId)}>
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
                                <input
                                  type="checkbox"
                                  checked={watched}
                                  onChange={(e) => void setWatched(contentId, e.target.checked)}
                                />
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
        </>
      )}
    </div>
  )
}

export default App
