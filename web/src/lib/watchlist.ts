import { type Watchlist } from './schema'

export async function loadWatchlist(): Promise<Watchlist> {
  const res = await fetch('watchlist.json', { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status} loading watchlist.json`)
  const data = (await res.json()) as Watchlist
  if (data.schemaVersion !== 1) throw new Error(`Unsupported watchlist schemaVersion: ${String(data.schemaVersion)}`)
  return data
}

