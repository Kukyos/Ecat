import { useMemo, useRef } from "react";
import { useSpring, animated } from "@react-spring/three";
import { RoundedBox, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { useConfig, getCabinFinish, type CabinFinish } from "../store";
import { DEVICE } from "../utils/device";
import {
  brushedMetalNormal,
  brushedMetalRoughness,
  microNoiseNormal,
  woodAlbedo,
  marbleAlbedo,
  darkStoneAlbedo,
} from "./procTextures";

// Cabin internal dims (metres)
const W = 1.6;
const D = 1.4;
const H = 2.2;
const WALL_T = 0.04;

RectAreaLightUniformsLib.init();

// Map finish id → which material recipe to use
type MaterialKind = "brushed" | "wood" | "stone" | "mirror" | "matte";
function finishKind(id: string): MaterialKind {
  if (id === "rosewood") return "wood";
  if (id === "ivory") return "stone";
  if (id === "mirror") return "mirror";
  if (id === "noir" || id === "graphite" || id === "champagne") return "brushed";
  return "matte";
}

export default function CabinScene() {
  const finish = getCabinFinish(useConfig((s) => s.cabinFinishId));
  const kind = finishKind(finish.id);
  const variant = useConfig((s) => s.doorVariant);
  const open = useConfig((s) => s.doorsOpen);

  const doorH = H - 0.08;
  const doorY = doorH / 2 + 0.02;
  const doorZ = D / 2 + WALL_T / 2 + 0.001;

  const centerTravel = W / 2 - 0.02;
  // Telescoping side-opening: both leaves slide right, left (fast) at full speed, right (slow) at half.
  const sideTravel = W;

  // clamp: true → no elastic overshoot at the end of the animation
  const doorConfig = { tension: 170, friction: 26, clamp: true };
  const cSpring = useSpring({ cx: open ? centerTravel : 0, config: doorConfig });
  const sSpring = useSpring({ slide: open ? sideTravel : 0, config: doorConfig });

  // Texture maps (generated once, cloned for repeat tweaks)
  const tex = useMemo(() => ({
    brushedN: brushedMetalNormal(2),
    brushedR: brushedMetalRoughness(2, 0.28),
    microN: microNoiseNormal(3, 0.35),
    wood: woodAlbedo(finish.wall),
    marble: marbleAlbedo(),
    stone: darkStoneAlbedo(finish.floor),
  }), [finish.wall, finish.floor]);

  return (
    <group position={[0, -H / 2, 0]}>
      {/* Reflective ambient floor outside cabin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W * 6, D * 6]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={DEVICE.reflectorResolution}
          mixBlur={1}
          mixStrength={1.4}
          roughness={0.82}
          depthScale={1.0}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0a0a0a"
          metalness={0.45}
          mirror={0.45}
        />
      </mesh>

      {/* Cabin floor — stone or trim-bordered */}
      <group position={[0, WALL_T / 2 + 0.002, 0]}>
        <RoundedBox args={[W + 0.06, WALL_T, D + 0.06]} radius={0.01} smoothness={3} castShadow receiveShadow>
          <meshPhysicalMaterial
            map={tex.stone}
            normalMap={tex.microN}
            normalScale={new THREE.Vector2(0.4, 0.4)}
            metalness={0.25}
            roughness={0.55}
            clearcoat={0.5}
            clearcoatRoughness={0.25}
          />
        </RoundedBox>
        {/* Floor inlay border */}
        {[
          [W * 0.42, 0, 0, [0.01, WALL_T + 0.001, D - 0.06] as [number, number, number]],
          [-W * 0.42, 0, 0, [0.01, WALL_T + 0.001, D - 0.06] as [number, number, number]],
          [0, 0, D * 0.42, [W - 0.06, WALL_T + 0.001, 0.01] as [number, number, number]],
          [0, 0, -D * 0.42, [W - 0.06, WALL_T + 0.001, 0.01] as [number, number, number]],
        ].map(([x, y, z, size], i) => (
          <mesh key={i} position={[x as number, y as number, z as number]}>
            <boxGeometry args={size as [number, number, number]} />
            <meshPhysicalMaterial color={finish.trim} metalness={0.95} roughness={0.18}
              clearcoat={1} clearcoatRoughness={0.08} />
          </mesh>
        ))}
      </group>

      {/* Ceiling */}
      <RoundedBox args={[W, WALL_T, D]} radius={0.012} smoothness={3}
        position={[0, H - WALL_T / 2, 0]}>
        <meshStandardMaterial color="#141414" metalness={0.3} roughness={0.7} />
      </RoundedBox>
      {/* Crown cove around ceiling */}
      {[
        [0, H - WALL_T - 0.01, -D / 2 + 0.025, [W - 0.04, 0.02, 0.04] as [number, number, number]],
        [0, H - WALL_T - 0.01,  D / 2 - 0.025, [W - 0.04, 0.02, 0.04] as [number, number, number]],
        [-W / 2 + 0.025, H - WALL_T - 0.01, 0, [0.04, 0.02, D - 0.04] as [number, number, number]],
        [ W / 2 - 0.025, H - WALL_T - 0.01, 0, [0.04, 0.02, D - 0.04] as [number, number, number]],
      ].map(([x, y, z, size], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <boxGeometry args={size as [number, number, number]} />
          <meshPhysicalMaterial color={finish.trim} metalness={0.95} roughness={0.18}
            clearcoat={0.9} clearcoatRoughness={0.12} />
        </mesh>
      ))}

      {/* Recessed ceiling light panel */}
      <mesh position={[0, H - WALL_T - 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W * 0.55, D * 0.55]} />
        <meshBasicMaterial color="#fff3cf" toneMapped={false} />
      </mesh>
      <rectAreaLight
        position={[0, H - WALL_T - 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={W * 0.55}
        height={D * 0.55}
        intensity={7}
        color="#fff1c2"
      />

      {/* Walls with panel seams */}
      <PanelledWall
        position={[0, H / 2, -D / 2]}
        rotation={[0, 0, 0]}
        size={[W, H]}
        depth={WALL_T}
        finish={finish}
        kind={kind}
        tex={tex}
      />
      <PanelledWall
        position={[-W / 2, H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        size={[D, H]}
        depth={WALL_T}
        finish={finish}
        kind={kind}
        tex={tex}
      />
      <PanelledWall
        position={[W / 2, H / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[D, H]}
        depth={WALL_T}
        finish={finish}
        kind={kind}
        tex={tex}
      />

      {/* Back wall mirror panel — true reflector + brushed frame.
          Panel pushed 15mm forward off the wall to prevent z-fighting flicker.
          mixBlur=0 + resolution=1024 keeps reflection crisp and stable. */}
      <mesh position={[0, H * 0.55, -D / 2 + WALL_T / 2 + 0.015]}>
        <planeGeometry args={[W * 0.55, H * 0.5]} />
        <MeshReflectorMaterial
          blur={[0, 0]}
          resolution={1024}
          mixBlur={0}
          mixStrength={2.6}
          roughness={0.02}
          color="#e6e6e6"
          metalness={1}
          mirror={1}
        />
      </mesh>
      {/* Mirror frame sits behind the mirror panel (between wall and mirror) */}
      <RoundedBox args={[W * 0.58, H * 0.53, 0.006]} radius={0.004} smoothness={3}
        position={[0, H * 0.55, -D / 2 + WALL_T / 2 + 0.008]}>
        <meshPhysicalMaterial
          color={finish.trim}
          metalness={0.97}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.08}
          normalMap={tex.brushedN}
          normalScale={new THREE.Vector2(0.4, 0.4)}
        />
      </RoundedBox>

      {/* Handrail */}
      <group position={[0, H * 0.42, -D / 2 + 0.06]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, W * 0.85, 32]} />
          <meshPhysicalMaterial color={finish.trim} metalness={0.98} roughness={0.1}
            clearcoat={1} clearcoatRoughness={0.06}
            normalMap={tex.brushedN}
            normalScale={new THREE.Vector2(0.25, 0.25)} />
        </mesh>
        {[-W * 0.38, W * 0.38].map((x, i) => (
          <group key={i} position={[x, 0, -0.02]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.012, 0.012, 0.06, 16]} />
              <meshPhysicalMaterial color={finish.trim} metalness={0.95} roughness={0.2} />
            </mesh>
            {/* Mounting plate */}
            <mesh position={[0, 0, -0.04]}>
              <cylinderGeometry args={[0.022, 0.022, 0.005, 24]} />
              <meshPhysicalMaterial color={finish.trim} metalness={0.95} roughness={0.22} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Control panel (right wall) */}
      <RoundedBox args={[0.014, 0.6, 0.13]} radius={0.005} smoothness={3}
        position={[W / 2 - WALL_T / 2 - 0.012, H * 0.55, D / 2 - 0.22]} castShadow>
        <meshPhysicalMaterial color="#050505" metalness={0.85} roughness={0.22}
          clearcoat={1} clearcoatRoughness={0.08} />
      </RoundedBox>
      {/* LED segment display */}
      <mesh position={[W / 2 - WALL_T / 2 - 0.022, H * 0.55 + 0.34, D / 2 - 0.22]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.07, 0.035]} />
        <meshBasicMaterial color="#ff7a2a" toneMapped={false} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[W / 2 - WALL_T / 2 - 0.022, H * 0.55 + 0.22 - i * 0.1, D / 2 - 0.22]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.014, 0.014, 0.006, 28]} />
            <meshPhysicalMaterial
              color={finish.trim}
              metalness={0.95}
              roughness={0.15}
              clearcoat={1}
              clearcoatRoughness={0.05}
              emissive={i === 0 ? "#ffb14a" : "#000000"}
              emissiveIntensity={i === 0 ? 1.4 : 0}
            />
          </mesh>
          {/* Inner ring */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
            <ringGeometry args={[0.011, 0.013, 32]} />
            <meshBasicMaterial color="#1a1a1a" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Door header */}
      <RoundedBox args={[W + 0.06, 0.08, 0.03]} radius={0.008} smoothness={3}
        position={[0, doorH + 0.05, doorZ]} castShadow>
        <meshPhysicalMaterial color={finish.trim} metalness={0.95} roughness={0.18}
          clearcoat={0.9} clearcoatRoughness={0.12}
          normalMap={tex.brushedN}
          normalScale={new THREE.Vector2(0.3, 0.3)} />
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
            <DoorLeaf width={W / 2 - 0.01} height={doorH} finish={finish} tex={tex} side="right" />
          </animated.group>
          <animated.group position-x={cSpring.cx.to((v) => W / 4 + v)} position-y={doorY} position-z={doorZ}>
            <DoorLeaf width={W / 2 - 0.01} height={doorH} finish={finish} tex={tex} side="left" />
          </animated.group>
        </>
      ) : (
        <>
          {/* Right leaf — slow panel, slides right at half speed (behind) */}
          <animated.group
            position-x={sSpring.slide.to((v) => W / 4 + v * 0.5)}
            position-y={doorY}
            position-z={doorZ - 0.012}
          >
            <DoorLeaf width={W / 2 - 0.01} height={doorH} finish={finish} tex={tex} side="right" />
          </animated.group>
          {/* Left leaf — fast panel, slides right at full speed (in front) */}
          <animated.group
            position-x={sSpring.slide.to((v) => -W / 4 + v)}
            position-y={doorY}
            position-z={doorZ + 0.002}
          >
            <DoorLeaf width={W / 2 - 0.01} height={doorH} finish={finish} tex={tex} darker side="left" />
          </animated.group>
        </>
      )}

      {/* Contact shadow plane (kept thin so reflective floor still reads) */}
      <mesh position={[0, 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W * 2.4, D * 2.4]} />
        <shadowMaterial opacity={0.35} />
      </mesh>
    </group>
  );
}

type TexBundle = ReturnType<typeof useMemoTexHack>;
// (only here to extract the inferred type)
function useMemoTexHack() {
  return {} as {
    brushedN: THREE.Texture;
    brushedR: THREE.Texture;
    microN: THREE.Texture;
    wood: THREE.Texture;
    marble: THREE.Texture;
    stone: THREE.Texture;
  };
}

function PanelledWall({
  position, rotation, size, depth, finish, kind, tex,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  depth: number;
  finish: CabinFinish;
  kind: MaterialKind;
  tex: TexBundle;
}) {
  const [w, h] = size;
  return (
    <group position={position} rotation={rotation}>
      {/* Main wall slab */}
      <RoundedBox args={[w, h, depth]} radius={0.012} smoothness={3} castShadow receiveShadow>
        <WallMaterial finish={finish} kind={kind} tex={tex} />
      </RoundedBox>
      {/* Two vertical seam grooves dividing wall into 3 panels */}
      {[-w / 6, w / 6].map((x, i) => (
        <mesh key={i} position={[x, 0, depth / 2 + 0.0005]}>
          <boxGeometry args={[0.004, h * 0.94, 0.002]} />
          <meshStandardMaterial color="#050505" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* Skirting board */}
      <mesh position={[0, -h / 2 + 0.05, depth / 2 + 0.0008]}>
        <boxGeometry args={[w * 0.99, 0.06, 0.004]} />
        <meshPhysicalMaterial color={finish.trim} metalness={0.9} roughness={0.25}
          clearcoat={0.7} clearcoatRoughness={0.18} />
      </mesh>
      {/* Top trim */}
      <mesh position={[0, h / 2 - 0.04, depth / 2 + 0.0008]}>
        <boxGeometry args={[w * 0.99, 0.025, 0.004]} />
        <meshPhysicalMaterial color={finish.trim} metalness={0.9} roughness={0.22}
          clearcoat={0.8} clearcoatRoughness={0.15} />
      </mesh>
    </group>
  );
}

function WallMaterial({ finish, kind, tex }: { finish: CabinFinish; kind: MaterialKind; tex: TexBundle }) {
  switch (kind) {
    case "brushed":
      return (
        <meshPhysicalMaterial
          color={finish.wall}
          metalness={Math.max(0.65, finish.metalness)}
          roughness={finish.roughness}
          clearcoat={0.85}
          clearcoatRoughness={0.18}
          normalMap={tex.brushedN}
          normalScale={new THREE.Vector2(0.7, 0.7)}
          roughnessMap={tex.brushedR}
          envMapIntensity={1.3}
          anisotropy={0.8}
          anisotropyRotation={Math.PI / 2}
        />
      );
    case "wood":
      return (
        <meshPhysicalMaterial
          map={tex.wood}
          metalness={0.15}
          roughness={0.5}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
          normalMap={tex.microN}
          normalScale={new THREE.Vector2(0.5, 0.5)}
        />
      );
    case "stone":
      return (
        <meshPhysicalMaterial
          map={tex.marble}
          metalness={0.05}
          roughness={0.32}
          clearcoat={0.8}
          clearcoatRoughness={0.15}
          normalMap={tex.microN}
          normalScale={new THREE.Vector2(0.25, 0.25)}
        />
      );
    case "mirror":
      // Soft-tinted reflective panel — perfectly polished mirror reads as "wrong"
      // because the HDRI env shows too literally. Keep some roughness for blur.
      return (
        <meshPhysicalMaterial
          color={finish.wall}
          metalness={1}
          roughness={0.18}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
          envMapIntensity={1.0}
          normalMap={tex.microN}
          normalScale={new THREE.Vector2(0.2, 0.2)}
        />
      );
    default:
      return (
        <meshPhysicalMaterial
          color={finish.wall}
          metalness={finish.metalness}
          roughness={finish.roughness}
          clearcoat={0.3}
          clearcoatRoughness={0.25}
          normalMap={tex.microN}
          normalScale={new THREE.Vector2(0.3, 0.3)}
        />
      );
  }
}

function DoorLeaf({
  width, height, finish, tex, darker = false, side = "left",
}: {
  width: number;
  height: number;
  finish: CabinFinish;
  tex: TexBundle;
  darker?: boolean;
  side?: "left" | "right";
}) {
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const handleX = side === "left" ? width / 2 - 0.04 : -width / 2 + 0.04;
  return (
    <>
      <RoundedBox args={[width, height, 0.025]} radius={0.006} smoothness={3} castShadow>
        <meshPhysicalMaterial
          ref={matRef}
          color={darker ? new THREE.Color(finish.trim).multiplyScalar(0.78) : finish.trim}
          metalness={0.95}
          roughness={0.22}
          clearcoat={0.95}
          clearcoatRoughness={0.12}
          normalMap={tex.brushedN}
          normalScale={new THREE.Vector2(0.55, 0.55)}
          roughnessMap={tex.brushedR}
          envMapIntensity={1.4}
          anisotropy={0.7}
          anisotropyRotation={0}
        />
      </RoundedBox>
      {/* Inset vertical seam on the inner edge */}
      <mesh position={[side === "left" ? -width / 2 + 0.012 : width / 2 - 0.012, 0, 0.013]}>
        <boxGeometry args={[0.003, height * 0.96, 0.002]} />
        <meshStandardMaterial color="#050505" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Vertical door pull / handle */}
      <group position={[handleX, 0, 0.018]}>
        {/* Mounts */}
        {[-height * 0.18, height * 0.18].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.025, 16]} />
            <meshPhysicalMaterial color={finish.trim} metalness={0.97} roughness={0.12} clearcoat={1} />
          </mesh>
        ))}
        {/* Bar */}
        <mesh position={[0, 0, 0.012]}>
          <cylinderGeometry args={[0.009, 0.009, height * 0.44, 24]} />
          <meshPhysicalMaterial color={finish.trim} metalness={0.97} roughness={0.1}
            clearcoat={1} clearcoatRoughness={0.05}
            normalMap={tex.brushedN}
            normalScale={new THREE.Vector2(0.3, 0.3)} />
        </mesh>
      </group>
    </>
  );
}
