import { type FilterMode } from '../lib/timeline'

export function Controls(props: {
  filter: FilterMode
  onChangeFilter: (value: FilterMode) => void
  query: string
  onChangeQuery: (value: string) => void
}) {
  const { filter, onChangeFilter, query, onChangeQuery } = props

  return (
    <div className="card controls">
      <div className="filters" role="group" aria-label="Filters">
        <button type="button" className={filter === 'all' ? 'pill pill-active' : 'pill'} onClick={() => onChangeFilter('all')}>
          All
        </button>
        <button
          type="button"
          className={filter === 'unwatched' ? 'pill pill-active' : 'pill'}
          onClick={() => onChangeFilter('unwatched')}
        >
          Unwatched
        </button>
        <button type="button" className={filter === 'watched' ? 'pill pill-active' : 'pill'} onClick={() => onChangeFilter('watched')}>
          Watched
        </button>
      </div>

      <input
        className="search"
        value={query}
        onChange={(e) => onChangeQuery(e.target.value)}
        placeholder="Search…"
        aria-label="Search"
      />
    </div>
  )
}

