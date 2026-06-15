// Procedurally generated textures (no external assets). Run once at module load,
// cached and reused across the scene.

import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

function makeTex(key: string, draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 512): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

// 16-bit-ish hashable noise for repeatable detail (without external deps)
function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function valueNoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}
function fbm(x: number, y: number, octaves = 5) {
  let v = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    v += amp * valueNoise(x * freq, y * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return v;
}

/** Horizontal brushed-metal normal map. Streaky highlights along U. */
export function brushedMetalNormal(repeat = 2) {
  const tex = makeTex("brushed-normal", (ctx, S) => {
    // base normal = (0.5, 0.5, 1) → rgb(128,128,255)
    ctx.fillStyle = "rgb(128,128,255)";
    ctx.fillRect(0, 0, S, S);
    const img = ctx.getImageData(0, 0, S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        // Strong horizontal variation, weak vertical
        const n = valueNoise(x * 0.6, y * 0.025) * 2 - 1;     // long horizontal scratches
        const m = valueNoise(x * 0.05, y * 0.6) * 0.15;        // fine vertical jitter
        const dx = n * 50;
        const dy = m * 12;
        const i = (y * S + x) * 4;
        d[i + 0] = Math.max(0, Math.min(255, 128 + dx));
        d[i + 1] = Math.max(0, Math.min(255, 128 + dy));
        d[i + 2] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.needsUpdate = true;
  return t;
}

/** Subtle micro-noise normal — adds skin to flat surfaces. */
export function microNoiseNormal(repeat = 4, strength = 0.4) {
  const tex = makeTex("micro-normal", (ctx, S) => {
    ctx.fillStyle = "rgb(128,128,255)";
    ctx.fillRect(0, 0, S, S);
    const img = ctx.getImageData(0, 0, S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const n = fbm(x * 0.06, y * 0.06, 4);
        const dx = (n - 0.5) * 60 * strength;
        const dy = (fbm(x * 0.06 + 7, y * 0.06 - 3, 4) - 0.5) * 60 * strength;
        const i = (y * S + x) * 4;
        d[i + 0] = Math.max(0, Math.min(255, 128 + dx));
        d[i + 1] = Math.max(0, Math.min(255, 128 + dy));
        d[i + 2] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.needsUpdate = true;
  return t;
}

/** Wood grain albedo. Returns warm streaky pattern. */
export function woodAlbedo(base = "#5a2a1f") {
  return makeTex(`wood-${base}`, (ctx, S) => {
    const g = ctx.createLinearGradient(0, 0, S, 0);
    g.addColorStop(0, base);
    g.addColorStop(1, base);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const img = ctx.getImageData(0, 0, S, S);
    const d = img.data;
    const c = new THREE.Color(base);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        // Curving grain — fbm warped Y
        const warp = fbm(x * 0.012, y * 0.003, 4) * 20;
        const ring = Math.sin((y + warp) * 0.12) * 0.5 + 0.5;
        const noise = fbm(x * 0.06, y * 0.6, 4) * 0.4;
        const k = ring * 0.5 + noise * 0.7;
        const r = c.r + (k - 0.5) * 0.35;
        const g2 = c.g + (k - 0.5) * 0.25;
        const b = c.b + (k - 0.5) * 0.20;
        const i = (y * S + x) * 4;
        d[i + 0] = Math.max(0, Math.min(255, r * 255));
        d[i + 1] = Math.max(0, Math.min(255, g2 * 255));
        d[i + 2] = Math.max(0, Math.min(255, b * 255));
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

/** Marble albedo with veining. */
export function marbleAlbedo() {
  return makeTex("marble", (ctx, S) => {
    ctx.fillStyle = "#ece7df";
    ctx.fillRect(0, 0, S, S);
    const img = ctx.getImageData(0, 0, S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const turb = fbm(x * 0.012, y * 0.012, 5);
        // Veins where sin of warped coord crosses
        const vein = Math.abs(Math.sin(x * 0.02 + turb * 8));
        const vk = Math.pow(1 - vein, 22) * 0.7;
        const grit = fbm(x * 0.06, y * 0.06, 4) * 0.08;
        const v = 0.94 - vk + grit;
        const i = (y * S + x) * 4;
        d[i + 0] = Math.max(0, Math.min(255, v * 255));
        d[i + 1] = Math.max(0, Math.min(255, (v - 0.02) * 255));
        d[i + 2] = Math.max(0, Math.min(255, (v - 0.05) * 255));
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

/** Floor stone albedo — dark with subtle granite-like flecks. */
export function darkStoneAlbedo(base = "#1a1a1a") {
  return makeTex(`stone-${base}`, (ctx, S) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    const img = ctx.getImageData(0, 0, S, S);
    const d = img.data;
    const c = new THREE.Color(base);
    for (let i = 0; i < S * S; i++) {
      const j = i * 4;
      const flicker = (Math.random() - 0.5) * 0.08;
      const fleck = Math.random() < 0.002 ? 0.35 : 0;
      d[j + 0] = Math.max(0, Math.min(255, (c.r + flicker + fleck) * 255));
      d[j + 1] = Math.max(0, Math.min(255, (c.g + flicker + fleck) * 255));
      d[j + 2] = Math.max(0, Math.min(255, (c.b + flicker + fleck) * 255));
      d[j + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
}

/** Brushed-metal roughness map: streaks vary roughness for that anisotropic look. */
export function brushedMetalRoughness(repeat = 2, base = 0.25) {
  const tex = makeTex(`brushed-rough-${base}`, (ctx, S) => {
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const n = valueNoise(x * 0.6, y * 0.03);
        const v = (base + (n - 0.5) * 0.35) * 255;
        const i = (y * S + x) * 4;
        d[i + 0] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, v));
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.needsUpdate = true;
  return t;
}
