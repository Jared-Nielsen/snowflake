import { useUiStore } from '@/store/uiStore'
import type { TabKey } from '@/types'
import { cn } from '@/lib/utils'

interface TabEntry {
  key: TabKey
  code: string
  label: string
  sub: string
  toneActive: string
  roi: string
}

const TABS: TabEntry[] = [
  { key: 'home',           code: 'HOME',  label: 'Overview',           sub: 'Why Snowflake',     toneActive: 'text-snow',   roi: 'start here' },
  { key: 'refinery',       code: 'PLANT', label: 'Refinery',           sub: 'process train · 13 devices', toneActive: 'text-cyan', roi: '3D + flow' },
  { key: 'margin',         code: 'TK-01', label: 'Margin & Yield',     sub: 'CDU · Blending',     toneActive: 'text-cyan',   roi: '$6–12M' },
  { key: 'maintenance',    code: 'TK-02', label: 'Predictive Maint.',  sub: 'Reliability · ANOM', toneActive: 'text-amber',  roi: '$4–9M'  },
  { key: 'contract',       code: 'TK-03', label: 'Contract-to-Cash',   sub: 'Quorum · Sirion',    toneActive: 'text-signal', roi: '$1–2M'  },
  { key: 'trading',        code: 'TK-04', label: 'Trading & Risk',     sub: 'Endur · Hedge VAR',  toneActive: 'text-flare',  roi: '$1–2M'  },
  { key: 'sustainability', code: 'TK-05', label: 'Sustainability',     sub: 'Emissions · ESG',    toneActive: 'text-signal', roi: '$0.5–1.5M' },
  { key: 'logistics',      code: 'TK-06', label: 'Logistics',          sub: 'Berths · Tankers',   toneActive: 'text-snow',   roi: '$0.5–1.5M' },
  { key: 'cross',          code: 'TK-07', label: 'Cross-Cutting',      sub: 'Workforce · Audit',  toneActive: 'text-copper', roi: 'platform' },
  { key: 'devices',        code: 'CATALOG', label: 'Devices',          sub: '13 process devices', toneActive: 'text-cyan',   roi: '3D + telemetry' },
]

export function SideNav() {
  const tab = useUiStore(s => s.tab)
  const setTab = useUiStore(s => s.setTab)

  return (
    <nav className="w-[228px] shrink-0 border-r border-edge-subtle bg-bg-panel/60 backdrop-blur-sm relative z-20 flex flex-col">
      <div className="px-4 py-3 border-b border-edge-subtle">
        <div className="tag">USE CASE TOOLKITS</div>
        <div className="font-cond text-[11px] uppercase tracking-[0.16em] text-ink-dim mt-0.5">
          §6 · SRD v1.2 · 7 of 7
        </div>
      </div>
      <ul className="py-1 flex-1 overflow-y-auto">
        {TABS.map((t, i) => {
          const active = tab === t.key
          return (
            <li key={t.key}>
              <button
                onClick={() => setTab(t.key)}
                className={cn(
                  'w-full text-left px-4 py-3 border-l-2 transition-all group relative',
                  active
                    ? 'border-snow bg-snow/5'
                    : 'border-transparent hover:bg-bg-elev/30 hover:border-edge-strong',
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-mono text-[10px] tracking-widest',
                      active ? t.toneActive : 'text-ink-muted group-hover:text-ink-dim',
                    )}
                  >
                    {t.code}
                  </span>
                  {active && <span className="led led-green animate-pulse-soft" />}
                  <span className="ml-auto font-mono text-[9px] text-ink-muted">{t.roi}</span>
                </div>
                <div
                  className={cn(
                    'font-cond text-sm uppercase tracking-wide font-semibold mt-1 leading-tight',
                    active ? 'text-ink' : 'text-ink-dim group-hover:text-ink',
                  )}
                >
                  {t.label}
                </div>
                <div className="tag mt-0.5">{t.sub}</div>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="p-4 border-t border-edge-subtle bg-bg-panel/80">
        <div className="tag">SRD VERSION</div>
        <div className="font-mono text-xs text-ink-dim mt-0.5">v1.2 · 2026-05-12</div>
        <div className="mt-2 flex items-center gap-2">
          <span className="led led-green animate-pulse-soft" />
          <span className="tag-strong">FRONTEND ONLY · MOCK BACKEND</span>
        </div>
      </div>
    </nav>
  )
}
