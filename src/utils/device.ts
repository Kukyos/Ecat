// Device detection utility — determines performance tier at startup.
// Used by 3D scenes and texture generators to scale quality.

const isTabletDevice = (() => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const touch = navigator.maxTouchPoints > 0;
  const w = Math.max(window.innerWidth, window.innerHeight);
  // Tablets: touch-capable with screen size between 600–1400px
  return touch && w >= 600 && w <= 1400;
})();

export const DEVICE = {
  isTablet: isTabletDevice,
  /** DPR range for R3F Canvas */
  dpr: (isTabletDevice ? [1, 1.5] : [1, 1.75]) as [number, number],
  /** Shadow-map resolution */
  shadowMapSize: isTabletDevice ? 1024 : 2048,
  /** Procedural texture canvas size */
  textureSize: isTabletDevice ? 256 : 512,
  /** FBM octaves for procedural textures */
  fbmOctaves: isTabletDevice ? 3 : 5,
  /** Texture anisotropy (most tablet GPUs max at 4) */
  anisotropy: isTabletDevice ? 4 : 8,
  /** MeshReflectorMaterial resolution */
  reflectorResolution: isTabletDevice ? 512 : 1024,
  /** ContactShadows blur factor */
  contactShadowBlur: isTabletDevice ? 1.8 : 2.6,
  /** N8AO quality setting */
  aoQuality: (isTabletDevice ? 'low' : 'medium') as 'low' | 'medium',
  /** Whether to enable SMAA (redundant with HW AA on tablets) */
  enableSMAA: !isTabletDevice,
} as const;
