# BuildHq

AI DIY design-to-build platform for custom closets, built-ins, and cabinets.

## v0.4 highlights

- Interactive 3D workspace (React Three Fiber) with PBR materials
- Wood, composite, glass, acrylic, and metal library
- Templates: linen closet, pantry, glass display, media niche, wardrobe
- Drag shelves/uprights, auto joints (screws, glass clips, metal screws)
- Camera presets + exploded view
- Help Me Build: feasibility, MaxRects nesting, BOM + cost estimate, illustrated steps, PDF
- localStorage autosave · Export design JSON

## Stack

Next.js 15 · React Three Fiber · Zod · Tailwind · Vercel

## Local setup

```bash
npm install
npm run dev
```

Open http://localhost:3000/workspace

## Deploy

Connect this repo to Vercel (framework: Next.js, root: repository root).
Push to `main` to auto-deploy.
