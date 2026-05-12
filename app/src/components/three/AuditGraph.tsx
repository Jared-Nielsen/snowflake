import { useRef, useState } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useInspectorStore } from '@/store/inspectorStore'
import type { NodeInspectorDetails, EdgeInspectorDetails } from '@/store/inspectorStore'

const COLOR = {
  fog:    '#080e18',
  snow:   '#1ea7ff',
  cyan:   '#4ee2f4',
  amber:  '#ffb627',
  signal: '#34d57b',
  alarm:  '#ef4444',
  copper: '#c79a4a',
  flare:  '#ff6b35',
  steel:  '#1e3049',
  steelDk:'#132033',
  muted:  '#8aa0c5',
  inkDim: '#8aa0c5',
} as const

const HORIZON_FLOW_KEY = 'horizon-3d'

interface GraphNode {
  id: string
  label: string
  color: string
  pos: [number, number, number]
  size?: number
  details: NodeInspectorDetails
}

const NODES: GraphNode[] = [
  {
    id: 'COGNITE', label: 'COGNITE', color: COLOR.amber, pos: [-3, 2, 0],
    details: {
      subsystem: 'OT · INDUSTRIAL GRAPH',
      summary: 'Cognite Data Fusion — the operational truth of every refinery asset, sensor and event. Connected to Snowflake via zero-copy share.',
      toolkit: 'system · source',
      kpis: [
        { label: 'assets',          value: '13,402',  tone: 'cyan' },
        { label: 'time-series tags', value: '1.1M',   tone: 'snow' },
        { label: 'share latency',   value: '< 60 s', tone: 'signal' },
        { label: 'role',            value: 'OT canon', tone: 'amber' },
      ],
      columns: [
        { name: 'asset_id',     type: 'string', example: 'PUMP-401' },
        { name: 'parent_asset', type: 'string', example: 'UNIT-CD-01' },
        { name: 'criticality',  type: 'string', example: 'A' },
        { name: 'tags',         type: 'array',  example: 'vibration_high · seal_risk' },
      ],
      lineage: {
        source: 'cognite.fusion.assets + cognite.fusion.timeseries',
        target: 'snowflake.bronze.cognite_v (zero-copy share)',
        refresh: 'zero-copy · stream',
        hash:    'hzn_cognite_share_2026',
      },
      analysis:
        'Cognite remains the industrial knowledge graph. Snowflake reads a governed view of it. No ETL, no duplication, no schema drift.',
    },
  },
  {
    id: 'SAP', label: 'SAP', color: COLOR.copper, pos: [-3, -2, 0],
    details: {
      subsystem: 'ERP · FINANCIALS',
      summary: 'SAP S/4HANA — the financial truth. General ledger, accounts payable / receivable, batch landed cost, settlement.',
      toolkit: 'system · source',
      kpis: [
        { label: 'gl postings · /d', value: '12.4k',  tone: 'snow' },
        { label: 'share format',     value: 'BDC',    tone: 'cyan' },
        { label: 'latency',          value: '< 5 s',  tone: 'signal' },
        { label: 'role',             value: 'finance canon', tone: 'copper' },
      ],
      columns: [
        { name: 'transaction_id', type: 'string',    example: 'FIN-001' },
        { name: 'batch_id',       type: 'string',    example: 'BATCH-20260512-001' },
        { name: 'cost_type',      type: 'string',    example: 'crude_landed' },
        { name: 'amount_usd',     type: 'numeric',   example: '1850000' },
        { name: 'posting_date',   type: 'timestamp', example: '2026-05-12T17:00:00Z' },
      ],
      lineage: {
        source: 'sap.s4.fi_gl + co_costing',
        target: 'snowflake.bronze.sap_v (zero-copy)',
        refresh: 'zero-copy · < 5 s',
      },
    },
  },
  {
    id: 'QUORUM', label: 'QUORUM', color: COLOR.signal, pos: [3, 2, 0],
    details: {
      subsystem: 'PHYSICAL FLOWS · BILLING',
      summary: 'Quorum hydrocarbon accounting — every physical flow, every billing ticket, every measurement.',
      toolkit: 'system · source',
      kpis: [
        { label: 'flow tickets · /h', value: '~8k',    tone: 'signal' },
        { label: 'snowpipe lag',      value: '< 60 s', tone: 'signal' },
        { label: 'throughput',        value: '5k ev/s', tone: 'snow' },
      ],
      columns: [
        { name: 'flow_id',  type: 'string',    example: 'FLOW-001' },
        { name: 'batch_id', type: 'string',    example: 'BATCH-20260512-001' },
        { name: 'product',  type: 'string',    example: 'gasoline' },
        { name: 'kbbl',     type: 'numeric',   example: '120' },
        { name: 'ts',       type: 'timestamp', example: '2026-05-12T18:00:00Z' },
      ],
      lineage: {
        source: 'kafka.quorum.flows.v1',
        target: 'quorum.gold.flows',
        refresh: '< 60 s · streaming',
      },
    },
  },
  {
    id: 'SIRION', label: 'SIRION', color: COLOR.cyan, pos: [3, -2, 0],
    details: {
      subsystem: 'CONTRACTS · OBLIGATIONS',
      summary: 'Sirion master contracts. CON-789 sweet crude supply, CON-790 gasoline offtake, CON-791 transport.',
      toolkit: 'system · source',
      kpis: [
        { label: 'active contracts', value: '24',    tone: 'cyan' },
        { label: 'TCV (12 mo)',      value: '$1.4B', tone: 'snow' },
        { label: 'snowpipe lag',     value: '< 5 m', tone: 'signal' },
      ],
      columns: [
        { name: 'contract_id',  type: 'string',  example: 'CON-789' },
        { name: 'counterparty', type: 'string',  example: 'Supplier-X' },
        { name: 'volume_min',   type: 'numeric', example: '500000' },
        { name: 'expiry',       type: 'date',    example: '2026-12-31' },
        { name: 'clauses',      type: 'json',    example: '{ force_majeure: true }' },
      ],
      lineage: {
        source: 's3://sirion-export/contracts/',
        target: 'sirion.gold.contracts',
        refresh: '< 5 m · Snowpipe',
      },
    },
  },
  {
    id: 'ENDUR', label: 'ENDUR', color: COLOR.flare, pos: [0, 3, -2],
    details: {
      subsystem: 'TRADING BOOK',
      summary: 'Endur paper book. Crack spreads, futures, swaps. TRADE-001 currently long 80 kbbl crack at $12.40.',
      toolkit: 'system · source',
      kpis: [
        { label: 'open positions', value: '184',     tone: 'flare' },
        { label: 'notional',       value: '$220M',   tone: 'snow' },
        { label: 'snowpipe lag',   value: '< 30 s',  tone: 'signal' },
      ],
      columns: [
        { name: 'trade_id',  type: 'string',    example: 'TRADE-001' },
        { name: 'commodity', type: 'string',    example: 'crack_321' },
        { name: 'side',      type: 'string',    example: 'buy' },
        { name: 'qty_kbbl',  type: 'numeric',   example: '80' },
        { name: 'price',     type: 'numeric',   example: '12.40' },
      ],
      lineage: {
        source: 'kafka.endur.trades.v1',
        target: 'endur.gold.positions',
        refresh: '< 30 s · streaming',
      },
    },
  },
  {
    id: 'SNOWFLAKE', label: 'SNOWFLAKE', color: COLOR.snow, pos: [0, 0, 0], size: 0.6,
    details: {
      subsystem: 'AI DATA CLOUD · HUB',
      summary: 'Snowflake AI Data Cloud — the unified data plane. Bronze → Silver → Gold medallion, Cortex AI, Snowpark, Horizon governance.',
      toolkit: 'platform',
      kpis: [
        { label: 'datasets',         value: '247',     tone: 'snow' },
        { label: 'gold objects',     value: '64',      tone: 'cyan' },
        { label: 'warehouses',       value: '6 active', tone: 'signal' },
        { label: 'monthly credits',  value: '~670',    tone: 'snow' },
      ],
      columns: [
        { name: 'bronze_v',   type: 'view', example: '5 source-aligned' },
        { name: 'silver_dt',  type: 'dynamic_table', example: '18 harmonized' },
        { name: 'gold_v',     type: 'view', example: '~40 semantic' },
      ],
      lineage: {
        source: 'all 5 source systems',
        target: 'operator UI · trader desk · ESG reports',
        refresh: 'continuous',
        hash:    'hzn_snowflake_data_plane',
      },
      analysis:
        'Snowflake hosts every join, every model, every recommendation. No source-system database is queried directly by downstream consumers.',
    },
  },
  {
    id: 'CORTEX', label: 'CORTEX', color: COLOR.cyan, pos: [0, 0, 2.4],
    details: {
      subsystem: 'AI · REASONING',
      summary: 'Cortex AI suite — Forecast, Anomaly Detection, Sentiment, Search, Analyst (NL→SQL), Agents (multi-step).',
      toolkit: 'AI · platform',
      kpis: [
        { label: 'queries / mo',  value: '~12k',  tone: 'cyan' },
        { label: 'avg p95',       value: '< 2 s', tone: 'signal' },
        { label: 'models active', value: '14',    tone: 'snow' },
      ],
      lineage: {
        source: 'all Gold semantic views',
        target: 'recommendations · writebacks',
        refresh: 'on-demand',
      },
    },
  },
  {
    id: 'HORIZON', label: 'HORIZON', color: COLOR.muted, pos: [0, -3, 0],
    details: {
      subsystem: 'GOVERNANCE · CATALOG',
      summary: 'Horizon Catalog — column-level lineage, automatic classification, masking policies, audit replay. Every query, every recommendation logged.',
      toolkit: 'governance',
      kpis: [
        { label: 'columns indexed', value: '13,402', tone: 'cyan' },
        { label: 'datasets',        value: '247',    tone: 'snow' },
        { label: 'masking policies', value: '14',    tone: 'snow' },
        { label: 'retention',       value: '7 yr',   tone: 'amber' },
      ],
      lineage: {
        source: 'snowflake.metadata + cortex.audit',
        target: 'audit replay · compliance reports',
        refresh: 'T+0',
      },
      analysis:
        'Auditors replay the exact data state behind any decision with one SQL: SELECT … AT(TIMESTAMP => …).',
    },
  },
]

interface GraphEdge {
  from: string
  to: string
  details: EdgeInspectorDetails
}

const EDGES: GraphEdge[] = [
  // Source systems → SNOWFLAKE
  {
    from: 'COGNITE', to: 'SNOWFLAKE',
    details: {
      subsystem: 'ZERO-COPY SHARE',
      contract: 'Cognite Data Fusion → Snowflake Bronze',
      format: 'Snowflake Secure Share',
      latency: '< 60 s',
      throughput: '0 ETL · governed view',
      analysis: 'No data is duplicated. Snowflake reads a governed view of the Cognite Bronze table. Reverse share carries writebacks back to Cognite as events.',
      columns: [
        { name: 'asset_id',  type: 'string' },
        { name: 'parent',    type: 'string' },
        { name: 'tags',      type: 'array' },
        { name: 'value',     type: 'numeric' },
        { name: 'ts',        type: 'timestamp' },
      ],
    },
  },
  {
    from: 'SAP', to: 'SNOWFLAKE',
    details: {
      subsystem: 'ZERO-COPY SHARE',
      contract: 'SAP Business Data Cloud → Snowflake Bronze',
      format: 'SAP BDC zero-copy',
      latency: '< 5 s',
      throughput: '0 ETL · governed view',
      analysis: 'GL postings, cost objects, settlements arrive as live views. Customer-retains-ownership clause in the share agreement.',
    },
  },
  {
    from: 'QUORUM', to: 'SNOWFLAKE',
    details: {
      subsystem: 'SNOWPIPE STREAMING',
      contract: 'Quorum Kafka topic quorum.flows.v1 → Snowpipe',
      format: 'Avro',
      latency: '< 60 s',
      throughput: '5,000 events / s',
      analysis: 'Auto-scaled streaming ingest. Schema evolution handled via MATCH_BY_COLUMN_NAME.',
    },
  },
  {
    from: 'SIRION', to: 'SNOWFLAKE',
    details: {
      subsystem: 'SNOWPIPE (S3)',
      contract: 'Sirion contract exports → S3 → Snowpipe',
      format: 'JSON',
      latency: '< 5 m',
      throughput: '~100 contracts / min',
      analysis: 'Each Sirion export is an immutable file. Snowpipe ingests new files automatically; clauses become searchable via Cortex Search.',
    },
  },
  {
    from: 'ENDUR', to: 'SNOWFLAKE',
    details: {
      subsystem: 'SNOWPIPE STREAMING',
      contract: 'Endur Kafka topic endur.trades.v1 → Snowpipe',
      format: 'Avro',
      latency: '< 30 s',
      throughput: '~5,000 trades / s',
      analysis: 'Trader desk and physical operations reconcile against the same Snowflake table within a sub-minute window.',
    },
  },
  // SNOWFLAKE → consumers
  {
    from: 'SNOWFLAKE', to: 'CORTEX',
    details: {
      subsystem: 'AI · MODEL CALL',
      contract: 'Snowflake Gold view → Cortex function invocation',
      format: 'native SQL',
      latency: '< 2 s typical',
      throughput: '~12,000 calls / month',
      analysis: 'Cortex functions run inside the Snowflake security boundary. No data egress, full lineage to the input rows.',
    },
  },
  {
    from: 'SNOWFLAKE', to: 'HORIZON',
    details: {
      subsystem: 'METADATA',
      contract: 'Snowflake query history + access history → Horizon',
      format: 'metadata graph',
      latency: 'T+0',
      throughput: 'append-only',
      analysis: 'Every query, every column read, every writeback is logged with a lineage hash for 7-year audit replay.',
    },
  },
]

function GraphNodeMesh({
  node,
  selected,
  hover,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  node: GraphNode
  selected: boolean
  hover: boolean
  onClick: (e: ThreeEvent<MouseEvent>) => void
  onPointerOver: () => void
  onPointerOut: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  const radius = node.size ?? 0.45
  const scale = selected ? 1.4 : hover ? 1.18 : 1.0

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.3
      meshRef.current.rotation.y = t * 0.4
      const m = meshRef.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = (selected ? 1.2 : hover ? 0.85 : 0.5) + 0.2 * Math.sin(t * 1.6 + node.pos[0])
    }
    if (innerRef.current) {
      innerRef.current.rotation.x = -t * 0.45
      innerRef.current.rotation.z = t * 0.35
    }
  })

  return (
    <group
      position={node.pos}
      scale={scale}
      onClick={(e) => { e.stopPropagation(); onClick(e) }}
      onPointerOver={(e) => { e.stopPropagation(); onPointerOver() }}
      onPointerOut={(e) => { e.stopPropagation(); onPointerOut() }}
    >
      <mesh ref={meshRef}>
        <octahedronGeometry args={[radius, 0]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={selected ? 1 : 0.9}
        />
      </mesh>
      <mesh ref={innerRef}>
        <octahedronGeometry args={[radius * 0.45, 0]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={selected ? 0.95 : 0.55}
          metalness={0.55}
          roughness={0.4}
        />
      </mesh>
      {/* Selection halo */}
      {selected && (
        <mesh>
          <torusGeometry args={[radius * 1.45, 0.025, 8, 48]} />
          <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={1.2} transparent opacity={0.85} />
        </mesh>
      )}
      <Text
        position={[0, radius + 0.35, 0]}
        fontSize={0.22}
        color={node.color}
        anchorX="center"
        anchorY="middle"
      >
        {node.label}
      </Text>
    </group>
  )
}

function GraphScene() {
  const groupRef = useRef<THREE.Group>(null)
  const selectNode = useInspectorStore((s) => s.selectNode)
  const selectEdge = useInspectorStore((s) => s.selectEdge)
  const active = useInspectorStore((s) => s.active)

  const [hoverNode, setHoverNode] = useState<string | null>(null)
  const [hoverEdge, setHoverEdge] = useState<number | null>(null)

  // Auto-rotate slowly, but pause when the user is hovering for legibility.
  useFrame((state) => {
    if (groupRef.current && hoverNode === null && hoverEdge === null) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.08
    }
  })

  const nodeMap = new Map(NODES.map(n => [n.id, n]))
  const activeNodeId = active?.kind === 'node' && active.flowKey === HORIZON_FLOW_KEY ? active.id : null
  const activeEdgeId = active?.kind === 'edge' && active.flowKey === HORIZON_FLOW_KEY ? active.id : null

  return (
    <group ref={groupRef}>
      {/* Edges */}
      {EDGES.map((e, i) => {
        const a = nodeMap.get(e.from)
        const b = nodeMap.get(e.to)
        if (!a || !b) return null
        const eid = `${e.from}-${e.to}`
        const isHover = hoverEdge === i
        const isActive = activeEdgeId === eid
        return (
          <group
            key={i}
            onClick={(ev) => {
              ev.stopPropagation()
              selectEdge({
                kind: 'edge',
                flowKey: HORIZON_FLOW_KEY,
                id: eid,
                sourceLabel: e.from,
                targetLabel: e.to,
                details: e.details,
              })
            }}
            onPointerOver={(ev) => { ev.stopPropagation(); setHoverEdge(i); document.body.style.cursor = 'pointer' }}
            onPointerOut={(ev)  => { ev.stopPropagation(); setHoverEdge(null); document.body.style.cursor = 'default' }}
          >
            <Line
              points={[a.pos, b.pos]}
              color={isActive ? COLOR.cyan : isHover ? COLOR.amber : COLOR.snow}
              lineWidth={isActive ? 3.5 : isHover ? 2.4 : 1.2}
              transparent
              opacity={isActive ? 0.95 : isHover ? 0.85 : 0.5}
            />
            {/* Invisible thicker line that captures clicks more easily */}
            <Line
              points={[a.pos, b.pos]}
              color={'#000000'}
              lineWidth={12}
              transparent
              opacity={0}
            />
          </group>
        )
      })}

      {/* Nodes */}
      {NODES.map(n => (
        <GraphNodeMesh
          key={n.id}
          node={n}
          selected={activeNodeId === n.id}
          hover={hoverNode === n.id}
          onClick={() => {
            selectNode({
              kind: 'node',
              flowKey: HORIZON_FLOW_KEY,
              id: n.id,
              label: n.label,
              code: n.label,
              details: n.details,
            })
          }}
          onPointerOver={() => { setHoverNode(n.id); document.body.style.cursor = 'pointer' }}
          onPointerOut={()  => { setHoverNode(null); document.body.style.cursor = 'default' }}
        />
      ))}

      <Text
        position={[0, -4.0, 0]}
        fontSize={0.2}
        color={COLOR.inkDim}
        anchorX="center"
        anchorY="middle"
      >
        click any node or connector · drag to orbit
      </Text>
    </group>
  )
}

export function AuditGraph() {
  return (
    <Canvas camera={{ position: [6, 4, 8], fov: 45 }} dpr={[1, 1.6]}>
      <color attach="background" args={[COLOR.fog]} />
      <fog attach="fog" args={[COLOR.fog, 10, 26]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 7, 5]} intensity={0.9} color={COLOR.amber} />
      <pointLight position={[-6, -3, -4]} intensity={0.65} color={COLOR.snow} />
      <GraphScene />
      <OrbitControls
        enablePan
        screenSpacePanning
        minDistance={3}
        maxDistance={60}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
    </Canvas>
  )
}
