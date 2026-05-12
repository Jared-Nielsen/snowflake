import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
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

interface Port {
  name: string
  color: string
  pos: [number, number, number]
}

const PORTS: Record<string, Port> = {
  GALVESTON:   { name: 'GALVESTON',   color: COLOR.signal, pos: [ 0, 0,  0   ] },
  HOUSTON:     { name: 'HOUSTON',     color: COLOR.cyan,   pos: [-2, 0, -2   ] },
  CORPUS:      { name: 'CORPUS',      color: COLOR.amber,  pos: [ 3, 0,  1.5 ] },
  NEW_ORLEANS: { name: 'NEW ORLEANS', color: COLOR.copper, pos: [-4, 0,  1   ] },
}

interface Tanker {
  id: number
  from: Port
  to: Port
  speed: number
  color: string
  phaseOffset: number
}

const TANKERS: Tanker[] = [
  { id: 1, from: PORTS.GALVESTON,   to: PORTS.CORPUS,    speed: 0.05, color: COLOR.cyan,   phaseOffset: 0.00 },
  { id: 2, from: PORTS.CORPUS,      to: PORTS.GALVESTON, speed: 0.07, color: COLOR.amber,  phaseOffset: 0.33 },
  { id: 3, from: PORTS.NEW_ORLEANS, to: PORTS.GALVESTON, speed: 0.04, color: COLOR.signal, phaseOffset: 0.66 },
]

function PortMarker({ port }: { port: Port }) {
  const ringRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ringRef.current) {
      const m = ringRef.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 0.5 + 0.25 * Math.sin(state.clock.elapsedTime * 1.6 + port.pos[0])
    }
  })
  return (
    <group position={port.pos}>
      {/* Port cylinder */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.36, 18]} />
        <meshStandardMaterial
          color={port.color}
          emissive={port.color}
          emissiveIntensity={0.32}
          metalness={0.6}
          roughness={0.45}
        />
      </mesh>
      {/* Pulsing ring on water */}
      <mesh ref={ringRef} position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.025, 8, 28]} />
        <meshStandardMaterial
          color={port.color}
          emissive={port.color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Cap antenna */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
        <meshStandardMaterial color={COLOR.amber} emissive={COLOR.amber} emissiveIntensity={0.4} />
      </mesh>
      <Text position={[0, 0.95, 0]} fontSize={0.2} color={port.color} anchorX="center">
        {port.name}
      </Text>
    </group>
  )
}

function TankerBoat({ tanker }: { tanker: Tanker }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * tanker.speed + tanker.phaseOffset
    const saw = ((t % 1) + 1) % 1   // 0..1 loop

    const [fx, , fz] = tanker.from.pos
    const [tx, , tz] = tanker.to.pos
    const x = fx + (tx - fx) * saw
    const z = fz + (tz - fz) * saw

    // Subtle bobbing motion.
    const bob = Math.sin(state.clock.elapsedTime * 1.8 + tanker.id) * 0.04
    ref.current.position.set(x, 0.15 + bob, z)

    // Face direction of travel.
    const heading = Math.atan2(tx - fx, tz - fz)
    ref.current.rotation.y = heading

    // Slight roll.
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2 + tanker.id) * 0.03
  })

  return (
    <group ref={ref}>
      {/* Hull (box) — long axis is +Z */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.32, 0.16, 0.72]} />
        <meshStandardMaterial
          color={tanker.color}
          emissive={tanker.color}
          emissiveIntensity={0.18}
          metalness={0.6}
          roughness={0.45}
        />
      </mesh>
      {/* Hull underside (darker) */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.3, 0.06, 0.7]} />
        <meshStandardMaterial color={COLOR.steelDk} metalness={0.5} roughness={0.55} />
      </mesh>
      {/* Bridge / cabin tower */}
      <mesh position={[0, 0.16, -0.22]}>
        <boxGeometry args={[0.18, 0.14, 0.18]} />
        <meshStandardMaterial
          color={COLOR.snow}
          emissive={COLOR.snow}
          emissiveIntensity={0.35}
          metalness={0.55}
          roughness={0.45}
        />
      </mesh>
      {/* Bow indicator (small triangle prism pointing forward) */}
      <mesh position={[0, 0.06, 0.42]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <coneGeometry args={[0.14, 0.18, 4]} />
        <meshStandardMaterial color={COLOR.amber} metalness={0.6} roughness={0.45} />
      </mesh>
      {/* Mast */}
      <mesh position={[0, 0.3, -0.22]}>
        <cylinderGeometry args={[0.012, 0.012, 0.2, 6]} />
        <meshStandardMaterial color={COLOR.amber} emissive={COLOR.amber} emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

function RouteLine({ a, b }: { a: Port; b: Port }) {
  return (
    <Line
      points={[a.pos, b.pos]}
      color={COLOR.snow}
      lineWidth={1.4}
      transparent
      opacity={0.5}
    />
  )
}

function TankerSceneGroup() {
  // Slow drift of the entire group for ambient motion.
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.08
    }
  })

  // Routes radiating from GALVESTON
  const routes: Array<[Port, Port]> = [
    [PORTS.GALVESTON, PORTS.HOUSTON],
    [PORTS.GALVESTON, PORTS.CORPUS],
    [PORTS.GALVESTON, PORTS.NEW_ORLEANS],
  ]

  return (
    <group ref={groupRef}>
      {/* Sea grid */}
      <gridHelper args={[20, 20, COLOR.steel, COLOR.steelDk]} position={[0, -0.001, 0]} />

      {/* Water plane (subtle) */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#0a1424"
          emissive={COLOR.snow}
          emissiveIntensity={0.04}
          metalness={0.3}
          roughness={0.7}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Route lines */}
      {routes.map(([a, b], i) => <RouteLine key={i} a={a} b={b} />)}

      {/* Ports */}
      {Object.values(PORTS).map(p => <PortMarker key={p.name} port={p} />)}

      {/* Tankers */}
      {TANKERS.map(t => <TankerBoat key={t.id} tanker={t} />)}

      {/* Compass label */}
      <Text position={[0, 0.001, 7]} fontSize={0.2} color={COLOR.inkDim} anchorX="center" rotation={[-Math.PI / 2, 0, 0]}>
        Gulf of Mexico · live cargo
      </Text>
    </group>
  )
}

export function TankerScene() {
  return (
    <Canvas camera={{ position: [6, 6, 6], fov: 50 }} dpr={[1, 1.6]}>
      <color attach="background" args={[COLOR.fog]} />
      <fog attach="fog" args={[COLOR.fog, 8, 24]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 8, 4]} intensity={0.95} color={COLOR.amber} />
      <pointLight position={[-6, 4, -4]} intensity={0.65} color={COLOR.snow} />
      <TankerSceneGroup />
      <OrbitControls
        enablePan
        screenSpacePanning
        minDistance={3}
        maxDistance={80}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
    </Canvas>
  )
}
