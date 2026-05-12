import { create } from 'zustand'
import type { CogniteReading, SensorKind } from '@/types'
import { nextReading, seedHistory } from '@/lib/mockData'

interface Subscription {
  key: string
  asset_id: string
  sensor: SensorKind
  base: number
  noise: number
}

interface StreamState {
  streams: Record<string, CogniteReading[]>
  running: boolean
  tickRateMs: number
  start: () => void
  stop: () => void
  toggle: () => void
  injectSpike: (key: string, multiplier?: number) => void
}

// Default subscriptions — one per "headline" sensor referenced by the SRD.
// Tabs may ensure additional ones at mount time.
const SUBSCRIPTIONS: Subscription[] = [
  { key: 'PUMP-401:vibration',   asset_id: 'PUMP-401', sensor: 'vibration',   base: 4.8, noise: 1.2 },
  { key: 'PUMP-402:vibration',   asset_id: 'PUMP-402', sensor: 'vibration',   base: 2.8, noise: 0.5 },
  { key: 'CDU-100:temperature',  asset_id: 'CDU-100',  sensor: 'temperature', base: 358, noise: 4 },
  { key: 'HX-205:temperature',   asset_id: 'HX-205',   sensor: 'temperature', base: 312, noise: 3 },
  { key: 'HX-205:pressure',      asset_id: 'HX-205',   sensor: 'pressure',    base: 6.4, noise: 0.3 },
  { key: 'TK-501:level',         asset_id: 'TK-501',   sensor: 'level',       base: 18.2, noise: 0.4 },
  { key: 'TK-502:level',         asset_id: 'TK-502',   sensor: 'level',       base: 14.6, noise: 0.5 },
  { key: 'COMP-301:flow',        asset_id: 'COMP-301', sensor: 'flow',        base: 142, noise: 6 },
]

let timer: ReturnType<typeof setInterval> | null = null

// Inject occasional anomaly spikes on PUMP-401 so the maintenance demo
// crosses thresholds naturally during the live pitch.
function maybeAnomaly(sub: Subscription): number {
  if (sub.key === 'PUMP-401:vibration' && Math.random() < 0.07) return sub.base * 1.85
  return sub.base
}

export const useStreamStore = create<StreamState>((set) => ({
  streams: Object.fromEntries(
    SUBSCRIPTIONS.map(s => [s.key, seedHistory(s.asset_id, s.sensor, s.base, s.noise)]),
  ),
  running: false,
  tickRateMs: 1500,
  injectSpike: (key, multiplier = 2) => {
    const sub = SUBSCRIPTIONS.find(s => s.key === key)
    if (!sub) return
    set(state => {
      const arr = state.streams[key] || []
      const r = nextReading(sub.asset_id, sub.sensor, sub.base * multiplier, sub.noise)
      return { streams: { ...state.streams, [key]: [...arr.slice(-119), r] } }
    })
  },
  start: () => {
    if (timer) return
    set({ running: true })
    timer = setInterval(() => {
      set(state => {
        const next: Record<string, CogniteReading[]> = { ...state.streams }
        for (const sub of SUBSCRIPTIONS) {
          const arr = next[sub.key] || []
          const base = maybeAnomaly(sub)
          const r = nextReading(sub.asset_id, sub.sensor, base, sub.noise)
          next[sub.key] = [...arr.slice(-119), r]
        }
        return { streams: next }
      })
    }, 1500)
  },
  stop: () => {
    if (timer) clearInterval(timer)
    timer = null
    set({ running: false })
  },
  toggle: () => {
    if (timer) {
      clearInterval(timer)
      timer = null
      set({ running: false })
    } else {
      set({ running: true })
      timer = setInterval(() => {
        set(state => {
          const next: Record<string, CogniteReading[]> = { ...state.streams }
          for (const sub of SUBSCRIPTIONS) {
            const arr = next[sub.key] || []
            const base = maybeAnomaly(sub)
            const r = nextReading(sub.asset_id, sub.sensor, base, sub.noise)
            next[sub.key] = [...arr.slice(-119), r]
          }
          return { streams: next }
        })
      }, 1500)
    }
  },
}))
