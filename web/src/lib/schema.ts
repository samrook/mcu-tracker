export type ContentKind = 'movie' | 'special' | 'episode' | 'unexpanded_series'

export type SeriesRef = {
  key: string
  title: string
  season: number
  episode: number
}

export type Content = {
  contentId: string
  kind: ContentKind
  title: string
  displayTitle: string
  unreleased?: boolean
  series?: SeriesRef
}

export type TimelineEntry = {
  entryId: string
  contentId: string
  order: number
  sourceLine: number
  sourceText: string
}

export type Watchlist = {
  schemaVersion: 1
  generatedAt: string
  contents: Record<string, Content>
  timeline: TimelineEntry[]
}

export type ProgressRow = {
  contentId: string
  watched: boolean
  updatedAt: string
}

export type ProgressExport = {
  schemaVersion: 1
  exportedAt: string
  progress: Record<string, { watched: boolean; updatedAt: string }>
}

