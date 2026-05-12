import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useStreamStore } from '@/store/streamStore'

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
} as const

function severity(vib: number): 'OK' | 'WARN' | 'ALARM' {
  if (vib >= 6) return 'ALARM'
  if (vib >= 4.5) return 'WARN'
  return 'OK'
}

function severityColor(sev: 'OK' | 'WARN' | 'ALARM'): string {
  if (sev === 'ALARM') return COLOR.alarm
  if (sev === 'WARN') return COLOR.amber
  return COLOR.cyan
}

function PumpAssembly() {
  const groupRef     = useRef<THREE.Group>(null)
  const voluteRef    = useRef<THREE.Mesh>(null)
  const impellerRef  = useRef<THREE.Group>(null)
  const haloRef      = useRef<THREE.Mesh>(null)

  const vibArr = useStreamStore(s => s.streams['PUMP-401:vibration'] || [])
  const vib = vibArr[vibArr.length - 1]?.value ?? 4.8
  const sev = severity(vib)
  const sevColor = severityColor(sev)

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Spin impeller — RPM scales with vibration value.
    if (impellerRef.current) {
      impellerRef.current.rotation.z = t * (1.5 + vib * 0.4)
    }

    // Vibration jitter when severe.
    if (groupRef.current) {
      if (vib > 5) {
        const j = (vib - 5) * 0.012
        groupRef.current.position.y = Math.sin(t * 35) * j
        groupRef.current.position.x = Math.cos(t * 41) * j * 0.6
      } else {
        groupRef.current.position.y = 0
        groupRef.current.position.x = 0
      }
    }

    // Pulsing halo.
    if (haloRef.current) {
      const pulse = 0.9 + 0.25 * Math.sin(t * (sev === 'ALARM' ? 6 : sev === 'WARN' ? 3 : 1.6))
      haloRef.current.scale.set(pulse, pulse, pulse)
      const m = haloRef.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 0.45 + 0.35 * Math.sin(t * 2.4)
    }

    // Volute color shift in alarm.
    if (voluteRef.current) {
      const m = voluteRef.current.material as THREE.MeshStandardMaterial
      if (sev === 'ALARM') {
        m.emissive.set(COLOR.alarm)
        m.emissiveIntensity = 0.55 + 0.25 * Math.sin(t * 5)
        m.color.set('#4a1c1c')
      } else if (sev === 'WARN') {
        m.emissive.set(COLOR.amber)
        m.emissiveIntensity = 0.25
        m.color.set(COLOR.steel)
      } else {
        m.emissive.set(COLOR.cyan)
        m.emissiveIntensity = 0.1
        m.color.set(COLOR.steel)
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Volute casing — torus */}
      <mesh ref={voluteRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.5, 18, 40]} />
        <meshStandardMaterial color={COLOR.steel} metalness={0.75} roughness={0.35} />
      </mesh>

      {/* Volute side cover — disc */}
      <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.08, 32]} />
        <meshStandardMaterial color={COLOR.steelDk} metalness={0.7} roughness={0.45} />
      </mesh>

      {/* Pulsing halo around volute */}
      <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.75, 0.04, 8, 64]} />
        <meshStandardMaterial
          color={sevColor}
          emissive={sevColor}
          emissiveIntensity={0.6}
          transparent
          opacity={0.7}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>

      {/* Discharge nozzle (top) */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 1.0, 18]} />
        <meshStandardMaterial color={COLOR.copper} metalness={0.75} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.05, 0]}>
        <cylinderGeometry args={[0.42, 0.32, 0.18, 18]} />
        <meshStandardMaterial color={COLOR.copper} metalness={0.75} roughness={0.4} />
      </mesh>

      {/* Suction pipe (front) */}
      <mesh position={[0, 0, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 1.3, 18]} />
        <meshStandardMaterial color={COLOR.copper} metalness={0.75} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 2.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.46, 0.36, 0.18, 18]} />
        <meshStandardMaterial color={COLOR.copper} metalness={0.75} roughness={0.4} />
      </mesh>

      {/* Motor — horizontal cylinder behind volute */}
      <mesh position={[0, 0, -1.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 1.8, 24]} />
        <meshStandardMaterial color={COLOR.steelDk} metalness={0.7} roughness={0.45} />
      </mesh>
      {/* Motor fins */}
      {[-1.0, -1.4, -1.8, -2.2].map(z => (
        <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.66, 0.66, 0.04, 24]} />
          <meshStandardMaterial color={COLOR.steel} metalness={0.7} roughness={0.5} />
        </mesh>
      ))}

      {/* Coupling shaft */}
      <mesh position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.4, 12]} />
        <meshStandardMaterial color={COLOR.amber} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Impeller — 5 radial blades inside volute */}
      <group ref={impellerRef} position={[0, 0, 0.12]}>
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 12]} />
          <meshStandardMaterial
            color={COLOR.amber}
            emissive={COLOR.amber}
            emissiveIntensity={0.25}
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => {
          const a = (i / 5) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0]}
              rotation={[0, 0, a]}
            >
              <boxGeometry args={[0.85, 0.1, 0.18]} />
              <meshStandardMaterial
                color={COLOR.copper}
                metalness={0.85}
                roughness={0.3}
                emissive={COLOR.flare}
                emissiveIntensity={0.12}
              />
            </mesh>
          )
        })}
      </group>

      {/* Foundation pad */}
      <mesh position={[0, -1.5, -0.4]}>
        <boxGeometry args={[3.2, 0.25, 2.6]} />
        <meshStandardMaterial color={COLOR.steelDk} metalness={0.4} roughness={0.7} />
      </mesh>

      {/* Header labels */}
      <Text
        position={[0, 2.7, 0]}
        fontSize={0.34}
        color={COLOR.snow}
        anchorX="center"
        anchorY="middle"
      >
        PUMP-401
      </Text>
      <Text
        position={[0, 2.3, 0]}
        fontSize={0.2}
        color={sevColor}
        anchorX="center"
        anchorY="middle"
      >
        {`VIB ${vib.toFixed(2)} mm/s · ${sev}`}
      </Text>
    </group>
  )
}

export function PumpModel() {
  return (
    <Canvas camera={{ position: [4, 3, 6], fov: 40 }} dpr={[1, 1.6]}>
      <color attach="background" args={[COLOR.fog]} />
      <fog attach="fog" args={[COLOR.fog, 8, 22]} />
      <ambientLight intensity={0.45} />
      <pointLight position={[5, 6, 5]} intensity={1.0} color={COLOR.amber} />
      <pointLight position={[-5, 3, -4]} intensity={0.7} color={COLOR.snow} />
      <PumpAssembly />
      <OrbitControls
        enablePan
        screenSpacePanning
        minDistance={2}
        maxDistance={40}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
    </Canvas>
  )
}
