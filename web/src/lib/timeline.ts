import { type Watchlist, type TimelineEntry, type Content } from './schema'

export type ProgressLike = Record<string, { watched: boolean } | undefined>

export type TimelineGroup = {
  groupId: string
  orderStart: number
  orderEnd: number
  sourceLine: number
  sourceText: string
  displayText: string
  contentIds: string[]
}

export type FilterMode = 'all' | 'unwatched' | 'watched'

function isMovieOrSpecial(content: Content) {
  return content.kind === 'movie' || content.kind === 'special'
}

export function getNextUpEntry(watchlist: Watchlist, progressByContentId: ProgressLike): TimelineEntry | null {
  for (const entry of watchlist.timeline) {
    if (!progressByContentId[entry.contentId]?.watched) return entry
  }
  return null
}

export function buildTimelineGroups(watchlist: Watchlist): TimelineGroup[] {
  const groups: TimelineGroup[] = []
  const bySourceLine = new Map<number, TimelineGroup>()

  for (const entry of watchlist.timeline) {
    const existing = bySourceLine.get(entry.sourceLine)
    if (existing) {
      existing.orderEnd = entry.order
      existing.contentIds.push(entry.contentId)
      continue
    }

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

  const flattened: TimelineGroup[] = []

  for (const group of groups) {
    const contents = group.contentIds.map((id) => watchlist.contents[id]).filter(Boolean)
    const isMultiMovie =
      group.contentIds.length > 1 &&
      contents.length === group.contentIds.length &&
      contents.every((c) => isMovieOrSpecial(c))

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

  return flattened
}

export function filterTimelineGroups(options: {
  groups: TimelineGroup[]
  watchlist: Watchlist
  progressByContentId: ProgressLike
  filter: FilterMode
  query: string
}): TimelineGroup[] {
  const { groups, watchlist, progressByContentId, filter, query } = options
  const q = query.trim().toLowerCase()

  return groups.filter((group) => {
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
}

