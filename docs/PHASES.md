# Delivery phases

Every phase ends with a **QA stop**: a preview link, this checklist, and owner sign-off before the next phase starts. Each phase is a branch `phase-N-name` merged to `main` by PR after sign-off.

Automated checks run on every phase: content + logic tests (incl. the geography hash lock), type-check + build, and a browser smoke test on phone and desktop sizes.

---

## Phase 0: Foundation ✅ signed off
Move the approved 3D prototype into this repo as a maintainable game with identical behaviour.

**Scope:** Vite + TypeScript + Three.js, modules (engine / game / UI), stations and Kisah as JSON content, zone assets, tests, CI, preview.

**QA checklist**
- [ ] Opens on your phone; loading finishes; character creator works (skin, hair, tudung)
- [ ] Tap to walk; drag to look; pinch/± zoom; ⟲ ⟳ rotate
- [ ] Walk to Komtar: prompt appears, station opens, all 3 games finish, stamp goes bronze → silver → gold, map colours in
- [ ] Gold opens the Kisah page; official + directions links open
- [ ] Pasport, wardrobe (Baju Melayu unlocks at 3 stamps), cats counter, BM ⇄ EN
- [ ] Feels smooth enough on your phone (note the model)

**Exit:** owner sign-off.

## Phase 1: Look, feel and phone performance ✅ signed off
- Toon outlines, warmer lighting, sky and soft clouds; better Khoo Kongsi and Chowrasta models
- Merge static geometry and tune shadows so mid-range phones hold a steady frame rate
- First-time tutorial (tap to walk, find a station, earn a stamp)
- Settings: sound, music, graphics quality, language; ambient sound and simple music
- Accessibility pass (focus order, screen-reader labels, reduced motion)

**QA checklist**
- [ ] Looks warmer and more "game": sky, soft clouds, dark outlines on buildings, trees, cats and the character
- [ ] New Khoo Kongsi (red pillars, swallowtail roof, lanterns) and Pasar Chowrasta (arcaded market, umbrellas, carts) read well up close
- [ ] Fresh start: the 4-step tutorial appears (walk → follow the arrow → play a game → first stamp); a child can follow it; *Langkau* skips it
- [ ] Settings (gear, top right): BM ⇄ EN, sound, music, graphics Auto/Low/Medium/High, reduce motion, replay tutorial
- [ ] Ambient sea + birds and the music loop play after the first tap; switching them off works; sound stops when the tab is hidden
- [ ] Real iPhone and Android: steady and smooth while walking and zooming (note phone model; try Low if it stutters)
- [ ] Keyboard only (desktop): Tab reaches every button, Esc closes sheets, focus returns to where you were

**Exit:** owner sign-off.

## Phase 2: George Town complete ← current
- +7 stations, each with 3 games + a sourced Kisah: Armenian Street, Kapitan Keling Mosque, Sri Mahamariamman Temple, Goddess of Mercy Temple, Pinang Peranakan Mansion, Cheong Fatt Tze (Blue) Mansion, Esplanade & City Hall
- Zone re-baked from the approved coastline by `tools/bake_zone.py` (no change to approved geography). The existing map already covers the whole heritage core, so it was not enlarged; instead the dense Pitt Street cluster is spread slightly (interpretive placement, directions links use real coordinates)
- 3D models for the new stations; their UI sprites are rendered from the models (`tools/render_sprites.mjs`)
- More cats (12) and NPCs with local tips (6); Heritage Hunter badge card in the Pasport
- AdSense placeholders on reading screens only: station sheet, Kisah page, Pasport (`src/ads.ts`)

**QA checklist**
- [ ] Review every new fact, quiz answer and BM/EN translation (each station's Kisah lists its sources); mark `review.owner` approved or send corrections
- [ ] Play all 12 stations to gold on a phone: games work, stamps, Kisah opens, directions link opens the right place
- [ ] New models read well up close; the Pitt Street cluster (Kapitan Keling, Sri Mahamariamman, Kuan Yin, Armenian Street, Khoo Kongsi) is easy to tell apart
- [ ] New station pictures (rendered from 3D) sit well next to the original five painted ones
- [ ] Place-of-worship stations carry the respect note; tone is right
- [ ] Ad placeholders appear only on the station sheet, Kisah and Pasport, never over the game
- [ ] Cats (12) and the new NPC tips; Heritage Hunter badge shows progress in the Pasport

## Phase 3: Overworld and travel
- Island + mainland travel map built from the approved geography
- Zone loading system; fast travel by bus, ferry, funicular and the two bridges
- Zone unlocks and one save across zones

**QA:** travel between George Town and a placeholder second zone and back; progress kept.

## Phase 4: Air Itam & Penang Hill
- Interpretive hill terrain, funicular ride, Kek Lok Si, Air Itam market (asam laksa), Botanic Gardens

## Phase 5: Gurney & the north coast
- Gurney Drive and waterfront, Tanjung Bungah, Batu Ferringhi, Tropical Spice Garden, Teluk Bahang (Entopia, ESCAPE), Penang National Park

## Phase 6: South, Balik Pulau and the mainland
- Balik Pulau (nutmeg, durian), Snake Temple, Queensbay/Bayan Lepas; Butterworth (ferry, Penang Sentral), Bukit Mertajam, Batu Kawan

**QA for 4–6:** same as Phase 2 for each zone (content review + full play-through).

## Phase 7: Launch
- Partner links live (affiliate agreements in place), privacy-friendly analytics
- Offline play / installable web app, final performance and accessibility audit
- Hosting + domain, content sign-off for every station, public launch

**Exit:** owner go-live approval.
