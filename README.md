# Slideforge

**AI-powered presentation generator** — describe a talk, get a designed deck you can edit, restyle, annotate, present, and export.

Built with **Next.js**, the **Vercel AI SDK**, **Google Gemini**, and **Cloudflare Workers AI** for images.

---

## Features

### Generate
- Natural-language topic → structured multi-slide deck (Gemini 2.5 Flash)
- Landing page with **topic presets** (pitch, lecture, product launch, business review)
- Background **image generation** for `image_and_text` slides (Cloudflare Flux)

### Edit
- **In-place text editing** on titles, subtitles, and bullets (WYSIWYG)
- **Slide templates**: Modern, Classic, Simple, Designer, Minimalist
- **Slide theme**: light / dark surfaces (app chrome stays dark)
- **Accent color** with presets + custom picker
- **Font picker** (user choice overrides template defaults)
- **Image regenerate**: pen icon → edit prompt → regenerate
- Local draft persistence (`localStorage`)

### Annotate
- Shapes: rectangle, rounded rect, oval, triangle, star, heart, line, arrow
- Emoji stickers
- Move, resize, rotate, recolor (stroke / fill / no-fill)
- Delete with keyboard or toolbar
- Annotations show in preview, presentation mode, and exports

### Present & export
- Fullscreen **presentation mode** (keyboard nav, transitions, size modes)
- Export **PowerPoint (`.pptx`)** or **PDF**
- High / medium quality capture

### App flow
| Route | Purpose |
|-------|---------|
| `/` | Landing — compose topic, deck style, generate |
| `/edit` | Editor — sidebar settings + filmstrip preview |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix UI, Lucide |
| AI text | [Vercel AI SDK](https://ai-sdk.dev) v7 + `@ai-sdk/google` (Gemini) |
| AI images | Cloudflare Workers AI (`@cf/black-forest-labs/flux-2-klein-4b`) |
| Validation | Zod 4 |
| Export | `html-to-image`, `pptxgenjs`, `jspdf` |
| Motion | Framer Motion |
| Language | TypeScript |

### Main layout

```
app/
  page.tsx              # Landing
  edit/page.tsx         # Editor
  api/generate/         # Structured slide generation
  api/generate-image/   # Image generation proxy
components/
  slide-canvas.tsx      # Shared 960×540 slide renderer
  slide-preview.tsx     # Filmstrip + stage + annotate toolbar
  presentation-mode.tsx # Fullscreen present
  annotations/          # Shapes / emojis layer
  template-picker.tsx
lib/
  schema/ppt-schema.ts  # Presentation + annotation schemas
  slide-templates.ts    # Template tokens
  presentation-store.ts # localStorage prefs + deck
  generate-*.ts         # Client/server AI helpers
```

Slides are fixed **960×540** design space, scaled for preview/present; export captures full-size offscreen nodes so annotations and templates stay faithful.

---

## Requirements

- **Node.js 22+** (AI SDK 7 targets Node 22+)
- npm (or pnpm / yarn / bun)
- API keys (see below)

---

## Install

```bash
# Clone and enter the project
cd ai-slides-generator

# Install dependencies
npm install

# Environment
cp .env.example .env
# Edit .env with your keys (see next section)

# Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

---

## Environment variables

Copy `.env.example` → `.env`:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
CLOUDFLARE_API_TOKEN=""
CLOUDFLARE_ACCOUNT_ID=""
```

| Variable | Required for | Where to get it |
|----------|--------------|-----------------|
| `GEMINI_API_KEY` | Slide text generation | [Google AI Studio](https://aistudio.google.com/apikey) |
| `CLOUDFLARE_ACCOUNT_ID` | Slide images | Cloudflare dashboard → Workers AI |
| `CLOUDFLARE_API_TOKEN` | Slide images | API token with Workers AI permissions |

Text generation works with only Gemini. Without Cloudflare credentials, image slots stay empty / fail gracefully; you can still edit text, templates, and export.

---

## Usage

1. **Home** — describe your presentation (or pick a preset). Set **template**, **slide theme**, and **accent**.
2. **Generate** — deck is saved locally and you land on **`/edit`**.
3. **Edit** — click text to edit; use the filmstrip and arrow keys to navigate slides.
4. **Style** — change template, light/dark, accent, and font in the sidebar (slides only).
5. **Annotate** — toolbar above the stage: add shapes/emojis, select, drag, resize, rotate, recolor.
6. **Images** — hover an image → pen → edit prompt → regenerate.
7. **Present** — fullscreen deck with keyboard controls (`←` `→` Space, Esc).
8. **Export** — PPTX or PDF at high or medium quality.

Drafts and preferences (color, theme, template, font) persist in the browser via `localStorage`.

---

## Templates

| ID | Character |
|----|-----------|
| **Modern** | Side + top accent bars, numbered bullets, geometric accents |
| **Classic** | Double frame, editorial hierarchy, dash markers |
| **Simple** | Soft card, generous space, accent underlines |
| **Designer** | Magazine title block, bold uppercase, accent architecture |
| **Minimalist** | Hairline corners, light tracking, no bullet chrome |

User-selected fonts override template defaults. Light/dark slide theme and accent apply across all templates.

---

## API routes

### `POST /api/generate`

```json
{ "prompt": "Pitch deck for a coffee shop..." }
```

Returns structured presentation JSON (title, subtitle, slides with layouts and optional `imagePrompt`).

### `POST /api/generate-image`

```json
{ "prompt": "...", "width": 448, "height": 320 }
```

Returns `{ "imageUrl": "data:image/png;base64,..." }` (defaults match the image panel size).

---

## Deploy

Works on any Node 22+ host that supports Next.js:

```bash
npm run build
npm run start
```

Or deploy to [Vercel](https://vercel.com) and set the same env vars in the project settings.

**Note:** Cloudflare image generation is server-side; keep tokens server-only (never `NEXT_PUBLIC_`).

---

## License

Private project (`private: true` in `package.json`). Adjust as needed for your use.
