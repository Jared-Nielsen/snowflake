import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'

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
  inkDim: '#8aa0c5',
} as const

interface PositionRow {
  name: string
  phys: number    // physical position (kbbl)
  paper: number   // paper hedge (negative = short)
  pnl: number
}

// Hard-coded per spec.
const ROWS: PositionRow[] = [
  { name: 'WTI',   phys: 220, paper: -240, pnl:  320_000 },
  { name: 'Brent', phys:  80, paper:  -75, pnl:  -45_000 },
  { name: 'RBOB',  phys: 110, paper: -100, pnl:   88_000 },
  { name: 'HO',    phys:  90, paper: -110, pnl:  210_000 },
  { name: 'NG',    phys:   0, paper:  -60, pnl: -130_000 },
]

// Height scaling: 240 kbbl ≈ 3.5 units tall.
const HEIGHT_SCALE = 3.5 / 240

function formatPnL(n: number): string {
  const abs = Math.abs(n)
  const sign = n >= 0 ? '+' : '-'
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}k`
  return `${sign}$${abs.toFixed(0)}`
}

function netExposureColor(net: number): string {
  if (Math.abs(net) < 15) return COLOR.inkDim
  return net > 0 ? COLOR.amber : COLOR.cyan
}

function PositionPair({ row, i }: { row: PositionRow; i: number }) {
  const x = (i - (ROWS.length - 1) / 2) * 1.6
  const physH  = Math.max(0.02, Math.abs(row.phys)  * HEIGHT_SCALE)
  const paperH = Math.max(0.02, Math.abs(row.paper) * HEIGHT_SCALE)
  const net = row.phys + row.paper
  const sphereColor = netExposureColor(net)
  const pnlColor = row.pnl >= 0 ? COLOR.signal : COLOR.alarm

  const sphereRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (sphereRef.current) {
      const m = sphereRef.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 0.45 + 0.2 * Math.sin(state.clock.elapsedTime * 1.6 + i)
    }
  })

  const sphereY = Math.max(physH, paperH) + 0.45

  return (
    <group position={[x, 0, 0]}>
      {/* Physical bar (+Z, copper) */}
      <mesh position={[0, physH / 2, 0.55]}>
        <boxGeometry args={[0.5, physH, 0.5]} />
        <meshStandardMaterial
          color={COLOR.copper}
          emissive={COLOR.copper}
          emissiveIntensity={0.2}
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>
      {/* Paper bar (-Z, snow blue) */}
      <mesh position={[0, paperH / 2, -0.55]}>
        <boxGeometry args={[0.5, paperH, 0.5]} />
        <meshStandardMaterial
          color={COLOR.snow}
          emissive={COLOR.snow}
          emissiveIntensity={0.25}
          metalness={0.65}
          roughness={0.4}
        />
      </mesh>

      {/* Net exposure sphere */}
      <mesh ref={sphereRef} position={[0, sphereY, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color={sphereColor}
          emissive={sphereColor}
          emissiveIntensity={0.55}
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>

      {/* Commodity label */}
      <Text
        position={[0, -0.32, 0]}
        fontSize={0.22}
        color={COLOR.snow}
        anchorX="center"
        anchorY="middle"
      >
        {row.name}
      </Text>
      <Text
        position={[0, -0.6, 0]}
        fontSize={0.13}
        color={COLOR.inkDim}
        anchorX="center"
        anchorY="middle"
      >
        {`net ${net >= 0 ? '+' : ''}${net} kbbl`}
      </Text>

      {/* PnL label */}
      <Text
        position={[0, sphereY + 0.45, 0]}
        fontSize={0.2}
        color={pnlColor}
        anchorX="center"
        anchorY="middle"
      >
        {formatPnL(row.pnl)}
      </Text>
    </group>
  )
}

function BarsScene() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.35
    }
  })
  return (
    <group ref={groupRef}>
      {/* Ground grid */}
      <gridHelper args={[10, 20, COLOR.steel, COLOR.steelDk]} position={[0, -0.001, 0]} />

      {/* Center divider line marker */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 0.04]} />
        <meshBasicMaterial color={COLOR.steel} transparent opacity={0.7} />
      </mesh>

      {/* Bars */}
      {ROWS.map((r, i) => <PositionPair key={r.name} row={r} i={i} />)}

      {/* Legend labels */}
      <Text position={[-4.6, 0.3, 1.4]} fontSize={0.22} color={COLOR.copper} anchorX="left">
        PHYSICAL
      </Text>
      <Text position={[-4.6, 0.3, -1.4]} fontSize={0.22} color={COLOR.snow} anchorX="left">
        PAPER (hedge)
      </Text>
      <Text position={[4.6, 4.0, 0]} fontSize={0.18} color={COLOR.cyan} anchorX="right">
        net exposure ●
      </Text>
    </group>
  )
}

export function PositionBars() {
  return (
    <Canvas camera={{ position: [6, 5, 9], fov: 40 }} dpr={[1, 1.6]}>
      <color attach="background" args={[COLOR.fog]} />
      <fog attach="fog" args={[COLOR.fog, 10, 26]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 8, 6]} intensity={0.95} color={COLOR.amber} />
      <pointLight position={[-6, 4, -5]} intensity={0.65} color={COLOR.snow} />
      <BarsScene />
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
