# Pasport Penang

A 3D explore-and-learn game of Penang for families. Walk a toon-miniature George Town, play three short games at each station, collect bronze → silver → gold stamps, watch the map turn from pencil sketch to colour, and unlock each place's full story with real-visit links. BM | EN.

## Run it

```sh
npm ci
npm run dev          # local dev server
npm test             # content + logic tests (incl. geography hash lock)
npm run build        # type-check + production build into dist/
npm run test:e2e     # browser smoke test of dist/ (Chromium)
```

## Layout

| Path | What |
|---|---|
| `src/engine/` | Three.js renderer, world, station models, character, pathfinding, reveal shader |
| `src/game/` | Save, shared state, movement |
| `src/ui/` | HUD, station hub, six game types, Kisah, Pasport, wardrobe, intro |
| `content/` | Zones and stations as JSON (BM + EN), outfits |
| `public/zones/<zone>/` | Baked ground/sea textures, walk grid, station artwork |
| `data/geography/` | Approved explore-penang geography (read-only, hash-locked) |
| `tools/` | Zone bakers (layout, ground texture, buildings, walk grid) |
| `docs/PHASES.md` | Delivery phases and QA checklists |

Street layout, buildings and station models are interpretive game art, not a navigation map. The coastline, bridges, ferry route and destination coordinates come from the approved geography.
