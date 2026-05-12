import { useEffect, useState } from 'react'
import { Snowflake, Radio, Activity, Pause } from 'lucide-react'
import { useStreamStore } from '@/store/streamStore'
import { useUiStore } from '@/store/uiStore'
import { utcStamp } from '@/lib/utils'
import { Badge } from './ui/Badge'

export function CommandBar() {
  const running = useStreamStore(s => s.running)
  const toggle = useStreamStore(s => s.toggle)
  const goHome = useUiStore(s => s.setTab)
  const [time, setTime] = useState(utcStamp())
  useEffect(() => {
    const i = setInterval(() => setTime(utcStamp()), 1000)
    return () => clearInterval(i)
  }, [])

  return (
    <header className="h-14 border-b border-edge-subtle bg-bg-panel/90 backdrop-blur-md flex items-center px-6 gap-6 relative z-30 shrink-0">
      <button
        onClick={() => goHome('home')}
        className="flex items-center gap-3 group cursor-pointer hover:opacity-90 transition-opacity"
        aria-label="go home"
      >
        <div className="relative">
          <Snowflake className="w-6 h-6 text-snow group-hover:text-cyan transition-colors" strokeWidth={1.5} />
          <span className="absolute inset-0 blur-md opacity-50">
            <Snowflake className="w-6 h-6 text-snow" strokeWidth={1.5} />
          </span>
        </div>
        <div className="leading-tight text-left">
          <div className="font-cond text-[10px] uppercase tracking-[0.22em] text-ink-muted">
            Snowflake AI Data Cloud
          </div>
          <div className="font-display text-sm font-bold tracking-tight">
            Decision Support Engine
          </div>
        </div>
      </button>

      <div className="h-8 w-px bg-edge-subtle" />

      <div className="flex items-center gap-2.5">
        <span className="tag">CLIENT</span>
        <span className="font-cond text-sm font-semibold uppercase tracking-wide">
          Texas Refining
        </span>
        <Badge tone="copper">League City · 280 kbpd</Badge>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-5 font-mono text-xs text-ink-dim">
        <div className="flex items-center gap-2">
          <span className="tag">UTC</span>
          <span className="lcd-green text-sm">{time}</span>
        </div>

        <button
          onClick={toggle}
          className="flex items-center gap-2 hover:text-cyan transition-colors group"
          aria-label={running ? 'pause stream' : 'start stream'}
        >
          <span className={`led ${running ? 'led-green animate-pulse-soft' : 'led-amber'}`} />
          {running
            ? <Activity className="w-3.5 h-3.5 text-signal group-hover:text-cyan" strokeWidth={2} />
            : <Pause className="w-3.5 h-3.5 text-amber group-hover:text-cyan" strokeWidth={2} />}
          <span className="font-cond text-[11px] uppercase tracking-[0.16em] font-semibold">
            {running ? 'Snowpipe · live' : 'Snowpipe · paused'}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-snow" strokeWidth={2} />
          <span className="font-cond text-[11px] uppercase tracking-[0.16em] font-semibold">
            XCMP · zero-copy · 6 sources
          </span>
        </div>
      </div>
    </header>
  )
}
