import { useRef } from "react";
import { useSpring, animated, config } from "@react-spring/three";
import { RoundedBox, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { useConfig, getCabinFinish } from "../store";

// Cabin internal dims (metres)
const W = 1.6;
const D = 1.4;
const H = 2.2;
const WALL_T = 0.04;

RectAreaLightUniformsLib.init();

export default function CabinScene() {
  const finish = getCabinFinish(useConfig((s) => s.cabinFinishId));
  const variant = useConfig((s) => s.doorVariant);
  const open = useConfig((s) => s.doorsOpen);

  const doorH = H - 0.08;
  const doorY = doorH / 2 + 0.02;
  const doorZ = D / 2 + WALL_T / 2 + 0.001;

  const centerTravel = W / 2 - 0.02;
  const sideTravelOuter = W * 0.45;
  const sideTravelInner = W * 0.22;

  const cSpring = useSpring({ cx: open ? centerTravel : 0, config: config.gentle });
  const sSpring = useSpring({
    outer: open ? sideTravelOuter : 0,
    inner: open ? sideTravelInner : 0,
    config: config.gentle,
  });

  return (
    <group position={[0, -H / 2, 0]}>
      {/* Reflective floor extends outside the cabin too */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W * 6, D * 6]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={1.2}
          roughness={0.85}
          depthScale={1.0}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0a0a0a"
          metalness={0.4}
          mirror={0.4}
        />
      </mesh>

      {/* Cabin floor (inside) — separate slim plate over reflective floor */}
      <RoundedBox args={[W + 0.06, WALL_T, D + 0.06]} radius={0.01} smoothness={3}
        position={[0, WALL_T / 2 + 0.002, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={finish.floor}
          metalness={0.35}
          roughness={0.45}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
        />
      </RoundedBox>

      {/* Ceiling */}
      <RoundedBox args={[W, WALL_T, D]} radius={0.012} smoothness={3}
        position={[0, H - WALL_T / 2, 0]}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
      </RoundedBox>

      {/* Recessed ceiling light panel (visible source) */}
      <mesh position={[0, H - WALL_T - 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W * 0.55, D * 0.55]} />
        <meshBasicMaterial color="#fff3cf" toneMapped={false} />
      </mesh>
      {/* Real area light source for soft, accurate fill */}
      <rectAreaLight
        position={[0, H - WALL_T - 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={W * 0.55}
        height={D * 0.55}
        intensity={6}
        color="#fff1c2"
      />

      {/* Walls — RoundedBox for soft bevelled edges */}
      <CabinWall
        args={[W, H, WALL_T]}
        position={[0, H / 2, -D / 2]}
        finish={finish}
      />
      <CabinWall
        args={[WALL_T, H, D]}
        position={[-W / 2, H / 2, 0]}
        finish={finish}
      />
      <CabinWall
        args={[WALL_T, H, D]}
        position={[W / 2, H / 2, 0]}
        finish={finish}
      />

      {/* Back wall mirror panel — true reflector */}
      <mesh position={[0, H * 0.55, -D / 2 + WALL_T / 2 + 0.003]}>
        <planeGeometry args={[W * 0.6, H * 0.55]} />
        <MeshReflectorMaterial
          blur={[100, 60]}
          resolution={512}
          mixBlur={0.3}
          mixStrength={2}
          roughness={0.08}
          color="#dadada"
          metalness={1}
          mirror={0.9}
        />
      </mesh>
      {/* Mirror frame */}
      <RoundedBox args={[W * 0.62, H * 0.57, 0.005]} radius={0.003} smoothness={3}
        position={[0, H * 0.55, -D / 2 + WALL_T / 2 + 0.001]}>
        <meshPhysicalMaterial
          color={finish.trim}
          metalness={0.95}
          roughness={0.18}
          clearcoat={0.8}
          clearcoatRoughness={0.15}
        />
      </RoundedBox>

      {/* Handrail — cylindrical bar held by two mounts */}
      <group position={[0, H * 0.42, -D / 2 + 0.06]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, W * 0.85, 32]} />
          <meshPhysicalMaterial color={finish.trim} metalness={0.98} roughness={0.12}
            clearcoat={1} clearcoatRoughness={0.08} />
        </mesh>
        {[-W * 0.38, W * 0.38].map((x, i) => (
          <mesh key={i} position={[x, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.06, 16]} />
            <meshPhysicalMaterial color={finish.trim} metalness={0.95} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Control panel (right wall) */}
      <RoundedBox args={[0.014, 0.6, 0.12]} radius={0.004} smoothness={3}
        position={[W / 2 - WALL_T / 2 - 0.012, H * 0.55, D / 2 - 0.22]} castShadow>
        <meshPhysicalMaterial color="#080808" metalness={0.85} roughness={0.25}
          clearcoat={0.9} clearcoatRoughness={0.1} />
      </RoundedBox>
      {/* Buttons */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i}
          position={[W / 2 - WALL_T / 2 - 0.022, H * 0.55 + 0.22 - i * 0.1, D / 2 - 0.22]}
          rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.006, 24]} />
          <meshPhysicalMaterial
            color={finish.trim}
            metalness={0.95}
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.05}
            emissive={i === 0 ? "#ffb14a" : "#000000"}
            emissiveIntensity={i === 0 ? 1.2 : 0}
          />
        </mesh>
      ))}

      {/* Door header (above doors) */}
      <RoundedBox args={[W + 0.06, 0.08, 0.03]} radius={0.008} smoothness={3}
        position={[0, doorH + 0.05, doorZ]} castShadow>
        <meshPhysicalMaterial color={finish.trim} metalness={0.95} roughness={0.18}
          clearcoat={0.9} clearcoatRoughness={0.12} />
      </RoundedBox>
      {/* Threshold strip on floor */}
      <RoundedBox args={[W + 0.06, 0.012, 0.04]} radius={0.003} smoothness={3}
        position={[0, 0.006 + WALL_T, doorZ]}>
        <meshPhysicalMaterial color={finish.trim} metalness={0.95} roughness={0.2} />
      </RoundedBox>

      {/* Doors */}
      {variant === "center" ? (
        <>
          <animated.group position-x={cSpring.cx.to((v) => -W / 4 - v)} position-y={doorY} position-z={doorZ}>
            <DoorLeaf width={W / 2 - 0.01} height={doorH} finish={finish} />
          </animated.group>
          <animated.group position-x={cSpring.cx.to((v) => W / 4 + v)} position-y={doorY} position-z={doorZ}>
            <DoorLeaf width={W / 2 - 0.01} height={doorH} finish={finish} />
          </animated.group>
        </>
      ) : (
        <>
          <animated.group position-x={sSpring.outer.to((v) => W / 4 + v)} position-y={doorY} position-z={doorZ + 0.001}>
            <DoorLeaf width={W / 2 - 0.01} height={doorH} finish={finish} />
          </animated.group>
          <animated.group position-x={sSpring.inner.to((v) => -W / 4 + v)} position-y={doorY} position-z={doorZ - 0.001}>
            <DoorLeaf width={W / 2 - 0.01} height={doorH} finish={finish} darker />
          </animated.group>
        </>
      )}

      {/* Subtle skirting / ground-line shadow plate */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W * 2.4, D * 2.4]} />
        <shadowMaterial opacity={0.45} />
      </mesh>
    </group>
  );
}

function CabinWall({
  args, position, finish,
}: {
  args: [number, number, number];
  position: [number, number, number];
  finish: ReturnType<typeof getCabinFinish>;
}) {
  return (
    <RoundedBox args={args} radius={0.012} smoothness={3} position={position} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={finish.wall}
        metalness={finish.metalness}
        roughness={finish.roughness}
        clearcoat={finish.metalness > 0.5 ? 0.6 : 0.2}
        clearcoatRoughness={0.25}
        envMapIntensity={1.2}
      />
    </RoundedBox>
  );
}

function DoorLeaf({
  width, height, finish, darker = false,
}: {
  width: number;
  height: number;
  finish: ReturnType<typeof getCabinFinish>;
  darker?: boolean;
}) {
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  // brushed metal feel via clearcoat + low clearcoatRoughness on top
  return (
    <>
      <RoundedBox args={[width, height, 0.025]} radius={0.006} smoothness={3} castShadow>
        <meshPhysicalMaterial
          ref={matRef}
          color={darker ? new THREE.Color(finish.trim).multiplyScalar(0.78) : finish.trim}
          metalness={0.95}
          roughness={0.22}
          clearcoat={0.9}
          clearcoatRoughness={0.15}
          envMapIntensity={1.3}
        />
      </RoundedBox>
      {/* Inset vertical groove on the inner edge */}
      <mesh position={[width / 2 - 0.012, 0, 0.013]}>
        <boxGeometry args={[0.003, height * 0.96, 0.002]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.4} roughness={0.6} />
      </mesh>
    </>
  );
}

