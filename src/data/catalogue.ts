// Static catalogue data — placeholder content for v1.
// Replace copy and swatches as real Blackstone product sheets come in.

export type SwatchItem = {
  id: string;
  name: string;
  tag: string;
  css: string; // CSS background for the swatch preview
};

export const CABIN_WALL_FINISHES: SwatchItem[] = [
  { id: "champagne", name: "Champagne Gold",   tag: "Premium",  css: "linear-gradient(135deg,#c9a96e,#8c7440)" },
  { id: "noir",      name: "Noir Brushed",     tag: "Signature",css: "linear-gradient(135deg,#2a2a2a,#0e0e0e)" },
  { id: "ivory",     name: "Ivory Stone",      tag: "Classic",  css: "linear-gradient(135deg,#e7dfd2,#bfb6a4)" },
  { id: "graphite",  name: "Graphite Steel",   tag: "Industrial", css: "linear-gradient(135deg,#5a6168,#2a2e32)" },
  { id: "rosewood",  name: "Rosewood + Brass", tag: "Heritage", css: "linear-gradient(135deg,#7a3a28,#3a1810)" },
  { id: "mirror",    name: "Mirror Polish",    tag: "Statement",css: "linear-gradient(135deg,#f1f1f1,#9c9c9c)" },
];

export const SHAFT_INFILL: SwatchItem[] = [
  { id: "glass",  name: "Tempered Glass",  tag: "Clear",   css: "linear-gradient(135deg,rgba(180,210,220,0.55),rgba(120,150,170,0.25))" },
  { id: "rcp",    name: "RCP Black Tape",  tag: "Privacy", css: "repeating-linear-gradient(45deg,#0a0a0a 0 8px,#1a1a1a 8px 16px)" },
  { id: "mesh",   name: "Perforated Mesh", tag: "Vented",  css: "radial-gradient(circle at 30% 30%,#5a5a5a 1px,transparent 2px) 0 0/8px 8px,#2a2a2a" },
  { id: "oak",    name: "Smoked Oak",      tag: "Warm",    css: "linear-gradient(135deg,#6a4a30,#3a2a1c)" },
  { id: "marble", name: "Italian Marble",  tag: "Luxe",    css: "linear-gradient(135deg,#ece7df 0%,#cfc6b8 40%,#ece7df 70%)" },
];

export const FRAME_COLORS: SwatchItem[] = [
  { id: "raven",    name: "Raven Black",   tag: "Standard", css: "#16181b" },
  { id: "graphite", name: "Graphite Grey", tag: "Modern",   css: "#4a4f55" },
  { id: "ivory",    name: "Ivory White",   tag: "Soft",     css: "#e8e2d6" },
  { id: "bronze",   name: "Burnt Bronze",  tag: "Warm",     css: "#5a3a22" },
];

export type Service = { id: string; name: string; desc: string };

export const SERVICES: Service[] = [
  { id: "new",     name: "New Installation",       desc: "Turn-key supply, install and commissioning of passenger, home and service lifts across South India." },
  { id: "modern",  name: "Modernisation",          desc: "Cabin, controller and drive upgrades for existing shafts — restore reliability without civil work." },
  { id: "amc",     name: "Annual Maintenance",     desc: "Quarterly inspection, lubrication and safety audit. 24×7 breakdown response within Chennai metro." },
  { id: "hospital",name: "Hospital & Stretcher",   desc: "Compliant cabins sized for trolleys with sealed surfaces and silent VVVF drives." },
  { id: "freight", name: "Freight & Goods",        desc: "Heavy-duty platforms from 500 kg to 3000 kg with reinforced flooring and bumper rails." },
  { id: "dumb",    name: "Dumbwaiters",            desc: "Compact service lifts for kitchens, pharmacies and document transfer between floors." },
];
