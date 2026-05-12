// Mock Snowflake client — no real network calls. Simulates plausible warehouse
// latency, scan size, and Cortex completion metadata for the sales pitch.

export interface QueryResult {
  query: string
  rows: number
  duration_ms: number
  bytes_scanned: number
  warehouse: string
  result: unknown
  cortex?: { model: string; tokens: number; confidence: number }
  ts: string
}

const WAREHOUSES = ['REFINERY_AI_XL', 'OPS_ANALYTICS_M', 'CORTEX_S', 'TRADING_RT_L'] as const
const CORTEX_MODELS = ['mixtral-8x7b', 'snowflake-arctic', 'reka-flash'] as const

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export async function runQuery(
  query: string,
  opts: {
    rows?: number
    cortex?: boolean
    mock: unknown
    minMs?: number
    maxMs?: number
  } = { mock: null },
): Promise<QueryResult> {
  const duration = rand(opts.minMs ?? 420, opts.maxMs ?? 1900)
  await new Promise(r => setTimeout(r, duration))
  return {
    query,
    rows: opts.rows ?? Math.floor(rand(4, 240)),
    duration_ms: Math.round(duration),
    bytes_scanned: Math.round(rand(0.4, 24) * 1024 * 1024),
    warehouse: WAREHOUSES[Math.floor(Math.random() * WAREHOUSES.length)],
    result: opts.mock,
    cortex: opts.cortex
      ? {
          model: CORTEX_MODELS[Math.floor(Math.random() * CORTEX_MODELS.length)],
          tokens: Math.floor(rand(180, 1400)),
          confidence: rand(0.78, 0.96),
        }
      : undefined,
    ts: new Date().toISOString(),
  }
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
