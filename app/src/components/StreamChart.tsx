import { useMemo } from 'react'
import { useStreamStore } from '@/store/streamStore'
import { cn } from '@/lib/utils'

export interface StreamChartProps {
  streamKey: string
  threshold?: number
  warn?: number
  height?: number
  label?: string
  unit?: string
  /** When true, render compact (no labels, no axis tags). */
  compact?: boolean
}

export function StreamChart({
  streamKey,
  threshold,
  warn,
  height = 140,
  label,
  unit,
  compact,
}: StreamChartProps) {
  const arr = useStreamStore(s => s.streams[streamKey] || [])

  const { d, area, points, min, max, last, prev } = useMemo(() => {
    if (arr.length < 2) {
      return { d: '', area: '', points: [], min: 0, max: 1, last: 0, prev: 0 }
    }
    const values = arr.map(r => r.value)
    const minV = Math.min(...values, threshold ?? Infinity, warn ?? Infinity) * 0.98
    const maxV = Math.max(...values, threshold ?? -Infinity, warn ?? -Infinity) * 1.04
    const range = maxV - minV || 1
    const w = 800
    const h = height
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - minV) / range) * h
      return [x, y] as [number, number]
    })
    const dPath = pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ')
    const areaPath = dPath + ` L ${w} ${h} L 0 ${h} Z`
    return {
      d: dPath,
      area: areaPath,
      points: pts,
      min: minV,
      max: maxV,
      last: values[values.length - 1],
      prev: values[values.length - 2],
    }
  }, [arr, threshold, warn, height])

  if (arr.length < 2) {
    return (
      <div className="text-xs text-ink-muted font-mono">
        waiting for stream…
      </div>
    )
  }

  const overWarn = warn !== undefined && last > warn
  const overThresh = threshold !== undefined && last > threshold
  const w = 800
  const h = height
  const range = max - min || 1
  const delta = last - prev

  return (
    <div>
      {label && !compact && (
        <div className="flex items-baseline justify-between mb-2">
          <span className="tag">{label}</span>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'font-mono tabular-nums text-xl',
                overThresh ? 'lcd-red' : overWarn ? 'lcd' : 'lcd-green',
              )}
            >
              {last.toFixed(2)}
            </span>
            {unit && <span className="text-[10px] font-mono text-ink-muted">{unit}</span>}
            <span
              className={cn(
                'font-mono text-[10px]',
                delta >= 0 ? 'text-signal' : 'text-alarm',
              )}
            >
              {delta >= 0 ? '▲' : '▼'}{Math.abs(delta).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height }}
      >
        <defs>
          <linearGradient id={`g-${streamKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={overThresh ? 'rgb(239,68,68)' : 'rgb(78,226,244)'} stopOpacity="0.35" />
            <stop offset="100%" stopColor={overThresh ? 'rgb(239,68,68)' : 'rgb(78,226,244)'} stopOpacity="0" />
          </linearGradient>
          <pattern id={`grid-${streamKey}`} width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgb(30,48,73)" strokeWidth="0.4" />
          </pattern>
        </defs>

        <rect width={w} height={h} fill={`url(#grid-${streamKey})`} />

        {warn !== undefined && (() => {
          const y = h - ((warn - min) / range) * h
          return (
            <g>
              <line x1={0} x2={w} y1={y} y2={y} stroke="rgb(255,182,39)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
              <text x={w - 4} y={y - 4} fontSize="9" fill="rgb(255,182,39)" textAnchor="end" fontFamily="IBM Plex Mono">warn {warn}</text>
            </g>
          )
        })()}
        {threshold !== undefined && (() => {
          const y = h - ((threshold - min) / range) * h
          return (
            <g>
              <line x1={0} x2={w} y1={y} y2={y} stroke="rgb(239,68,68)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.6" />
              <text x={w - 4} y={y - 4} fontSize="9" fill="rgb(239,68,68)" textAnchor="end" fontFamily="IBM Plex Mono">trip {threshold}</text>
            </g>
          )
        })()}

        <path d={area} fill={`url(#g-${streamKey})`} />
        <path
          d={d}
          fill="none"
          stroke={overThresh ? 'rgb(239,68,68)' : overWarn ? 'rgb(255,182,39)' : 'rgb(78,226,244)'}
          strokeWidth="1.5"
        />
        {points.length > 0 && (
          <>
            <circle
              cx={points[points.length - 1][0]}
              cy={points[points.length - 1][1]}
              r="3.5"
              fill={overThresh ? 'rgb(239,68,68)' : overWarn ? 'rgb(255,182,39)' : 'rgb(78,226,244)'}
            />
            <circle
              cx={points[points.length - 1][0]}
              cy={points[points.length - 1][1]}
              r="7"
              fill="none"
              stroke={overThresh ? 'rgb(239,68,68)' : 'rgb(78,226,244)'}
              strokeWidth="1"
              opacity="0.6"
              className="animate-pulse-soft"
            />
          </>
        )}
      </svg>
    </div>
  )
}
