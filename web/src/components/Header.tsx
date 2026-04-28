import { type ProgressExport } from '../lib/schema'

export function Header(props: {
  ready: boolean
  onExport: () => void | Promise<void>
  onImport: (payload: ProgressExport) => void | Promise<void>
  onReset: () => void | Promise<void>
}) {
  const { ready, onExport, onImport, onReset } = props

  async function handleImport(file: File | null) {
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text) as ProgressExport
    await onImport(data)
  }

  return (
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
          <input className="file" type="file" accept="application/json" onChange={(e) => void handleImport(e.target.files?.[0] ?? null)} />
        </label>
        <button type="button" className="btn btn-danger" onClick={onReset} disabled={!ready}>
          Reset
        </button>
      </div>
    </header>
  )
}
