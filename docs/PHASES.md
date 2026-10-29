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

## Phase 2: George Town complete ✅ signed off
- +7 stations, each with 3 games + a sourced Kisah: Armenian Street, Kapitan Keling Mosque, Sri Mahamariamman Temple, Goddess of Mercy Temple, Pinang Peranakan Mansion, Cheong Fatt Tze (Blue) Mansion, Esplanade & City Hall
- Zone re-baked from the approved coastline by `tools/bake_zone.py` (no change to approved geography). The existing map already covers the whole heritage core, so it was not enlarged; instead the dense Pitt Street cluster is spread slightly (interpretive placement, directions links use real coordinates)
- 3D models for the new stations; painted station pictures generated in the same style as the original five (`tools/import_sprites.py`)
- More cats (12) and NPCs with local tips (6); Heritage Hunter badge card in the Pasport
- AdSense placeholders on reading screens only: station sheet, Kisah page, Pasport (`src/ads.ts`)

**QA checklist**
- [ ] Review every new fact, quiz answer and BM/EN translation (each station's Kisah lists its sources); mark `review.owner` approved or send corrections
- [ ] Play all 12 stations to gold on a phone: games work, stamps, Kisah opens, directions link opens the right place
- [ ] New models read well up close; the Pitt Street cluster (Kapitan Keling, Sri Mahamariamman, Kuan Yin, Armenian Street, Khoo Kongsi) is easy to tell apart
- [ ] New painted station pictures sit well next to the original five
- [ ] Place-of-worship stations carry the respect note; tone is right
- [ ] Ad placeholders appear only on the station sheet, Kisah and Pasport, never over the game
- [ ] Cats (12) and the new NPC tips; Heritage Hunter badge shows progress in the Pasport

## Phase 3: Overworld and travel ← current
- Overworld: 3D model of the whole state (island + mainland) from the approved coastline, bridges and ferry route; zone hotspots with progress, locked zones in pencil
- Zones: George Town · Air Itam · **Penang Hill (its own zone, entered by the funicular from Air Itam)** · Gurney & north coast · Balik Pulau & south · Mainland
- Zone loading (one zone in memory at a time), generic zone baker, travel scenes for bus, ferry, funicular and bridge
- Unlock: the next zones open after 6 stamps in George Town; one save across zones (cats per zone)
- Map mode for visitors: tap any station on the overworld for info, directions and partner link
- Placeholders for QA: Air Itam (bus), Penang Hill (funicular from Air Itam), Butterworth (ferry)

**QA checklist**
- [ ] Tap the zone name (top left) to open the Penang map; it reads well on a phone; pan, zoom, tap a zone
- [ ] Map mode: tap George Town → list of places → any place shows info, directions and partner link; "Main di sini" takes you there
- [ ] With fewer than 6 George Town stamps, other zones show as locked; with 6 they open
- [ ] Bus from Komtar to Air Itam and back; funicular from Air Itam up to Penang Hill and back; ferry to Seberang Perai and back
- [ ] After every trip: stamps, cats, outfit and language are kept; you arrive beside the stop you came from
- [ ] Placeholder zones say clearly that their places are coming soon
- [ ] Still smooth on a mid-range phone (map and zones)

## Phase 4: Air Itam
- Kek Lok Si, Air Itam market (asam laksa), Botanic Gardens, funicular lower station

## Phase 5: Penang Hill
- Its own zone at the top of the funicular: hill-top landmarks, forest trails and viewpoints (station list confirmed with the owner at the start of the phase)

## Phase 6: Gurney & the north coast
- Gurney Drive and waterfront, Tanjung Bungah, Batu Ferringhi, Tropical Spice Garden, Teluk Bahang (Entopia, ESCAPE), Penang National Park

## Phase 7: South, Balik Pulau and the mainland
- Balik Pulau (nutmeg, durian), Snake Temple, Queensbay/Bayan Lepas; Butterworth (ferry, Penang Sentral), Bukit Mertajam, Batu Kawan

**QA for 4–7:** same as Phase 2 for each zone (content review + full play-through).

## Phase 8: Launch
- Partner links live (affiliate agreements in place), privacy-friendly analytics
- Offline play / installable web app, final performance and accessibility audit
- Hosting + domain, content sign-off for every station, public launch

**Exit:** owner go-live approval.
