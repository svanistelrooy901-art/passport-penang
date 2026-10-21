# Pasport Penang: working rules

- Game: 3D toon-miniature Penang, families first, BM | EN. Web only (static build).
- **Approved geography is read-only.** `data/geography/*` comes from explore-penang and is hash-locked by `tests/content.test.ts`. Never edit coastlines, bridges, ferry routes, destination coordinates or source receipts without explicit owner approval.
- Station content lives in `content/stations/<id>.json` (BM + EN). Facts must be sourced; every Kisah lists sources. New stations start with `"review": {"owner": "pending"}`.
- Delivery is phased (`docs/PHASES.md`). Each phase ends with a QA stop: preview link + checklist, owner sign-off before the next phase.
- Work on a branch per phase (`phase-N-name`) and open a PR into `main`; merge only after owner QA sign-off.
- Before handing over: `npm test`, `npm run build`, `npm run test:e2e` must pass.
