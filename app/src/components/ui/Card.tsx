import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Panel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('panel', className)} {...props}>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
      {children}
    </div>
  )
}

export function PanelHeader({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-edge-subtle bg-bg-elev/40">
      <div className="flex items-center gap-2">
        <span className="font-cond text-[11px] uppercase tracking-[0.16em] font-semibold text-snow">
          {label}
        </span>
        {hint && <span className="tag">{hint}</span>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

type Tone = 'snow' | 'cyan' | 'signal' | 'amber' | 'copper' | 'flare' | 'alarm'

const toneClass: Record<Tone, string> = {
  snow: 'text-snow',
  cyan: 'text-cyan',
  signal: 'text-signal',
  amber: 'text-amber',
  copper: 'text-copper',
  flare: 'text-flare',
  alarm: 'text-alarm',
}

export function Kpi({
  label,
  value,
  unit,
  tone = 'cyan',
  delta,
}: {
  label: string
  value: string | number
  unit?: string
  tone?: Tone
  delta?: string
}) {
  return (
    <Panel className="px-4 py-3">
      <div className="flex items-start justify-between">
        <div className="tag">{label}</div>
        {delta && (
          <span className="font-mono text-[10px] text-signal">{delta}</span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 mt-1.5">
        <span className={cn('font-mono tabular-nums text-[26px] leading-none', toneClass[tone])}>
          {value}
        </span>
        {unit && <span className="font-mono text-xs text-ink-muted">{unit}</span>}
      </div>
    </Panel>
  )
}

export function DataRow({
  label,
  value,
  tone,
}: {
  label: ReactNode
  value: ReactNode
  tone?: Tone
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 border-b border-edge-subtle/60 last:border-b-0 font-mono text-[11px]">
      <span className="text-ink-muted">{label}</span>
      <span className={cn('tabular-nums', tone ? toneClass[tone] : 'text-ink')}>
        {value}
      </span>
    </div>
  )
}
