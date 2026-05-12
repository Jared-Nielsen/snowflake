import { useStreamStore } from '@/store/streamStore'

interface TickerItem {
  key: string
  label: string
  unit: string
  warn: number
  threshold: number
}

const ITEMS: TickerItem[] = [
  { key: 'PUMP-401:vibration',  label: 'PUMP-401 VIB', unit: 'mm/s',    warn: 5.0, threshold: 6.0 },
  { key: 'PUMP-402:vibration',  label: 'PUMP-402 VIB', unit: 'mm/s',    warn: 4.0, threshold: 5.0 },
  { key: 'CDU-100:temperature', label: 'CDU-100 T',    unit: '°C',      warn: 365, threshold: 372 },
  { key: 'HX-205:pressure',     label: 'HX-205 P',     unit: 'bar',     warn: 7.0, threshold: 8.0 },
  { key: 'HX-205:temperature',  label: 'HX-205 T',     unit: '°C',      warn: 320, threshold: 330 },
  { key: 'TK-501:level',        label: 'TK-501 LVL',   unit: 'm',       warn: 18.6, threshold: 19.5 },
  { key: 'TK-502:level',        label: 'TK-502 LVL',   unit: 'm',       warn: 16,   threshold: 18 },
  { key: 'COMP-301:flow',       label: 'COMP-301 Q',   unit: 'kbbl/d',  warn: 152,  threshold: 160 },
]

export function TickerStrip() {
  const streams = useStreamStore(s => s.streams)
  return (
    <div className="h-9 border-b border-edge-subtle bg-bg-base/60 flex items-center gap-7 px-6 overflow-x-auto font-mono text-[11px] relative z-20 shrink-0">
      <span className="tag-strong text-snow shrink-0">LIVE · COGNITE</span>
      {ITEMS.map(it => {
        const arr = streams[it.key] || []
        const v = arr[arr.length - 1]?.value ?? 0
        const prev = arr[arr.length - 2]?.value ?? v
        const delta = v - prev
        const overWarn = v > it.warn
        const overThr = v > it.threshold
        const valueClass = overThr ? 'lcd' : overWarn ? 'text-amber' : 'lcd-green'
        return (
          <div key={it.key} className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="tag">{it.label}</span>
            <span className={valueClass}>{v.toFixed(1)}</span>
            <span className="text-ink-muted text-[10px]">{it.unit}</span>
            <span className={delta >= 0 ? 'text-signal text-[10px]' : 'text-alarm text-[10px]'}>
              {delta >= 0 ? '▲' : '▼'}{Math.abs(delta).toFixed(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
