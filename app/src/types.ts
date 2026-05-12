export type TabKey =
  | 'home'
  | 'refinery'
  | 'margin'
  | 'maintenance'
  | 'contract'
  | 'trading'
  | 'sustainability'
  | 'logistics'
  | 'cross'
  | 'devices'

export type SensorKind = 'vibration' | 'temperature' | 'pressure' | 'flow' | 'level'

export interface CogniteAsset {
  asset_id: string
  name: string
  type: 'pump' | 'column' | 'exchanger' | 'tank' | 'compressor'
  location: string
  unit: string
  installed: string
  criticality: 'A' | 'B' | 'C'
  parent: string | null
}

export interface CogniteReading {
  ts: string
  asset_id: string
  sensor: SensorKind
  value: number
  unit: string
  quality: 'GOOD' | 'BAD' | 'UNCERTAIN'
}

export interface SapFinancial {
  doc_id: string
  posting_date: string
  account: string
  cost_center: string
  amount: number
  currency: 'USD'
  vendor: string
  batch_id: string | null
}

export type CrudeProduct = 'sweet_crude' | 'sour_crude' | 'naphtha' | 'jet' | 'diesel' | 'vgo' | 'resid'

export interface QuorumFlow {
  flow_id: string
  batch_id: string
  product: CrudeProduct
  source: string
  dest: string
  kbbl: number
  ts: string
  invoice: string | null
}

export interface SirionContract {
  contract_id: string
  counterparty: string
  type: 'crude_supply' | 'product_offtake' | 'storage' | 'transport'
  start: string
  end: string
  tcv: number
  obligations: number
  fulfilled: number
  risk: 'low' | 'med' | 'high'
}

export type Commodity = 'WTI' | 'Brent' | 'RBOB' | 'HO' | 'NG'

export interface EndurTrade {
  trade_id: string
  contract_id: string | null
  side: 'buy' | 'sell'
  commodity: Commodity
  qty_kbbl: number
  price: number
  pnl: number
  counterparty: string
  ts: string
}
