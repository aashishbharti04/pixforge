<div align="center">

# ◆ PixForge

### Your free, private, in-browser image studio.

Enhance, apply pro filters, adjust, crop & transform, resize/export, and create
**country-specific passport photos** — all client-side. Nothing is ever uploaded.

<p>
  <img alt="Vanilla JS" src="https://img.shields.io/badge/Vanilla-JS-00E5FF?style=for-the-badge&logo=javascript&logoColor=white&labelColor=0D1117">
  <img alt="No deps" src="https://img.shields.io/badge/Dependencies-ZERO-FF2E97?style=for-the-badge&labelColor=0D1117">
  <img alt="Pages" src="https://img.shields.io/badge/GitHub-Pages%20ready-9D4EFF?style=for-the-badge&logo=github&logoColor=white&labelColor=0D1117">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-00FFA3?style=for-the-badge&labelColor=0D1117">
</p>

</div>

---

## ✨ Features

- **✨ Auto-enhance** — one-click auto levels (histogram-based contrast/brightness)
- **🎚️ Adjustments** — brightness, contrast, saturation, warmth, sepia, B&W, blur, vignette
- **🎨 Pro filters** — Vivid, Clarity, Warm, Cool, B&W, Noir, Sepia, Vintage, Fade, Punch, Dramatic
- **✂️ Transform** — rotate, flip, and aspect-ratio **crop**
- **🪪 Passport photos** — pick a country (US, India, UK, Schengen, Canada, China…); get the exact
  size at 300 DPI, position the face, choose a background, and export a single photo **or a printable
  4×6 sheet** of copies
- **📐 Resize & export** — set max width, choose **PNG / JPG / WEBP** and quality
- **🔒 Private** — everything runs in your browser; images never leave your device
- **⚡ Zero dependencies, no build, works offline**

## 🚀 Use it

1. **`Use this template`** / fork → **Settings → Pages → Source: GitHub Actions**.
2. Open your site, drop an image, and start editing.

Or open `index.html` locally — no server needed.

## 🧱 How it works

Pure `<canvas>` + the CSS filter pipeline. `assets/js/data.js` holds the adjustment,
filter and passport-spec tables; `assets/js/app.js` is the editor (render pipeline,
crop/passport selection box, export).

## 📄 License

[MIT](LICENSE) © Aashish Bharti

<div align="center">
<sub>⭐ Star it if PixForge saved you from a paid photo editor.</sub>
</div>
