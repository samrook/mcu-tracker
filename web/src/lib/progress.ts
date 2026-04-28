import { useEffect, useState } from 'react'
import { openDb, STORE_PROGRESS, txDone } from './idb'
import { type ProgressExport, type ProgressRow } from './schema'

type ProgressMap = Record<string, ProgressRow>

async function getAllProgress(): Promise<ProgressMap> {
  const db = await openDb()
  const tx = db.transaction(STORE_PROGRESS, 'readonly')
  const store = tx.objectStore(STORE_PROGRESS)

  const req = store.getAll()
  const rows: ProgressRow[] = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as ProgressRow[])
    req.onerror = () => reject(req.error ?? new Error('Failed to read progress'))
  })

  await txDone(tx)
  db.close()

  const map: ProgressMap = {}
  for (const row of rows) map[row.contentId] = row
  return map
}

async function putProgress(row: ProgressRow): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE_PROGRESS, 'readwrite')
  tx.objectStore(STORE_PROGRESS).put(row)
  await txDone(tx)
  db.close()
}

async function putManyProgress(rows: ProgressRow[]): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE_PROGRESS, 'readwrite')
  const store = tx.objectStore(STORE_PROGRESS)
  for (const row of rows) store.put(row)
  await txDone(tx)
  db.close()
}

export async function clearAllProgress(): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE_PROGRESS, 'readwrite')
  tx.objectStore(STORE_PROGRESS).clear()
  await txDone(tx)
  db.close()
}

export async function exportProgress(): Promise<ProgressExport> {
  const map = await getAllProgress()
  const progress: ProgressExport['progress'] = {}
  for (const [contentId, row] of Object.entries(map)) {
    progress[contentId] = { watched: row.watched, updatedAt: row.updatedAt }
  }
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), progress }
}

export async function importProgress(payload: ProgressExport): Promise<void> {
  if (payload.schemaVersion !== 1) throw new Error(`Unsupported progress schemaVersion: ${String(payload.schemaVersion)}`)
  const entries = Object.entries(payload.progress ?? {})
  for (const [contentId, row] of entries) {
    if (!contentId) continue
    if (!row || typeof row.watched !== 'boolean' || typeof row.updatedAt !== 'string') continue
    await putProgress({ contentId, watched: row.watched, updatedAt: row.updatedAt })
  }
}

export async function replaceProgress(payload: ProgressExport): Promise<void> {
  if (payload.schemaVersion !== 1) throw new Error(`Unsupported progress schemaVersion: ${String(payload.schemaVersion)}`)
  const entries = Object.entries(payload.progress ?? {})
  const rows: ProgressRow[] = []
  for (const [contentId, row] of entries) {
    if (!contentId) continue
    if (!row || typeof row.watched !== 'boolean' || typeof row.updatedAt !== 'string') continue
    rows.push({ contentId, watched: row.watched, updatedAt: row.updatedAt })
  }

  const db = await openDb()
  const tx = db.transaction(STORE_PROGRESS, 'readwrite')
  const store = tx.objectStore(STORE_PROGRESS)
  store.clear()
  for (const row of rows) store.put(row)
  await txDone(tx)
  db.close()
}

export function useProgress() {
  const [map, setMap] = useState<ProgressMap>({})
  const [ready, setReady] = useState(false)

  async function reload() {
    const data = await getAllProgress()
    setMap(data)
  }

  useEffect(() => {
    let cancelled = false
    getAllProgress()
      .then((data) => {
        if (cancelled) return
        setMap(data)
        setReady(true)
      })
      .catch(() => {
        if (cancelled) return
        setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function setWatched(contentId: string, watched: boolean) {
    const row: ProgressRow = { contentId, watched, updatedAt: new Date().toISOString() }
    await putProgress(row)
    setMap((prev) => ({ ...prev, [contentId]: row }))
  }

  async function setManyWatched(contentIds: string[], watched: boolean) {
    const updatedAt = new Date().toISOString()
    const rows = contentIds.map((contentId) => ({ contentId, watched, updatedAt }))
    await putManyProgress(rows)
    setMap((prev) => {
      const next = { ...prev }
      for (const row of rows) next[row.contentId] = row
      return next
    })
  }

  async function clearAll() {
    await clearAllProgress()
    setMap({})
  }

  async function exportAll(): Promise<ProgressExport> {
    const progress: ProgressExport['progress'] = {}
    for (const [contentId, row] of Object.entries(map)) {
      progress[contentId] = { watched: row.watched, updatedAt: row.updatedAt }
    }
    return { schemaVersion: 1, exportedAt: new Date().toISOString(), progress }
  }

  async function importAll(payload: ProgressExport) {
    await replaceProgress(payload)
    await reload()
  }

  return { progressByContentId: map, ready, setWatched, setManyWatched, clearAll, exportAll, importAll }
}
