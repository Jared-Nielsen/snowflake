import { faker } from '@faker-js/faker'
import type {
  CogniteAsset,
  CogniteReading,
  Commodity,
  EndurTrade,
  QuorumFlow,
  SapFinancial,
  SensorKind,
  SirionContract,
} from '@/types'

// =============================================================================
// Seeded — runs once at module load so every demo session is reproducible.
// =============================================================================
faker.seed(20260512)

// Canonical anchor batch — tied to SRD §3 sample rows so the demo screen-matches.
export const ANCHOR_BATCH = 'BATCH-20260512-001'

// Hand-curated assets (the rows the SRD references). Realistic refinery IDs.
export const ASSETS: CogniteAsset[] = [
  { asset_id: 'CDU-100',  name: 'Crude Distillation Unit 100', type: 'column',     location: 'Crude Unit 1',  unit: 'UNIT-CD-01',  installed: '2014-06-12', criticality: 'A', parent: null },
  { asset_id: 'PUMP-401', name: 'Centrifugal Pump 401',        type: 'pump',       location: 'Crude Unit 1',  unit: 'UNIT-CD-01',  installed: '2018-09-04', criticality: 'A', parent: 'CDU-100' },
  { asset_id: 'PUMP-402', name: 'Reflux Pump 402',             type: 'pump',       location: 'Crude Unit 1',  unit: 'UNIT-CD-01',  installed: '2019-03-18', criticality: 'B', parent: 'CDU-100' },
  { asset_id: 'HX-205',   name: 'Heat Exchanger 205',          type: 'exchanger',  location: 'FCC Unit',      unit: 'UNIT-FCC-01', installed: '2015-11-22', criticality: 'B', parent: null },
  { asset_id: 'TK-501',   name: 'Crude Tank 501',              type: 'tank',       location: 'Tank Farm',     unit: 'TF',          installed: '2008-04-01', criticality: 'A', parent: null },
  { asset_id: 'TK-502',   name: 'Distillate Tank 502',         type: 'tank',       location: 'Tank Farm',     unit: 'TF',          installed: '2009-06-15', criticality: 'B', parent: null },
  { asset_id: 'COMP-301', name: 'Wet Gas Compressor 301',      type: 'compressor', location: 'FCC Unit',      unit: 'UNIT-FCC-01', installed: '2012-02-10', criticality: 'A', parent: null },
]

// Cognite contextual tags — surfaced in the demo to mirror SRD §3 schema.
export const ASSET_TAGS: Record<string, string[]> = {
  'PUMP-401': ['vibration_high', 'seal_risk'],
  'PUMP-402': ['baseline'],
  'HX-205':   ['fouling_risk'],
  'CDU-100':  ['critical_path'],
  'TK-501':   ['hi_lvl_alarm'],
  'TK-502':   ['baseline'],
  'COMP-301': ['surge_risk'],
}

// Lightweight PRNG (mulberry32) — independent of faker so streaming stays cheap.
let prngState = 0xc0ffee
export function srand() {
  let t = (prngState += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function sensorUnit(s: SensorKind) {
  switch (s) {
    case 'vibration': return 'mm/s'
    case 'temperature': return '°C'
    case 'pressure': return 'bar'
    case 'flow': return 'kbbl/d'
    case 'level': return 'm'
  }
}

export function nextReading(asset_id: string, sensor: SensorKind, base = 3, noise = 0.4): CogniteReading {
  const v = base + (srand() - 0.5) * noise * 2
  return {
    ts: new Date().toISOString(),
    asset_id,
    sensor,
    value: Math.max(0, v),
    unit: sensorUnit(sensor),
    quality: srand() > 0.02 ? 'GOOD' : 'UNCERTAIN',
  }
}

// Sinusoidal-flavored history so charts look "alive" even before streaming starts.
export function seedHistory(asset_id: string, sensor: SensorKind, base = 3, noise = 0.4, count = 60): CogniteReading[] {
  const out: CogniteReading[] = []
  const now = Date.now()
  for (let i = count; i > 0; i--) {
    const sine = Math.sin(i / 5.2) * noise * 0.5
    const drift = Math.cos(i / 18) * noise * 0.25
    const jitter = (srand() - 0.5) * noise * 1.4
    out.push({
      ts: new Date(now - i * 1500).toISOString(),
      asset_id,
      sensor,
      value: Math.max(0, base + sine + drift + jitter),
      unit: sensorUnit(sensor),
      quality: 'GOOD',
    })
  }
  return out
}

// =============================================================================
// Source-system generators — first row of each is the SRD §3 canonical anchor.
// =============================================================================

// Canonical SRD anchor rows (these EXACT IDs are quoted in §3 sample tables)
export const ANCHOR_SAP: SapFinancial = {
  doc_id: 'FIN-001',
  posting_date: '2026-05-12',
  account: '4010-CRUDE',
  cost_center: 'CC-CDU',
  amount: 1_850_000,
  currency: 'USD',
  vendor: 'Supplier-X',
  batch_id: ANCHOR_BATCH,
}

export const ANCHOR_QUORUM: QuorumFlow = {
  flow_id: 'FLOW-001',
  batch_id: ANCHOR_BATCH,
  product: 'naphtha', // mapped to "Gasoline" in SRD narrative
  source: 'CDU-100',
  dest: 'BERTH-3',
  kbbl: 120,
  ts: '2026-05-12T18:00:00.000Z',
  invoice: 'FIN-001',
}

export const ANCHOR_SIRION: SirionContract = {
  contract_id: 'CON-789',
  counterparty: 'Supplier-X',
  type: 'crude_supply',
  start: '2025-12-01',
  end: '2026-12-31',
  tcv: 500_000 * 78.50,
  obligations: 24,
  fulfilled: 18,
  risk: 'low',
}

export const ANCHOR_ENDUR: EndurTrade = {
  trade_id: 'TRADE-001',
  contract_id: 'CON-789',
  side: 'buy',
  commodity: 'WTI',
  qty_kbbl: 80,
  price: 12.40, // crack spread $/bbl
  pnl: 327_200, // 80kbbl × $12.40 × small realized
  counterparty: 'Supplier-X',
  ts: '2026-05-12T17:45:00.000Z',
}

export function genSap(n = 13): SapFinancial[] {
  return [
    ANCHOR_SAP,
    ...Array.from({ length: n }, (_, i) => ({
      doc_id: `FIN-${(i + 2).toString().padStart(3, '0')}`,
      posting_date: faker.date.recent({ days: 14 }).toISOString().slice(0, 10),
      account: faker.helpers.arrayElement(['4010-CRUDE', '4020-PRODUCT', '5010-MAINT', '5020-UTIL']),
      cost_center: faker.helpers.arrayElement(['CC-CDU', 'CC-FCC', 'CC-TF', 'CC-LAB']),
      amount: faker.number.float({ min: 12_000, max: 4_800_000, fractionDigits: 2 }),
      currency: 'USD' as const,
      vendor: faker.company.name(),
      batch_id: i % 3 === 0 ? null : `BATCH-20260512-${((i % 9) + 2).toString().padStart(3, '0')}`,
    })),
  ]
}

export function genQuorum(n = 17): QuorumFlow[] {
  const products: QuorumFlow['product'][] = ['sweet_crude', 'sour_crude', 'naphtha', 'jet', 'diesel', 'vgo', 'resid']
  return [
    ANCHOR_QUORUM,
    ...Array.from({ length: n }, (_, i) => ({
      flow_id: `FLOW-${(i + 2).toString().padStart(3, '0')}`,
      batch_id: `BATCH-20260512-${((i % 9) + 2).toString().padStart(3, '0')}`,
      product: products[i % products.length],
      source: faker.helpers.arrayElement(['TK-501', 'TK-502', 'CDU-100', 'PIPE-IN-A', 'BERTH-3']),
      dest: faker.helpers.arrayElement(['CDU-100', 'TK-502', 'BERTH-3', 'PIPE-OUT-B', 'RAIL-NA']),
      kbbl: faker.number.float({ min: 4, max: 220, fractionDigits: 1 }),
      ts: faker.date.recent({ days: 1 }).toISOString(),
      invoice: i % 4 === 0 ? null : `FIN-${(i + 2).toString().padStart(3, '0')}`,
    })),
  ]
}

export function genSirion(n = 11): SirionContract[] {
  return [
    ANCHOR_SIRION,
    ...Array.from({ length: n }, (_, i) => {
      const tcv = faker.number.float({ min: 8_000_000, max: 240_000_000, fractionDigits: 0 })
      const obligations = faker.number.int({ min: 6, max: 48 })
      return {
        contract_id: `CON-${790 + i}`,
        counterparty: faker.company.name(),
        type: faker.helpers.arrayElement(['crude_supply', 'product_offtake', 'storage', 'transport']),
        start: faker.date.past({ years: 1 }).toISOString().slice(0, 10),
        end: faker.date.future({ years: 2 }).toISOString().slice(0, 10),
        tcv,
        obligations,
        fulfilled: faker.number.int({ min: Math.floor(obligations * 0.4), max: obligations }),
        risk: faker.helpers.arrayElement(['low', 'low', 'med', 'med', 'high']),
      }
    }),
  ]
}

export function genEndur(n = 17): EndurTrade[] {
  return [
    ANCHOR_ENDUR,
    ...Array.from({ length: n }, (_, i) => {
      const side = faker.helpers.arrayElement(['buy', 'sell']) as 'buy' | 'sell'
      const commodity = faker.helpers.arrayElement(['WTI', 'Brent', 'RBOB', 'HO', 'NG']) as Commodity
      const price =
        commodity === 'NG'    ? faker.number.float({ min: 2.5, max: 4.8, fractionDigits: 2 }) :
        commodity === 'WTI'   ? faker.number.float({ min: 71,  max: 89,  fractionDigits: 2 }) :
        commodity === 'Brent' ? faker.number.float({ min: 75,  max: 94,  fractionDigits: 2 }) :
        commodity === 'RBOB'  ? faker.number.float({ min: 2.1, max: 2.9, fractionDigits: 3 }) :
                                faker.number.float({ min: 2.3, max: 3.1, fractionDigits: 3 })
      return {
        trade_id: `TRADE-${(i + 2).toString().padStart(3, '0')}`,
        contract_id: i % 3 === 0 ? null : `CON-${790 + (i % 11)}`,
        side,
        commodity,
        qty_kbbl: faker.number.int({ min: 25, max: 500 }),
        price,
        pnl: faker.number.float({ min: -180_000, max: 420_000, fractionDigits: 0 }),
        counterparty: faker.company.name(),
        ts: faker.date.recent({ days: 2 }).toISOString(),
      }
    }),
  ]
}

// Materialized at module load — same rows every time. The FIRST row of each
// table is the canonical SRD §3 sample row, quoted by ID in the live UI.
export const SAP = genSap()
export const QUORUM = genQuorum()
export const SIRION = genSirion()
export const ENDUR = genEndur()
