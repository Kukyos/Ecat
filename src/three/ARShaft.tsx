import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useXR, useXRHitTest, XROrigin } from "@react-three/xr";
import * as THREE from "three";
import ShaftScene from "./ShaftScene";

// Working buffers
const matrixHelper = new THREE.Matrix4();
const hitPos = new THREE.Vector3();
const hitQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();

const SHAFT_HEIGHT = 7.2; // matches ShaftScene SH

type Placement = { pos: THREE.Vector3; quat: THREE.Quaternion };

export default function ARShaft({
  active,
  onExit,
}: {
  active: boolean;
  onExit: () => void;
}) {
  const session = useXR((s) => s.session);
  const inSession = session != null;
  const [placed, setPlaced] = useState<Placement | null>(null);
  const [scale, setScale] = useState(0.12); // ~86 cm tall demo shaft
  const reticleRef = useRef<THREE.Group>(null);
  const reticleVisible = useRef(false);

  // Continuous hit-test against detected planes (floor)
  useXRHitTest((results, getWorldMatrix) => {
    if (!active || placed || results.length === 0) {
      reticleVisible.current = false;
      return;
    }
    if (getWorldMatrix(matrixHelper, results[0])) {
      matrixHelper.decompose(hitPos, hitQuat, tmpScale);
      reticleVisible.current = true;
    }
  }, "viewer");

  useFrame(() => {
    if (!reticleRef.current) return;
    const show = reticleVisible.current && !placed && active;
    reticleRef.current.visible = show;
    if (show) {
      reticleRef.current.position.copy(hitPos);
      reticleRef.current.quaternion.copy(hitQuat);
    }
  });

  // Tap-to-place via XR session 'select' event
  useEffect(() => {
    if (!session || !active) return;
    const onSelect = () => {
      if (!placed && reticleVisible.current) {
        setPlaced({ pos: hitPos.clone(), quat: hitQuat.clone() });
      }
    };
    session.addEventListener("select", onSelect);
    return () => session.removeEventListener("select", onSelect);
  }, [session, placed, active]);

  // Two-finger pinch on the screen → scale the placed shaft
  useEffect(() => {
    if (!inSession || !active) return;
    let lastDist = 0;
    const onMove = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastDist = 0;
        return;
      }
      const a = e.touches[0], b = e.touches[1];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (lastDist > 0) {
        const ratio = d / lastDist;
        setScale((s) => Math.max(0.04, Math.min(0.8, s * ratio)));
      }
      lastDist = d;
    };
    const onEnd = (e: TouchEvent) => { if (e.touches.length < 2) lastDist = 0; };
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [inSession, active]);

  // Reset placement if session ends
  useEffect(() => {
    if (!inSession) {
      setPlaced(null);
      setScale(0.12);
      onExit();
    }
  }, [inSession, onExit]);

  if (!inSession || !active) return null;

  return (
    <>
      <XROrigin />
      {/* AR-friendly lighting: bright ambient + soft key, no env background */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[3, 5, 2]} intensity={0.7} castShadow={false} />
      <directionalLight position={[-2, 3, -3]} intensity={0.3} color="#8aa6c4" />

      {/* Reticle — pulses on detected floor */}
      <group ref={reticleRef} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.07, 0.085, 48]} />
          <meshBasicMaterial color="#c9a96e" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.04, 0.05, 32]} />
          <meshBasicMaterial color="#c9a96e" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Placed shaft */}
      {placed && (
        <group position={placed.pos} quaternion={placed.quat} scale={scale}>
          {/* ShaftScene wraps content at y = -SH/2; shift up so bottom sits on surface */}
          <group position={[0, SHAFT_HEIGHT / 2, 0]}>
            <ShaftScene />
          </group>
        </group>
      )}
    </>
  );
}
