import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Html } from "@react-three/drei";
import { EffectComposer, Bloom, N8AO, Vignette, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { createXRStore, XR, XRDomOverlay, useXR, useXRSessionModeSupported } from "@react-three/xr";
import ShaftScene from "../three/ShaftScene";
import ARShaft from "../three/ARShaft";
import { FRAME_COLORS, useConfig, type InfillTexture } from "../store";
import { DEVICE } from "../utils/device";

const TEX: { id: InfillTexture; name: string; preview: string }[] = [
  { id: "empty",  name: "Empty",     preview: "transparent" },
  { id: "glass",  name: "Glass",     preview: "linear-gradient(135deg,#b8d4dc,#5a7a8c)" },
  { id: "rcp",    name: "RCP Tape",  preview: "repeating-linear-gradient(45deg,#0a0a0a 0 4px,#1a1a1a 4px 8px)" },
  { id: "mesh",   name: "Mesh",      preview: "radial-gradient(circle at 30% 30%,#5a5a5a 1px,transparent 2px) 0 0/6px 6px,#2a2a2a" },
  { id: "oak",    name: "Oak",       preview: "linear-gradient(135deg,#6a4a30,#3a2a1c)" },
  { id: "marble", name: "Marble",    preview: "linear-gradient(135deg,#ece7df,#cfc6b8)" },
];

export default function Shaft() {
  const frameId = useConfig((s) => s.frameColorId);
  const setFrame = useConfig((s) => s.setFrameColor);
  const selected = useConfig((s) => s.selectedPanel);
  const applyInfill = useConfig((s) => s.applyInfill);
  const reset = useConfig((s) => s.resetShaft);
  const infill = useConfig((s) => s.infill);
  const selectedTex = selected !== null ? infill[selected] : null;

  // One XR store shared by the Canvas and the AR button
  const xrStore = useMemo(
    () => createXRStore({
      controller: false,
      hand: false,
      offerSession: undefined,
    }),
    [],
  );

  // Feature support check (browsers without WebXR hide the AR button)
  const [arAvailable, setArAvailable] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.xr?.isSessionSupported) return;
    navigator.xr
      .isSessionSupported("immersive-ar")
      .then((ok) => setArAvailable(!!ok))
      .catch(() => setArAvailable(false));
  }, []);

  return (
    <div className="viewer">
      <div className="canvas-wrap">
        <Canvas
          shadows="soft"
          dpr={DEVICE.dpr}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          camera={{ position: [4.5, 2.4, 5.5], fov: 40 }}
        >
          <XR store={xrStore}>
            <SceneContent />
          </XR>
        </Canvas>

        <div className="viewer-overlay">
          <span className="title">Shaft · Schematic</span>
          <span className="pill">
            {selected === null ? "Tap a bay" : `Bay ${selected + 1} selected`}
          </span>
        </div>

        <div className="hint">
          {selected === null ? "Tap any empty bay, then pick an infill below" : "Now pick an infill material"}
        </div>

        {arAvailable && (
          <button className="ar-btn" onClick={() => xrStore.enterAR()}>
            <span className="ar-dot" /> Enter AR
          </button>
        )}
      </div>

      <div className="controls">
        <div className="row">
          <div className="label">Frame</div>
          <div className="swatches">
            {FRAME_COLORS.map((c) => (
              <button
                key={c.id}
                className={`dot ${frameId === c.id ? "sel" : ""}`}
                style={{ background: c.hex }}
                onClick={() => setFrame(c.id)}
                aria-label={c.name}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="row">
          <div className="label">Infill</div>
          <div className="tex-rail">
            {TEX.map((t) => (
              <button
                key={t.id}
                className={`tex-chip ${selectedTex === t.id ? "sel" : ""}`}
                disabled={selected === null}
                onClick={() => applyInfill(t.id)}
              >
                <span className="mini" style={{ background: t.preview }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="row">
          <div className="label">&nbsp;</div>
          <button className="action ghost" onClick={reset}>Reset all bays</button>
        </div>
      </div>
    </div>
  );
}

// Conditionally renders desktop scene OR AR scene based on session state
function SceneContent() {
  const inAR = useXR((s) => s.session != null);
  const [arActive, setArActive] = useState(false);
  useEffect(() => { setArActive(inAR); }, [inAR]);

  if (inAR) {
    return (
      <>
        <ARShaft active={arActive} onExit={() => setArActive(false)} />
        <XRDomOverlay
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            color: "#fff",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          }}
        >
          <div style={{
            position: "absolute",
            top: 24, left: "50%", transform: "translateX(-50%)",
            padding: "10px 16px",
            background: "rgba(10,10,10,0.7)",
            borderRadius: 999,
            fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
            border: "1px solid rgba(201,169,110,0.4)",
            pointerEvents: "auto",
          }}>
            Tap floor to place · Pinch to resize
          </div>
        </XRDomOverlay>
      </>
    );
  }

  return (
    <>
      <color attach="background" args={["#060606"]} />
      <fog attach="fog" args={["#060606", 10, 24]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[6, 9, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={DEVICE.shadowMapSize}
        shadow-mapSize-height={DEVICE.shadowMapSize}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-5, 4, -3]} intensity={0.45} color="#8aa6c4" />

      <Suspense fallback={<Html center><div className="loader">Loading shaft…</div></Html>}>
        <Environment preset="studio" environmentIntensity={1.0} />
        <ShaftScene />
        <ContactShadows position={[0, -3.6, 0]} opacity={0.45} scale={12} blur={DEVICE.contactShadowBlur} far={5} />
      </Suspense>

      {DEVICE.enableSMAA ? (
        <EffectComposer multisampling={0} enableNormalPass>
          <N8AO aoRadius={0.5} intensity={2.0} distanceFalloff={1.2} quality="medium" />
          <Bloom mipmapBlur intensity={0.4} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
          <SMAA />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette eskil={false} offset={0.25} darkness={0.5} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0} enableNormalPass>
          <N8AO aoRadius={0.35} intensity={2.0} distanceFalloff={1.2} quality="low" />
          <Bloom mipmapBlur intensity={0.4} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette eskil={false} offset={0.25} darkness={0.5} />
        </EffectComposer>
      )}

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        minDistance={4}
        maxDistance={12}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
    </>
  );
}

// Quiet unused-import warning when XRSessionModeSupported hook isn't used directly
void useXRSessionModeSupported;
