import { create } from 'zustand'
import { runQuery, type QueryResult } from '@/lib/snowflakeClient'

interface QueryState {
  history: QueryResult[]
  active: QueryResult | null
  running: boolean
  run: (sql: string, opts?: { rows?: number; cortex?: boolean; mock?: unknown; minMs?: number; maxMs?: number }) => Promise<QueryResult>
}

export const useQueryStore = create<QueryState>((set) => ({
  history: [],
  active: null,
  running: false,
  run: async (sql, opts = {}) => {
    set({ running: true })
    const res = await runQuery(sql, {
      mock: opts.mock ?? null,
      rows: opts.rows,
      cortex: opts.cortex,
      minMs: opts.minMs,
      maxMs: opts.maxMs,
    })
    set(state => ({
      active: res,
      history: [res, ...state.history].slice(0, 20),
      running: false,
    }))
    return res
  },
}))
