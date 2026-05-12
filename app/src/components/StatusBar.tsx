import { useUiStore } from '@/store/uiStore'
import { useQueryStore } from '@/store/queryStore'
import { useStreamStore } from '@/store/streamStore'

export function StatusBar() {
  const operator = useUiStore(s => s.operator)
  const shift = useUiStore(s => s.shift)
  const alarms = useUiStore(s => s.alarms)
  const lastQ = useQueryStore(s => s.active)
  const running = useStreamStore(s => s.running)

  return (
    <footer className="h-9 border-t border-edge-subtle bg-bg-panel/90 backdrop-blur-md flex items-center px-4 gap-5 font-mono text-[11px] text-ink-muted relative z-30 shrink-0 overflow-x-auto">
      <div className="flex items-center gap-2">
        <span className="led led-green animate-pulse-soft" />
        <span className="tag-strong">SYS · NOMINAL</span>
      </div>
      <Sep />
      <span className="tag">OPERATOR</span>
      <span className="text-ink-dim">{operator}</span>
      <Sep />
      <span className="tag">SHIFT</span>
      <span className="text-ink-dim">{shift}</span>
      <Sep />
      <span className="tag">ALARMS</span>
      <span className={alarms > 0 ? 'text-amber' : 'text-ink-dim'}>
        {alarms.toString().padStart(2, '0')}
      </span>
      <Sep />
      <span className="tag">STREAM</span>
      <span className={running ? 'text-signal' : 'text-ink-muted'}>
        {running ? '1.5s tick · 8 series' : 'idle'}
      </span>
      <div className="flex-1" />
      {lastQ && (
        <>
          <span className="tag">LAST QUERY</span>
          <span className="text-cyan">{lastQ.warehouse}</span>
          <span className="text-ink-dim">{lastQ.duration_ms} ms · {lastQ.rows} rows</span>
          <Sep />
        </>
      )}
      <span className="text-ink-muted">SRD §7.0 · Interactive UI</span>
    </footer>
  )
}

function Sep() {
  return <span className="text-edge-strong">·</span>
}
