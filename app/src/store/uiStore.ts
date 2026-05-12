import { create } from 'zustand'
import type { TabKey } from '@/types'

interface UiState {
  tab: TabKey
  setTab: (t: TabKey) => void
  operator: string
  shift: 'A' | 'B' | 'C' | 'D'
  alarms: number
  setAlarms: (n: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  tab: 'home',
  setTab: (t) => set({ tab: t }),
  operator: 'J. WHEELER',
  shift: 'B',
  alarms: 2,
  setAlarms: (n) => set({ alarms: n }),
}))
