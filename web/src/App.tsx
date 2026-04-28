import './App.css'
import { useMemo, useState } from 'react'
import { Header } from './components/Header'
import { SummaryCards } from './components/SummaryCards'
import { Controls } from './components/Controls'
import { Timeline } from './components/Timeline'
import { useWatchlist } from './hooks/useWatchlist'
import { type ProgressExport } from './lib/schema'
import { useProgress } from './lib/progress'
import { buildTimelineGroups, filterTimelineGroups, getNextUpEntry, type FilterMode } from './lib/timeline'

function App() {
  const { watchlist, error: watchlistError, loading } = useWatchlist()
  const [filter, setFilter] = useState<FilterMode>('all')
  const [query, setQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const { progressByContentId, setWatched, setManyWatched, ready, clearAll, exportAll, importAll } = useProgress()

  const stats = useMemo(() => {
    if (!watchlist) return null
    const contentIds = Object.keys(watchlist.contents)
    const watchedCount = contentIds.reduce((acc, contentId) => acc + (progressByContentId[contentId]?.watched ? 1 : 0), 0)
    return { watchedCount, totalCount: contentIds.length }
  }, [progressByContentId, watchlist])

  const groups = useMemo(() => (watchlist ? buildTimelineGroups(watchlist) : []), [watchlist])

  const visibleGroups = useMemo(() => {
    if (!watchlist) return []
    return filterTimelineGroups({ groups, watchlist, progressByContentId, filter, query })
  }, [filter, groups, progressByContentId, query, watchlist])

  const nextUp = useMemo(() => {
    if (!watchlist) return null
    return getNextUpEntry(watchlist, progressByContentId)
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

  async function onImport(payload: ProgressExport) {
    await importAll(payload)
  }

  async function onReset() {
    const ok = window.confirm('Clear all watched progress on this device/browser?')
    if (!ok) return
    await clearAll()
  }

  function toggleGroupExpanded(groupId: string) {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  return (
    <div className="app">
      <Header ready={ready} onExport={() => void onExport()} onImport={(p) => void onImport(p)} onReset={() => void onReset()} />

      {watchlistError ? (
        <div className="card error">
          <h2>Failed to load watchlist</h2>
          <p>{watchlistError}</p>
          <p>
            Make sure <code>web/public/watchlist.json</code> exists (run <code>node tools/build-watchlist.mjs</code>).
          </p>
        </div>
      ) : null}

      {loading || !watchlist ? (
        <div className="card">
          <p>Loading watchlist…</p>
        </div>
      ) : (
        <>
          <SummaryCards
            watchlist={watchlist}
            nextUp={nextUp}
            watchedCount={stats?.watchedCount ?? 0}
            totalCount={stats?.totalCount ?? 0}
          />

          <Controls filter={filter} onChangeFilter={setFilter} query={query} onChangeQuery={setQuery} />

          <Timeline
            watchlist={watchlist}
            groups={visibleGroups}
            expandedGroups={expandedGroups}
            onToggleExpanded={toggleGroupExpanded}
            progressByContentId={progressByContentId}
            onSetWatched={(contentId, watched) => void setWatched(contentId, watched)}
            onSetManyWatched={(contentIds, watched) => void setManyWatched(contentIds, watched)}
          />
        </>
      )}
    </div>
  )
}

export default App
