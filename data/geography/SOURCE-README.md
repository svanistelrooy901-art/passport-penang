# Geographic data

`geography.geojson` and coordinate/source fields in `places.json` are derived from OpenStreetMap and distributed under **ODbL 1.0**. © OpenStreetMap contributors. See <https://www.openstreetmap.org/copyright> and <https://opendatacommons.org/licenses/odbl/1-0/>.

The GeoJSON is the immutable review snapshot. `source-receipts.json` records extraction URLs, dates, display bounding box, projection and raw-response SHA-256 hashes. Object versions are in each feature. A relation version does not version every child vertex: use the snapshot and response hashes to identify this draft.

Pins are OSM representative coordinates, not certified entrances. Chew Jetty represents the Clan Jetties; Chowrasta Market is one food-trail anchor. Penang Hill uses peak node 1387210299, not the lower funicular station. Place content and visitor URLs were checked separately; no fees or hours are represented as verified.

## Rebuild

`npm run build:review` reads committed data without external requests and generates the single-file review plus both SVGs.

## Deliberately refresh

1. `python3 scripts/fetch_sources.py` retrieves missing caches under ignored `data/source/`. It uses finite named Nominatim lookups at no more than one request per second, plus bounded OSM API requests. It never runs in the site or CI.
2. Existing caches are reused. Remove an exact cache file deliberately to refresh it. Do not schedule automatic Nominatim harvesting.
3. `python3 scripts/build_geography.py` joins exact OSM member-node rings and selects reviewed object IDs. Missing objects or gaps fail the build; no guessed coordinates are substituted.
4. Rebuild, inspect changed data, rerun tests and obtain fresh geographic approval. Later source retrieval may return newer geometry and is not expected to reproduce the historical snapshot byte-for-byte.

Official Malaysian sources are cross-checks and linked visitor information; their map geometry and Google map geometry were not traced. The artistic reference is not geographic data. The eastern state boundary and regional crop must not be interpreted as coastline.
