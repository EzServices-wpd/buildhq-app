BuildHq COMPLETE v0.6.5 — one clean full app

VERIFIED: npm run build succeeds locally (TypeScript + Next.js 15).

This package = Closet MVP + Forge Material Universe + all deploy fixes:
  - installMode / wallType on assumptions
  - optional metalness / color / catalog fields
  - optional forgeInstances
  - templates fixed
  - BOM / geometry safe defaults

CREATE A NEW GITHUB REPO (recommended — avoid messy history)
------------------------------------------------------------
1. Unzip this zip
2. On GitHub.com → New repository → name it e.g. buildhq-app
   - Public or private
   - DO NOT add README / .gitignore / license (empty repo)
3. Upload ALL files from the unzipped folder to the ROOT of that repo
   You must see at the top level:
     package.json
     next.config.ts
     tsconfig.json
     src/
     ...
   NOT nested inside another folder named BuildHQ-COMPLETE-v0.6.5

4. Vercel → Add New Project → Import that NEW GitHub repo
   - Framework: Next.js
   - Root Directory: leave BLANK
   - Build Command: npm run build (default)
   - Install Command: npm install (default)
5. Deploy → wait for READY

SMOKE TEST
----------
/workspace → sidebar shows Closet | Forge | Prompt
Search "paper towel" → Prompt → generate a tower
Closet mode still works

DO NOT upload this into the old messy BuildHQ / BuildHQ1 trees.
