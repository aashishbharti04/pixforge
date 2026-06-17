/* PixForge — client-side image studio. No uploads, all canvas. */
const $ = (id) => document.getElementById(id);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const DPI = window.PASSPORT_DPI || 300;
const mm2px = (mm) => Math.round((mm / 25.4) * DPI);

const view = $("view");
const host = $("canvas-host");
const overlay = $("crop-overlay");

function defaultAdjust() {
  const a = {};
  window.ADJUSTMENTS.forEach((s) => (a[s.key] = s.def));
  return a;
}

const state = {
  originalImg: null,
  img: null,
  adjust: defaultAdjust(),
  rotation: 0, flipH: false, flipV: false,
  activeFilter: "Original",
  selMode: null,          // "crop" | "passport" | null
  sel: null,              // {x,y,w,h,aspect} in display px
};

// ---------- render pipeline ----------
function filterString() {
  const a = state.adjust;
  return `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturate}%) ` +
         `sepia(${a.sepia}%) grayscale(${a.grayscale}%) blur(${a.blur}px)`;
}

function orientedSize() {
  const r = ((state.rotation % 360) + 360) % 360;
  const w = state.img.naturalWidth, h = state.img.naturalHeight;
  return r === 90 || r === 270 ? { w: h, h: w } : { w, h };
}

let _raf = 0;
function renderView() {
  if (_raf) return;
  _raf = requestAnimationFrame(() => { _raf = 0; draw(view); });
}

function draw(canvas) {
  if (!state.img) return;
  const { w, h } = orientedSize();
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.filter = filterString();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
  ctx.drawImage(state.img, -state.img.naturalWidth / 2, -state.img.naturalHeight / 2);
  ctx.restore();

  const wv = state.adjust.warmth;
  if (wv) {
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = Math.min(0.65, (Math.abs(wv) / 100) * 0.65);
    ctx.fillStyle = wv > 0 ? "#ff9b3d" : "#3da5ff";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  const vv = state.adjust.vignette;
  if (vv) {
    ctx.save();
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${(vv / 100) * 0.78})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

// ---------- adjust sliders ----------
function buildSliders() {
  const box = $("sliders");
  box.innerHTML = "";
  window.ADJUSTMENTS.forEach((s) => {
    const row = document.createElement("div");
    row.className = "slider-row";
    row.innerHTML = `<div class="lbl"><span>${s.label}</span><b id="val-${s.key}"></b></div>
      <input type="range" id="adj-${s.key}" min="${s.min}" max="${s.max}" step="1" />`;
    box.appendChild(row);
    const input = row.querySelector("input");
    input.addEventListener("input", () => {
      state.adjust[s.key] = Number(input.value);
      $(`val-${s.key}`).textContent = input.value + (s.unit || "");
      state.activeFilter = null; highlightFilter();
      renderView();
    });
  });
  syncSliders();
}
function syncSliders() {
  window.ADJUSTMENTS.forEach((s) => {
    const i = $(`adj-${s.key}`); if (i) { i.value = state.adjust[s.key]; $(`val-${s.key}`).textContent = state.adjust[s.key] + (s.unit || ""); }
  });
}

// ---------- filters ----------
function buildFilters() {
  const grid = $("filter-grid");
  grid.innerHTML = "";
  window.FILTERS.forEach((f) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = f.name; b.dataset.name = f.name;
    b.addEventListener("click", () => applyFilter(f));
    grid.appendChild(b);
  });
  highlightFilter();
}
function applyFilter(f) {
  state.adjust = defaultAdjust();
  Object.assign(state.adjust, f.a);
  state.activeFilter = f.name;
  syncSliders(); highlightFilter(); renderView();
}
function highlightFilter() {
  document.querySelectorAll("#filter-grid button").forEach((b) =>
    b.classList.toggle("active", b.dataset.name === state.activeFilter));
}

// ---------- auto-enhance ----------
function autoEnhance() {
  const s = Math.min(220, state.img.naturalWidth);
  const t = document.createElement("canvas");
  t.width = s; t.height = Math.max(1, Math.round(state.img.naturalHeight * (s / state.img.naturalWidth)));
  const tx = t.getContext("2d"); tx.drawImage(state.img, 0, 0, t.width, t.height);
  const d = tx.getImageData(0, 0, t.width, t.height).data;
  const n = t.width * t.height;
  const hist = new Array(256).fill(0); let sum = 0;
  for (let i = 0; i < n; i++) {
    const L = Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]);
    hist[L]++; sum += L;
  }
  const mean = sum / n;
  let acc = 0, p2 = 0, p98 = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * 0.02) { p2 = v; break; } }
  acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= n * 0.02) { p98 = v; break; } }
  const spread = Math.max(1, p98 - p2);
  state.adjust.contrast = clamp(Math.round((255 / spread) * 100), 100, 165);
  state.adjust.brightness = clamp(Math.round(100 + (128 - mean) * 0.25), 85, 135);
  state.adjust.saturate = clamp(state.adjust.saturate + 12, 0, 160);
  state.activeFilter = null; syncSliders(); highlightFilter(); renderView();
}

// ---------- transform ----------
function transform(act) {
  if (act === "rot-left") state.rotation -= 90;
  else if (act === "rot-right") state.rotation += 90;
  else if (act === "flip-h") state.flipH = !state.flipH;
  else if (act === "flip-v") state.flipV = !state.flipV;
  renderView();
  if (state.selMode) showSel(currentAspect());
}

// ---------- selection box (crop + passport) ----------
function showSel(aspect) {
  draw(view); // make sure view sized
  const dw = view.clientWidth, dh = view.clientHeight;
  let w, h;
  if (aspect) { w = dw * 0.7; h = w / aspect; if (h > dh * 0.92) { h = dh * 0.92; w = h * aspect; } }
  else { w = dw * 0.8; h = dh * 0.8; }
  state.sel = { x: (dw - w) / 2, y: (dh - h) / 2, w, h, aspect: aspect || null };
  layoutSel(); overlay.hidden = false;
}
function layoutSel() {
  const s = state.sel; if (!s) return;
  overlay.style.left = s.x + "px"; overlay.style.top = s.y + "px";
  overlay.style.width = s.w + "px"; overlay.style.height = s.h + "px";
}
function hideSel() { overlay.hidden = true; }

overlay.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  const s = state.sel; if (!s) return;
  const r = overlay.getBoundingClientRect();
  const resize = e.clientX > r.right - 24 && e.clientY > r.bottom - 24;
  const sx = e.clientX, sy = e.clientY, s0 = { ...s };
  const dw = view.clientWidth, dh = view.clientHeight;
  function mv(ev) {
    const dx = ev.clientX - sx, dy = ev.clientY - sy;
    if (resize) {
      let nw = clamp(s0.w + dx, 40, dw - s0.x);
      let nh = s.aspect ? nw / s.aspect : clamp(s0.h + dy, 40, dh - s0.y);
      if (s.aspect && s0.y + nh > dh) { nh = dh - s0.y; nw = nh * s.aspect; }
      s.w = nw; s.h = nh;
    } else {
      s.x = clamp(s0.x + dx, 0, dw - s.w);
      s.y = clamp(s0.y + dy, 0, dh - s.h);
    }
    layoutSel();
  }
  function up() { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); }
  window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
});

function selToCanvas() {
  const s = state.sel, scale = view.width / view.clientWidth;
  return { x: s.x * scale, y: s.y * scale, w: s.w * scale, h: s.h * scale };
}

// ---------- crop ----------
function currentAspect() {
  const v = $("crop-aspect").value;
  return v === "free" ? null : Number(v);
}
function applyCrop() {
  if (!state.sel) return;
  const c = selToCanvas();
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(c.w)); out.height = Math.max(1, Math.round(c.h));
  out.getContext("2d").drawImage(view, c.x, c.y, c.w, c.h, 0, 0, out.width, out.height);
  const img = new Image();
  img.onload = () => { state.img = img; resetEdits(); hideSel(); state.selMode = null; renderView(); };
  img.src = out.toDataURL("image/png");
}

// ---------- passport ----------
function currentSpec() {
  const id = $("passport-country").value;
  return window.PASSPORT.find((p) => p.id === id) || window.PASSPORT[0];
}
function setupPassport() {
  const sel = $("passport-country");
  if (!sel.options.length) {
    window.PASSPORT.forEach((p) => { const o = document.createElement("option"); o.value = p.id; o.textContent = p.name; sel.appendChild(o); });
  }
  const spec = currentSpec();
  $("passport-spec").textContent = `Output: ${mm2px(spec.w)} × ${mm2px(spec.h)} px @ ${DPI} DPI`;
  $("passport-zoom").value = "1";
  showSel(spec.w / spec.h);
}
function passportZoom() {
  const z = Number($("passport-zoom").value);
  const spec = currentSpec(), aspect = spec.w / spec.h;
  const dw = view.clientWidth, dh = view.clientHeight;
  const base = Math.min(dw * 0.85, dh * 0.92 * aspect);
  let w = base / z, h = w / aspect;
  const s = state.sel || { x: 0, y: 0 };
  const cx = s.x + (s.w || w) / 2, cy = s.y + (s.h || h) / 2;
  state.sel = { x: clamp(cx - w / 2, 0, dw - w), y: clamp(cy - h / 2, 0, dh - h), w, h, aspect };
  layoutSel();
}
function passportCanvas() {
  const spec = currentSpec(), pw = mm2px(spec.w), ph = mm2px(spec.h);
  const c = selToCanvas();
  const out = document.createElement("canvas"); out.width = pw; out.height = ph;
  const ctx = out.getContext("2d");
  const bg = $("passport-bg").value;
  if (bg !== "keep") { ctx.fillStyle = bg; ctx.fillRect(0, 0, pw, ph); }
  ctx.drawImage(view, c.x, c.y, c.w, c.h, 0, 0, pw, ph);
  return out;
}
function downloadPassport() {
  passportCanvas().toBlob((b) => saveBlob(b, "passport.png"), "image/png");
}
function downloadSheet() {
  const photo = passportCanvas();
  const SW = mm2px(152.4), SH = mm2px(101.6); // 6x4 inch landscape
  const gap = 18, margin = 24;
  const sheet = document.createElement("canvas"); sheet.width = SW; sheet.height = SH;
  const ctx = sheet.getContext("2d"); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, SW, SH);
  const cols = Math.max(1, Math.floor((SW - margin * 2 + gap) / (photo.width + gap)));
  const rows = Math.max(1, Math.floor((SH - margin * 2 + gap) / (photo.height + gap)));
  for (let r = 0; r < rows; r++)
    for (let cc = 0; cc < cols; cc++)
      ctx.drawImage(photo, margin + cc * (photo.width + gap), margin + r * (photo.height + gap));
  sheet.toBlob((b) => saveBlob(b, "passport-sheet-4x6.png"), "image/png");
}

// ---------- export ----------
function exportImage() {
  const fmt = $("export-format").value;
  const q = Number($("export-quality").value);
  const maxW = Number($("export-width").value) || view.width;
  const scale = Math.min(1, maxW / view.width);
  const out = document.createElement("canvas");
  out.width = Math.round(view.width * scale); out.height = Math.round(view.height * scale);
  out.getContext("2d").drawImage(view, 0, 0, out.width, out.height);
  const ext = fmt === "image/jpeg" ? "jpg" : fmt === "image/webp" ? "webp" : "png";
  out.toBlob((b) => saveBlob(b, `pixforge.${ext}`), fmt, q);
}
function saveBlob(blob, name) {
  if (!blob) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---------- state helpers ----------
function resetEdits() {
  state.adjust = defaultAdjust(); state.rotation = 0; state.flipH = false; state.flipV = false;
  state.activeFilter = "Original"; syncSliders(); highlightFilter();
}
function revertAll() {
  if (!state.originalImg) return;
  state.img = state.originalImg; resetEdits(); hideSel(); renderView();
}

// ---------- load / tabs ----------
function loadImage(source) {
  const img = new Image();
  img.onload = () => {
    state.originalImg = img; state.img = img; resetEdits();
    $("hero").hidden = true; $("editor").hidden = false; $("nav-new").hidden = false;
    setActiveTab("adjust"); hideSel(); state.selMode = null; renderView();
    updateExportInfo();
  };
  img.onerror = () => alert("Couldn't load that image.");
  img.src = typeof source === "string" ? source : URL.createObjectURL(source);
}
function updateExportInfo() {
  $("export-info").textContent = `Original: ${state.originalImg.naturalWidth}×${state.originalImg.naturalHeight}px · current: ${view.width}×${view.height}px`;
}

function setActiveTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".panel[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== name));
  if (name === "transform") { state.selMode = "crop"; showSel(currentAspect()); }
  else if (name === "passport") { state.selMode = "passport"; setupPassport(); }
  else { state.selMode = null; hideSel(); }
  if (name === "export") updateExportInfo();
}

// ---------- wiring ----------
function initEditorControls() {
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setActiveTab(t.dataset.tab)));
  $("auto-enhance").addEventListener("click", autoEnhance);
  $("reset-adjust").addEventListener("click", () => { state.adjust = defaultAdjust(); state.activeFilter = "Original"; syncSliders(); highlightFilter(); renderView(); });
  document.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => transform(b.dataset.act)));
  $("crop-aspect").addEventListener("change", () => showSel(currentAspect()));
  $("crop-apply").addEventListener("click", applyCrop);
  $("crop-cancel").addEventListener("click", () => showSel(currentAspect()));
  $("passport-country").addEventListener("change", setupPassport);
  $("passport-zoom").addEventListener("input", passportZoom);
  $("passport-bg").addEventListener("change", () => {});
  $("passport-download").addEventListener("click", downloadPassport);
  $("passport-sheet").addEventListener("click", downloadSheet);
  $("export-download").addEventListener("click", exportImage);
  $("quick-download").addEventListener("click", exportImage);
  $("reset-all").addEventListener("click", revertAll);
  $("new-image").addEventListener("click", newImage);
  $("nav-new").addEventListener("click", (e) => { e.preventDefault(); newImage(); });
}
function newImage() {
  $("editor").hidden = true; $("hero").hidden = false; $("nav-new").hidden = true;
  state.img = null; state.originalImg = null; $("file-input").value = "";
}

// dropzone
const dz = $("dropzone"), fileInput = $("file-input");
function handleFile(f) { if (f && f.type.startsWith("image/")) loadImage(f); else alert("Please choose an image."); }
$("browse-btn").addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });
dz.addEventListener("click", () => fileInput.click());
dz.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));
["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("drag"); }));
["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("drag"); }));
dz.addEventListener("drop", (e) => { if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
window.addEventListener("paste", (e) => { const it = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/")); if (it) handleFile(it.getAsFile()); });
$("sample-btn").addEventListener("click", async (e) => {
  e.stopPropagation();
  const url = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80";
  try { loadImage(await (await fetch(url)).blob()); } catch (_) { loadImage(url); }
});

// socials
function renderSocials() {
  const ICONS = {
    github: '<path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.75.4-1.27.73-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.83 0c2.22-1.5 3.2-1.18 3.2-1.18.63 1.59.23 2.75.11 3.05.75.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"/>',
    linkedin: '<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.8 0 0 .77 0 1.73v20.54C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/>',
    instagram: '<path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38C1.35 2.67.94 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.8.72 1.47 1.38 2.13.66.66 1.33 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.12A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.41-10.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z"/>',
    youtube: '<path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z"/>',
    email: '<path d="M22 4H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.24-10 6.25L2 8.24V6l10 6.25L22 6v2.24Z"/>',
  };
  const box = $("socials");
  box.innerHTML = Object.entries(window.SOCIALS).filter(([, u]) => u).map(([k, u]) => {
    const href = k === "email" ? `mailto:${u}` : u;
    return `<a class="social" href="${href}" target="_blank" rel="noopener" aria-label="${k}" title="${k}"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">${ICONS[k] || ""}</svg></a>`;
  }).join("");
}

// init
buildSliders();
buildFilters();
initEditorControls();
renderSocials();
$("year").textContent = "2026";
