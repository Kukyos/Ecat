import { create } from "zustand";

export type DoorVariant = "center" | "side";
export type InfillTexture = "empty" | "glass" | "rcp" | "mesh" | "oak" | "marble";

export type CabinFinish = {
  id: string;
  name: string;
  wall: string;     // base color
  trim: string;     // trim / handrail
  floor: string;    // floor tone
  metalness: number;
  roughness: number;
};

export type FrameColor = {
  id: string;
  name: string;
  hex: string;
};

export const CABIN_FINISHES: CabinFinish[] = [
  { id: "champagne", name: "Champagne Gold",  wall: "#c9a96e", trim: "#8c7440", floor: "#1a1a1a", metalness: 0.7, roughness: 0.35 },
  { id: "noir",      name: "Noir Brushed",    wall: "#1f1f1f", trim: "#9c958a", floor: "#0e0e0e", metalness: 0.6, roughness: 0.5  },
  { id: "ivory",     name: "Ivory Stone",     wall: "#e7dfd2", trim: "#b48a3f", floor: "#2a241c", metalness: 0.1, roughness: 0.7  },
  { id: "graphite",  name: "Graphite Steel",  wall: "#3a3f44", trim: "#cfcfcf", floor: "#1a1a1a", metalness: 0.85, roughness: 0.3 },
  { id: "rosewood",  name: "Rosewood + Brass",wall: "#5a2a1f", trim: "#c9a96e", floor: "#2a1a14", metalness: 0.3, roughness: 0.55 },
  { id: "mirror",    name: "Mirror Polish",   wall: "#d8d8d8", trim: "#9c958a", floor: "#101010", metalness: 1.0, roughness: 0.08 },
];

export const FRAME_COLORS: FrameColor[] = [
  { id: "raven",    name: "Raven Black",   hex: "#16181b" },
  { id: "graphite", name: "Graphite Grey", hex: "#4a4f55" },
  { id: "ivory",    name: "Ivory White",   hex: "#e8e2d6" },
  { id: "bronze",   name: "Burnt Bronze",  hex: "#5a3a22" },
];

type State = {
  // cabin
  cabinFinishId: string;
  doorVariant: DoorVariant;
  doorsOpen: boolean;
  // shaft
  frameColorId: string;
  infill: InfillTexture[]; // length 12 (3 bays × 4 sides)
  selectedPanel: number | null;
  // actions
  setCabinFinish: (id: string) => void;
  setDoorVariant: (v: DoorVariant) => void;
  toggleDoors: () => void;
  setFrameColor: (id: string) => void;
  selectPanel: (i: number | null) => void;
  applyInfill: (tex: InfillTexture) => void;
  resetShaft: () => void;
};

export const useConfig = create<State>((set) => ({
  cabinFinishId: "champagne",
  doorVariant: "center",
  doorsOpen: false,
  frameColorId: "raven",
  infill: Array(12).fill("empty") as InfillTexture[],
  selectedPanel: null,

  setCabinFinish: (id) => set({ cabinFinishId: id }),
  setDoorVariant: (v) => set({ doorVariant: v, doorsOpen: false }),
  toggleDoors: () => set((s) => ({ doorsOpen: !s.doorsOpen })),
  setFrameColor: (id) => set({ frameColorId: id }),
  selectPanel: (i) => set({ selectedPanel: i }),
  applyInfill: (tex) =>
    set((s) => {
      if (s.selectedPanel === null) return s;
      const next = s.infill.slice();
      next[s.selectedPanel] = tex;
      return { infill: next };
    }),
  resetShaft: () => set({ infill: Array(12).fill("empty") as InfillTexture[], selectedPanel: null }),
}));

export const getCabinFinish = (id: string) =>
  CABIN_FINISHES.find((f) => f.id === id) ?? CABIN_FINISHES[0];
export const getFrameColor = (id: string) =>
  FRAME_COLORS.find((c) => c.id === id) ?? FRAME_COLORS[0];
