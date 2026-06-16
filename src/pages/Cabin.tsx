import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Html } from "@react-three/drei";
import { EffectComposer, Bloom, N8AO, Vignette, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useCallback, useState } from "react";
import * as THREE from "three";
import CabinScene from "../three/CabinScene";
import { CabinCameraRig, CabinInteriorLook } from "../three/CabinViewControls";
import { CABIN_FINISHES, useConfig } from "../store";
import { DEVICE } from "../utils/device";

export default function Cabin() {
  const finishId = useConfig((s) => s.cabinFinishId);
  const setFinish = useConfig((s) => s.setCabinFinish);
  const variant = useConfig((s) => s.doorVariant);
  const setVariant = useConfig((s) => s.setDoorVariant);
  const open = useConfig((s) => s.doorsOpen);
  const toggleDoors = useConfig((s) => s.toggleDoors);
  const view = useConfig((s) => s.cabinView);
  const setView = useConfig((s) => s.setCabinView);

  const [transitioning, setTransitioning] = useState(false);
  const handleTransitionChange = useCallback((t: boolean) => setTransitioning(t), []);

  const isInterior = view === "interior";
  const orbitEnabled = view === "exterior" && !transitioning;
  const lookEnabled = view === "interior" && !transitioning;

  return (
    <div className="viewer">
      <div className="canvas-wrap">
        <Canvas
          shadows="soft"
          dpr={DEVICE.dpr}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
          camera={{ position: [2.6, 1.4, 3.2], fov: 38 }}
        >
          <color attach="background" args={["#070707"]} />
          <fog attach="fog" args={["#070707", 6, 16]} />
          <ambientLight intensity={0.22} />
          <directionalLight
            position={[4, 7, 5]}
            intensity={1.6}
            castShadow
            shadow-mapSize-width={DEVICE.shadowMapSize}
            shadow-mapSize-height={DEVICE.shadowMapSize}
            shadow-bias={-0.0002}
            shadow-normalBias={0.02}
          />
          <directionalLight position={[-4, 3, -3]} intensity={0.35} color="#7aa6c4" />

          <Suspense fallback={<Html center><div className="loader">Loading cabin…</div></Html>}>
            <Environment preset="warehouse" environmentIntensity={0.85} />
            <CabinScene />
            <ContactShadows
              position={[0, -1.1, 0]}
              opacity={0.55}
              scale={8}
              blur={DEVICE.contactShadowBlur}
              far={3}
            />
          </Suspense>

          {DEVICE.enableSMAA ? (
            <EffectComposer multisampling={0} enableNormalPass>
              <N8AO aoRadius={DEVICE.isTablet ? 0.25 : 0.35} intensity={2.4} distanceFalloff={1} quality={DEVICE.aoQuality} />
              <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.85} luminanceSmoothing={0.22} />
              <SMAA />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
              <Vignette eskil={false} offset={0.2} darkness={0.55} />
            </EffectComposer>
          ) : (
            <EffectComposer multisampling={0} enableNormalPass>
              <N8AO aoRadius={0.25} intensity={2.4} distanceFalloff={1} quality="low" />
              <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.85} luminanceSmoothing={0.22} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
              <Vignette eskil={false} offset={0.2} darkness={0.55} />
            </EffectComposer>
          )}

          <CabinCameraRig view={view} onTransitionChange={handleTransitionChange} />
          <CabinInteriorLook enabled={lookEnabled} />

          {orbitEnabled && (
            <OrbitControls
              enablePan={false}
              enableDamping
              dampingFactor={0.12}
              minDistance={2.4}
              maxDistance={6}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.05}
              target={[0, 0, 0]}
              touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
            />
          )}
        </Canvas>

        <div className="viewer-overlay">
          <span className="title">Cabin · Live Preview</span>
          <div className="view-toggle" role="group" aria-label="Camera view">
            <button
              className={view === "exterior" ? "active" : ""}
              onClick={() => !transitioning && setView("exterior")}
              disabled={transitioning && !isInterior}
            >
              Outside
            </button>
            <button
              className={view === "interior" ? "active" : ""}
              onClick={() => !transitioning && setView("interior")}
              disabled={transitioning && isInterior}
            >
              Step Inside
            </button>
          </div>
        </div>

        <div className="hint">
          {transitioning
            ? isInterior
              ? "Stepping inside…"
              : "Stepping outside…"
            : isInterior
              ? "Drag to look around · 360°"
              : `${open ? "Doors open" : "Doors closed"} · ${variant === "center" ? "centre-opening" : "side-opening"}`}
        </div>
      </div>

      <div className="controls">
        <div className="row">
          <div className="label">Finish</div>
          <div className="swatches">
            {CABIN_FINISHES.map((f) => (
              <button
                key={f.id}
                className={`dot ${finishId === f.id ? "sel" : ""}`}
                style={{ background: `linear-gradient(135deg, ${f.wall}, ${f.trim})` }}
                onClick={() => setFinish(f.id)}
                aria-label={f.name}
                title={f.name}
              />
            ))}
          </div>
        </div>

        <div className="row">
          <div className="label">Doors</div>
          <div className="seg">
            <button className={variant === "center" ? "active" : ""} onClick={() => setVariant("center")}>Centre</button>
            <button className={variant === "side" ? "active" : ""} onClick={() => setVariant("side")}>Side</button>
          </div>
          <button className="action" onClick={toggleDoors}>
            {open ? "Close doors" : "Open doors"}
          </button>
        </div>
      </div>
    </div>
  );
}
