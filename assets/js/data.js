/* PixForge data: adjustments, filter presets, passport specs, socials. */

// Adjustment sliders. Each maps to a CSS canvas filter; `unit` appended; `def` default.
window.ADJUSTMENTS = [
  { key: "brightness", label: "Brightness", min: 0, max: 200, def: 100, unit: "%" },
  { key: "contrast",   label: "Contrast",   min: 0, max: 200, def: 100, unit: "%" },
  { key: "saturate",   label: "Saturation", min: 0, max: 200, def: 100, unit: "%" },
  { key: "warmth",     label: "Warmth",     min: -100, max: 100, def: 0, unit: "" },   // hue-rotate-ish
  { key: "sepia",      label: "Sepia",      min: 0, max: 100, def: 0, unit: "%" },
  { key: "grayscale",  label: "B&W",        min: 0, max: 100, def: 0, unit: "%" },
  { key: "blur",       label: "Blur",       min: 0, max: 20,  def: 0, unit: "px" },
  { key: "vignette",   label: "Vignette",   min: 0, max: 100, def: 0, unit: "" },      // custom overlay
];

// One-click filter presets → adjustment overrides.
window.FILTERS = [
  { name: "Original", a: {} },
  { name: "Vivid",    a: { saturate: 150, contrast: 115, brightness: 105 } },
  { name: "Clarity",  a: { contrast: 125, saturate: 110, brightness: 103 } },
  { name: "Warm",     a: { warmth: 45, saturate: 115, brightness: 104 } },
  { name: "Cool",     a: { warmth: -45, saturate: 108 } },
  { name: "B&W",      a: { grayscale: 100, contrast: 115 } },
  { name: "Noir",     a: { grayscale: 100, contrast: 145, brightness: 95, vignette: 45 } },
  { name: "Sepia",    a: { sepia: 80, saturate: 90, brightness: 105 } },
  { name: "Vintage",  a: { sepia: 35, saturate: 85, contrast: 95, warmth: 25, vignette: 35 } },
  { name: "Fade",     a: { contrast: 88, saturate: 80, brightness: 110 } },
  { name: "Punch",    a: { contrast: 130, saturate: 140 } },
  { name: "Dramatic", a: { contrast: 140, saturate: 95, brightness: 96, vignette: 30 } },
];

// Passport specs. Sizes in mm at 300 DPI. px = round(mm / 25.4 * 300).
window.PASSPORT = [
  { id: "us",      name: "USA — 2×2 in (51×51 mm)",        w: 51, h: 51 },
  { id: "in",      name: "India — 35×45 mm",               w: 35, h: 45 },
  { id: "uk",      name: "UK — 35×45 mm",                  w: 35, h: 45 },
  { id: "eu",      name: "Schengen / EU — 35×45 mm",       w: 35, h: 45 },
  { id: "ca",      name: "Canada — 50×70 mm",              w: 50, h: 70 },
  { id: "au",      name: "Australia — 35×45 mm",           w: 35, h: 45 },
  { id: "cn",      name: "China — 33×48 mm",               w: 33, h: 48 },
  { id: "jp",      name: "Japan — 35×45 mm",               w: 35, h: 45 },
  { id: "br",      name: "Brazil — 50×70 mm",              w: 50, h: 70 },
  { id: "sg",      name: "Singapore — 35×45 mm",           w: 35, h: 45 },
  { id: "visa2",   name: "US Visa — 2×2 in (51×51 mm)",    w: 51, h: 51 },
  { id: "id35x35", name: "ID — 35×35 mm",                  w: 35, h: 35 },
];
window.PASSPORT_DPI = 300;

window.SOCIALS = {
  github: "https://github.com/aashishbharti04",
  linkedin: "https://www.linkedin.com/in/aashana1012",
  instagram: "https://www.instagram.com/asurwave1012",
  youtube: "https://www.youtube.com/@CodeWithAsur",
  email: "corerankdigital@gmail.com",
};
