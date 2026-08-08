import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PORTAL } from '../../constants'

const galaxyVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const galaxyFrag = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 0.98) discard;

    float angle = atan(p.y, p.x) + uTime * 0.15;
    float arms = 0.55 + 0.45 * sin(angle * 4.0 + r * 12.0 - uTime * 0.8);
    float core = exp(-r * 3.6) * 1.55;
    float disk = smoothstep(0.95, 0.12, r) * arms;

    vec3 nebula = mix(vec3(0.08, 0.03, 0.28), vec3(0.65, 0.18, 0.9), disk);
    nebula = mix(nebula, vec3(0.15, 0.5, 1.0), smoothstep(0.6, 0.05, r) * 0.7);
    nebula += vec3(1.0, 0.82, 0.5) * core;

    float stars = step(0.99, hash(floor(p * 56.0 + uTime * 0.04)));
    stars += step(0.996, hash(floor(p * 110.0 - uTime * 0.02))) * 0.85;
    nebula += vec3(0.95, 0.97, 1.0) * stars;

    float alpha = smoothstep(0.98, 0.15, r) * (0.72 + disk * 0.35 + core * 0.2);
    gl_FragColor = vec4(nebula, alpha);
  }
`

/** Oversized horizontal galaxy rift at arena center. */
export function SuperGalaxyPortal() {
  const galaxyMat = useRef<THREE.ShaderMaterial>(null)
  const ringRef = useRef<THREE.Group>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  const R = PORTAL.radius

  useFrame((_, dt) => {
    if (galaxyMat.current) galaxyMat.current.uniforms.uTime.value += dt
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.22
  })

  return (
    <group position={[PORTAL.x, 0.04, PORTAL.z]}>
      {/* Floor galaxy disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[R * 0.95, 64]} />
        <shaderMaterial
          ref={galaxyMat}
          vertexShader={galaxyVert}
          fragmentShader={galaxyFrag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer stone ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[R * 0.95, R * 1.18, 56]} />
        <meshStandardMaterial
          color="#1E1830"
          metalness={0.7}
          roughness={0.3}
          emissive="#3A2068"
          emissiveIntensity={0.45}
        />
      </mesh>

      {/* Spinning energy rim */}
      <group ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <mesh>
          <torusGeometry args={[R * 1.02, 0.1, 10, 64]} />
          <meshStandardMaterial
            color="#7B5CFF"
            emissive="#8A6CFF"
            emissiveIntensity={1.1}
            metalness={0.35}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Vertical stargate arch for silhouettes emerging */}
      <mesh position={[0, R * 0.85, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[R * 0.72, 0.16, 12, 48, Math.PI]} />
        <meshStandardMaterial
          color="#2A2040"
          metalness={0.6}
          roughness={0.35}
          emissive="#5A30A0"
          emissiveIntensity={0.55}
        />
      </mesh>
      <mesh position={[0, R * 0.85, 0.02]}>
        <circleGeometry args={[R * 0.68, 40]} />
        <meshBasicMaterial
          color="#4A20A0"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <pointLight color="#9B70FF" intensity={4.5} distance={16} decay={2} position={[0, 1.2, 0]} />
      <pointLight color="#60A0FF" intensity={2.2} distance={10} decay={2} position={[0, 0.4, 0]} />
    </group>
  )
}
