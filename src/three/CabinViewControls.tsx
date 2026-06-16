import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CabinView } from "../store";

// World-space camera poses. The cabin group is centred at world origin
// (the scene shifts by -H/2 so floor sits at y = -1.1 and ceiling at y = 1.1).
export const EXTERIOR_POS = new THREE.Vector3(2.6, 1.4, 3.2);
export const EXTERIOR_LOOK = new THREE.Vector3(0, 0, 0);
export const EXTERIOR_FOV = 38;

// Inside cabin, eye-level (≈ 1.6m above floor), nudged slightly toward
// the doors so the operator panel + handrail are immediately in frame.
export const INTERIOR_POS = new THREE.Vector3(0, 0.45, 0.05);
export const INTERIOR_LOOK = new THREE.Vector3(0, 0.45, 1); // facing doors
export const INTERIOR_FOV = 62;

const TRANSITION_S = 1.4;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

type RigProps = {
  view: CabinView;
  onTransitionChange: (transitioning: boolean) => void;
};

/**
 * Animates the camera between exterior orbit pose and interior 360 pose
 * whenever `view` changes. Snapshots the live camera state on each switch
 * so a transition mid-orbit looks continuous.
 */
export function CabinCameraRig({ view, onTransitionChange }: RigProps) {
  const { camera } = useThree();
  const progress = useRef(1); // 1 = settled, <1 = animating
  const startPos = useRef(new THREE.Vector3());
  const startQuat = useRef(new THREE.Quaternion());
  const startFov = useRef(EXTERIOR_FOV);
  const endPos = useRef(new THREE.Vector3());
  const endQuat = useRef(new THREE.Quaternion());
  const endFov = useRef(EXTERIOR_FOV);

  // Initial pose: snap to exterior on mount so the camera defined in <Canvas camera>
  // matches our rig's authoritative pose.
  useEffect(() => {
    camera.position.copy(EXTERIOR_POS);
    camera.lookAt(EXTERIOR_LOOK);
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      (camera as THREE.PerspectiveCamera).fov = EXTERIOR_FOV;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    startPos.current.copy(camera.position);
    startQuat.current.copy(camera.quaternion);
    startFov.current = (camera as THREE.PerspectiveCamera).fov ?? EXTERIOR_FOV;

    const targetPos = view === "exterior" ? EXTERIOR_POS : INTERIOR_POS;
    const targetLook = view === "exterior" ? EXTERIOR_LOOK : INTERIOR_LOOK;
    endPos.current.copy(targetPos);
    endFov.current = view === "exterior" ? EXTERIOR_FOV : INTERIOR_FOV;

    // Derive end quaternion via a throwaway matrix so we don't disturb the live camera.
    const m = new THREE.Matrix4().lookAt(targetPos, targetLook, new THREE.Vector3(0, 1, 0));
    endQuat.current.setFromRotationMatrix(m);

    progress.current = 0;
    onTransitionChange(true);
  }, [view, camera, onTransitionChange]);

  useFrame((_, dt) => {
    if (progress.current >= 1) return;
    // Cap dt so a stalled tab (huge rAF gap) doesn't skip the entire animation.
    const stepDt = Math.min(dt, 0.05);
    progress.current = Math.min(1, progress.current + stepDt / TRANSITION_S);
    const t = easeInOutCubic(progress.current);
    camera.position.lerpVectors(startPos.current, endPos.current, t);
    camera.quaternion.slerpQuaternions(startQuat.current, endQuat.current, t);
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera;
      persp.fov = startFov.current + (endFov.current - startFov.current) * t;
      persp.updateProjectionMatrix();
    }
    if (progress.current >= 1) {
      onTransitionChange(false);
    }
  });

  return null;
}

type LookProps = {
  enabled: boolean;
};

/**
 * First-person look-around for the interior view. Camera position is fixed;
 * pointer drag yaws/pitches it like a 360 video. Pitch is clamped, no zoom,
 * no movement.
 */
export function CabinInteriorLook({ enabled }: LookProps) {
  const { camera, gl } = useThree();
  // Yaw = π so we start facing +Z (toward doors), matching INTERIOR_LOOK.
  const yaw = useRef(Math.PI);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const wasEnabled = useRef(false);

  // Sync local yaw/pitch from the current camera quaternion when we
  // transition into enabled state, so the look-around picks up exactly where
  // the rig settled.
  const syncFromCamera = useMemo(
    () => () => {
      const e = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
      yaw.current = e.y;
      pitch.current = e.x;
    },
    [camera]
  );

  useEffect(() => {
    if (enabled && !wasEnabled.current) syncFromCamera();
    wasEnabled.current = enabled;
  }, [enabled, syncFromCamera]);

  useEffect(() => {
    if (!enabled) return;
    const dom = gl.domElement;

    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      try {
        dom.setPointerCapture(e.pointerId);
      } catch {
        // pointerId may be invalid on some touch impls — ignore.
      }
      dom.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      // Negative dx → drag right turns view right (natural 360-video feel).
      yaw.current -= dx * 0.005;
      pitch.current -= dy * 0.005;
      const limit = Math.PI / 2 - 0.05;
      if (pitch.current > limit) pitch.current = limit;
      if (pitch.current < -limit) pitch.current = -limit;
    };
    const onUp = (e: PointerEvent) => {
      dragging.current = false;
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      dom.style.cursor = "grab";
    };

    dom.style.cursor = "grab";
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointermove", onMove);
    dom.addEventListener("pointerup", onUp);
    dom.addEventListener("pointercancel", onUp);
    dom.addEventListener("pointerleave", onUp);
    return () => {
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerup", onUp);
      dom.removeEventListener("pointercancel", onUp);
      dom.removeEventListener("pointerleave", onUp);
      dom.style.cursor = "";
    };
  }, [enabled, gl.domElement]);

  useFrame(() => {
    if (!enabled) return;
    const e = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
    camera.quaternion.setFromEuler(e);
    // Lock position — should already be at INTERIOR_POS, but defend against drift.
    camera.position.copy(INTERIOR_POS);
  });

  return null;
}
