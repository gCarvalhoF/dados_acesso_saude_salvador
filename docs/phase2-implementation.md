# Phase 2 Implementation — Frontend Base (Mapa + Filtros)

This document describes everything built in Phase 2 of the health access dashboard project. It covers the frontend setup, component architecture, API integration, and decisions made during implementation.

---

## Table of Contents

1. [Overview](#overview)
2. [Stack and Infrastructure](#stack-and-infrastructure)
3. [Project Structure](#project-structure)
4. [Component Architecture](#component-architecture)
5. [API Integration](#api-integration)
6. [Map Implementation](#map-implementation)
7. [Filter System](#filter-system)
8. [CORS and Backend Changes](#cors-and-backend-changes)
9. [Key Decisions and Gotchas](#key-decisions-and-gotchas)
10. [Test Suite](#test-suite)
11. [Running Locally](#running-locally)

---

## Overview

Phase 2 delivers the interactive frontend dashboard. It covers:

- Standalone React + Vite frontend (TypeScript) in `frontend/`
- Interactive Leaflet map centered on Salvador with two data layers: neighborhood choropleth and establishment markers
- Popup detail view for each establishment (lazy-loaded from the API)
- Filter panel with five filter dimensions: type, legal nature, management, SUS-only, and neighborhood
- Two-way synchronization between the map's neighborhood selection and the filter panel
- Unit test suite: 62 Vitest tests (hooks + components) and 6 RSpec examples (seeds)
- Docker Compose service for the frontend container
- CORS enabled on the Rails API for local development

---

## Stack and Infrastructure

### Core Technology

| Layer | Technology | Notes |
|---|---|---|
| Language | TypeScript 5.7 | Strict mode enabled |
| Framework | React 18 | Functional components + hooks |
| Build tool | Vite 6 | Dev server with proxy to Rails API |
| Map | Leaflet 1.9 + react-leaflet 4 | GeoJSON layers, custom SVG icons |
| Styling | Tailwind CSS 3 | Utility-first, configured for `src/**/*.{ts,tsx}` |
| HTTP | Native `fetch` | No additional HTTP library needed |
| Containerization | Docker (Node 20 Alpine) | Added as `frontend` service in docker-compose.yml |

### Why a standalone frontend instead of react_on_rails

The PRD originally specified `react_on_rails` (gem). The Rails app is configured as API-only (`config.api_only = true`), which strips views, sessions, and the asset pipeline. Integrating `react_on_rails` would require:

1. Removing `api_only` mode and re-adding middleware manually
2. Installing `shakapacker` (a webpack wrapper) alongside the existing Rails setup
3. Managing two JS build systems (shakapacker for Rails + whatever the component ecosystem expects)

A standalone Vite app in `frontend/` is simpler, faster to develop with (HMR, native ES modules), and avoids all of the above. Vite's built-in dev proxy (`/api → http://localhost:3001`) handles the cross-origin request routing transparently during development. For production, the built output in `frontend/dist/` can be served by any static host or mounted behind the same nginx that proxies the Rails API.

### Docker Compose

A `frontend` service was added to `docker-compose.yml`:

```yaml
frontend:
  image: node:20-alpine
  working_dir: /app
  volumes:
    - ./frontend:/app
  ports:
    - "5173:5173"
  command: sh -c "npm install && npm run dev -- --host 0.0.0.0"
  depends_on:
    - web
  environment:
    - VITE_API_URL=http://web:3000
```

The `--host 0.0.0.0` flag is required so Vite's dev server binds to all interfaces inside the container, making it reachable from the host machine at `http://localhost:5173`.

`VITE_API_URL` is set to the internal Docker service name (`web:3000`) so Vite's proxy reaches the Rails API container-to-container, not via the host port mapping. Without this, the proxy target (`localhost:3001`) would resolve to the frontend container itself rather than the Rails service.

---

## Project Structure

```
frontend/
├── index.html                    # HTML entry point
├── package.json                  # npm dependencies
├── vite.config.ts                # Vite config + API proxy
├── tsconfig.json                 # TypeScript config (strict)
├── tailwind.config.js            # Tailwind content paths
├── postcss.config.js             # PostCSS (required by Tailwind)
└── src/
    ├── main.tsx                  # React root render
    ├── App.tsx                   # Root component (renders DashboardPage)
    ├── index.css                 # Tailwind directives + map container styles
    ├── types/
    │   └── index.ts              # TypeScript interfaces + filter constants
    ├── hooks/
    │   ├── useNeighborhoods.ts   # Fetches /api/v1/neighborhoods
    │   └── useEstablishments.ts  # Fetches /api/v1/health_establishments with filters
    └── components/
        ├── DashboardPage.tsx     # Top-level layout + shared state
        ├── Map/
        │   ├── InteractiveMap.tsx       # MapContainer wrapper
        │   ├── NeighborhoodLayer.tsx    # GeoJSON choropleth layer
        │   ├── EstablishmentMarkers.tsx # Custom SVG markers
        │   ├── EstablishmentPopup.tsx   # Popup content (lazy detail fetch)
        │   └── MapLegend.tsx            # Fixed-position legend overlay
        └── Filters/
            └── FilterPanel.tsx          # Sidebar with all filter controls
```

---

## Component Architecture

### DashboardPage

The top-level component. Owns all shared state:

- `filters: Filters` — current filter values, passed down to `useEstablishments` and `FilterPanel`
- `selectedNeighborhood: number | null` — ID of the neighborhood currently highlighted on the map
- `selectedNeighborhoodName: string` — name shown in the header badge

Handles two-way synchronization: clicking a neighborhood on the map updates the `neighborhood_id` filter in the panel, and changing the neighborhood filter in the panel updates the selected neighborhood on the map.

```
DashboardPage
├── header (title + selected neighborhood badge)
├── FilterPanel (sidebar)
└── InteractiveMap
    ├── NeighborhoodLayer
    ├── EstablishmentMarkers
    │   └── EstablishmentPopup (per marker)
    └── MapLegend
```

### InteractiveMap

Renders a Leaflet `MapContainer` centered on Salvador (`[-12.97, -38.51]`, zoom 12) with an OpenStreetMap tile layer. Composes the child layers based on data availability — layers are only rendered after their data has loaded.

### NeighborhoodLayer

Renders the GeoJSON `FeatureCollection` of neighborhood boundaries as a choropleth layer. Color is keyed on `establishments_count`:

| Count | Color |
|---|---|
| 0 | `#f0f0f0` (light gray) |
| 1–2 | `#c6e9f5` (light blue) |
| 3–7 | `#5ab4d6` (medium blue) |
| 8–14 | `#2378b5` (dark blue) |
| 15+ | `#08306b` (navy) |

Selected neighborhoods get increased opacity (`0.85` vs `0.55`) and an orange border (`#f97316`). Clicking a selected neighborhood deselects it (toggle behavior). Each polygon has a Leaflet tooltip showing name, establishment count, SUS bed count, and population.

The `key` prop on `<GeoJSON>` includes `selectedId` — this forces react-leaflet to re-render the layer when selection changes, since Leaflet's GeoJSON layer does not support dynamic style updates without a full remount.

### EstablishmentMarkers

Renders one `<Marker>` per establishment feature that has non-null geometry. Icons are `L.divIcon` instances built from inline SVG, differentiated by establishment type:

| Display type | Shape | Color |
|---|---|---|
| USF | Circle | Green `#16a34a` |
| Centro de Saúde / UBS | Circle | Blue `#2563eb` |
| Hospital Geral | Cross | Red `#dc2626` |
| Hospital Especializado | Cross | Orange `#ea580c` |
| Pronto Socorro Geral | Triangle | Dark red `#b91c1c` |
| Pronto Atendimento | Triangle | Yellow `#ca8a04` |
| Policlínica | Circle | Purple `#7c3aed` |
| Others | Circle | Gray `#6b7280` |

Icons are created once (module-level constants) and reused across all markers.

Each marker is rendered as a `HoverMarker` sub-component with its own `ref`. The `eventHandlers` prop opens the popup on `mouseover` and closes it on `mouseout`, so the detail card appears on hover without requiring a click. Clicking still works normally (Leaflet's default click-to-open behavior is preserved).

### EstablishmentPopup

Rendered inside each marker's `<Popup>`. It receives only the establishment `id` and lazily fetches the detailed record from `GET /api/v1/health_establishments/:id` when the popup is opened. This avoids loading full equipment/service/bed data for all establishments upfront.

Shows: fantasy name, canonical name, type badge, SUS badge, management type, address, phone, beds summary, top 5 equipment items, and top 4 specialized services (with overflow counts).

### FilterPanel

Left sidebar. Controls:

| Filter | UI element | API param |
|---|---|---|
| Establishment type | `<select>` | `?type=` |
| Legal nature | Radio buttons (Todas / Pública / Privada / Sem Fins Lucrativos / Pessoa Física) | `?legal_nature=` |
| Management type | `<select>` | `?management=` |
| SUS only | Checkbox | `?sus_only=true` |
| Neighborhood | `<select>` (sorted alphabetically) | `?neighborhood_id=` |

The neighborhood dropdown is populated from the `useNeighborhoods` hook — the same data that feeds the map layer. A "Limpar filtros" button resets all fields to their defaults.

---

## API Integration

### Hooks

Two custom hooks handle data fetching:

**`useNeighborhoods`**: Fetches `GET /api/v1/neighborhoods` once on mount. Returns `{ data, loading, error }`.

**`useEstablishments(filters)`**: Fetches `GET /api/v1/health_establishments` whenever `filters` changes. Builds a `URLSearchParams` object from non-empty filter values and appends it to the URL. Returns `{ data, loading, error }`.

**`useEstablishmentDetail(id)`**: Fetches `GET /api/v1/health_establishments/:id` when `id` is non-null. Used inside `EstablishmentPopup` — only fires when a popup is opened.

### Vite Proxy

The `vite.config.ts` proxy rewrites any request to `/api/*` to the URL in `VITE_API_URL` (defaulting to `http://localhost:3001` for development outside Docker):

```typescript
proxy: {
  "/api": {
    target: process.env.VITE_API_URL || "http://localhost:3001",
    changeOrigin: true,
  },
},
```

This means:
- Frontend code always calls `/api/v1/...` (relative URL, no hardcoded host)
- No CORS headers are involved during development (same-origin from the browser's perspective)
- Inside Docker, `VITE_API_URL=http://web:3000` routes the proxy to the `web` service directly
- In production, the same path rewriting can be configured at the nginx/reverse-proxy level

---

## Map Implementation

### Leaflet CSS

Leaflet requires its own CSS to render correctly. It is imported at the top of `InteractiveMap.tsx`:

```typescript
import "leaflet/dist/leaflet.css";
```

Placing the import here (rather than in `index.css`) makes the dependency explicit and co-located with the component that needs it.

### Map container height

Leaflet requires the map container to have an explicit height — it does not fill a flex parent automatically. The fix is in `index.css`:

```css
.map-container {
  height: 100%;
  width: 100%;
}
```

Combined with `h-full w-full` Tailwind classes on the `<MapContainer>` and a `flex-1` parent, this makes the map fill the remaining viewport height correctly.

### Z-index isolation

By default, Leaflet sets high `z-index` values on its internal elements, which can cause the map to render over fixed UI elements (like the filter panel or legend). Setting `.leaflet-container { z-index: 0 }` in `index.css` creates a new stacking context that isolates Leaflet's internal z-index hierarchy from the rest of the page.

---

## Filter System

Filters are plain state in `DashboardPage`:

```typescript
const DEFAULT_FILTERS: Filters = {
  type: "",
  legal_nature: "",
  management: "",
  sus_only: false,
  neighborhood_id: "",
};
```

Empty string means "no filter applied" for string fields. `useEstablishments` skips empty values when building the query string, so no parameter is sent for unset filters.

### Two-way neighborhood sync

Selecting a neighborhood on the map and selecting one from the dropdown are equivalent operations. Both call the same handler that updates both `selectedNeighborhood` (controls map rendering) and `filters.neighborhood_id` (controls API query). The reverse is also true — the filter panel's neighborhood `<select>` calls `onNeighborhoodSelect` which updates the map highlight.

---

## CORS and Backend Changes

### rack-cors

The `rack-cors` gem was uncommented in `Gemfile` and `config/initializers/cors.rb` was updated to allow requests from the Vite dev server origins:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"
    resource "*", headers: :any, methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

Port `5174` is included as Vite falls back to it when `5173` is already in use.

Note: CORS is only needed if the frontend is served from a different origin than the API. With the Vite proxy in place during development, browser requests go to `localhost:5173` and the proxy forwards them server-side — so CORS headers are technically not triggered. The configuration is still correct to have for environments where the proxy is not used (e.g., production with separate hosts).

### seeds.rb

`db/seeds.rb` calls the importer classes directly:

```ruby
DataImport::NeighborhoodImporter.call
DataImport::CensusImporter.call
DataImport::CnesImporter.call
```

The previous approach (`Rails.application.load_tasks` + `Rake::Task.invoke`) caused rake to be loaded inside an already-running rake context on `db:seed`, which re-registered task callbacks and triggered multiple import runs. Calling the service objects directly avoids this entirely.

All importers are idempotent: `NeighborhoodImporter` and `CnesImporter` use `find_or_initialize_by` / `find_or_create_by!` throughout. `HospitalBed` previously used `create!`, which would duplicate rows on re-seed — fixed to `find_or_create_by!` keyed on `(health_establishment, bed_code, bed_type_code)`.

### Rails host authorization

`config/environments/development.rb` includes:

```ruby
config.hosts << "web"
```

This allows the `web` Docker service hostname to pass Rails' `HostAuthorization` middleware, which would otherwise block requests proxied from the frontend container with `Host: web:3000`.

### Legal nature filter

The `legal_nature` filter parameter previously expected values like `federal`/`estadual`/`municipal`, which never matched the actual CNES numeric codes stored in the database (e.g. `1031`, `2046`). The filter was rewritten to accept category names mapped to code prefixes:

| Parameter value | Codes matched | Description |
|---|---|---|
| `publica` | `1xxx` | Órgãos públicos, autarquias, fundações públicas |
| `privada` | `2xxx` | Empresas privadas |
| `sem_fins_lucrativos` | `3xxx` | Associações e fundações privadas |
| `pessoa_fisica` | `4xxx` | Consultórios individuais |

The `by_legal_nature` scope on `HealthEstablishment` uses a `LIKE '1%'` pattern query to match by prefix.

---

## Key Decisions and Gotchas

### 1. react-leaflet requires Leaflet CSS to be imported manually

`react-leaflet` does not automatically include `leaflet/dist/leaflet.css`. Without it, the tile layer renders but the map controls (zoom buttons, attribution) are unstyled and marker icons may be broken. Import it explicitly in the component that renders `<MapContainer>`.

### 2. GeoJSON layer must be remounted to reflect style changes

react-leaflet's `<GeoJSON>` component does not support dynamic style updates after the initial render. Changing the `style` prop does nothing. The workaround is to change the `key` prop to force a full remount when the style-driving data changes. Here, `key={neighborhoods-${selectedId}}` causes a remount whenever the selected neighborhood changes, which re-applies the correct `fillOpacity` and border color.

### 3. Leaflet's default marker icon path breaks with Vite

Leaflet's default marker icons reference image files via a relative path that breaks when bundled by Vite (it cannot resolve `marker-icon.png` from within `node_modules/leaflet`). Using `L.divIcon` with inline SVG sidesteps this entirely — no image files, no path resolution issue, and the icons are fully customizable.

### 4. TypeScript `noUnusedLocals` and `noUnusedParameters`

Both are enabled in `tsconfig.json`. This catches dead code early but can interfere when a component prop is declared in an interface but only partially used in the component body. The `InteractiveMap` component receives `filters` and `onFilterChange` props (for future use in Phase 3) — if unused parameters cause compile errors, either use them or prefix with `_` to signal intentional non-use.

### 5. Neighborhood list in dropdown is not pre-sorted by the API

The `/api/v1/neighborhoods` endpoint returns neighborhoods ordered by name (`Neighborhood.ordered_by_name`). The dropdown sort in `FilterPanel` applies `.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))` anyway, as a defensive measure, since locale-aware sorting (`pt-BR`) handles accented characters (e.g., "Águas Claras" before "Barra") correctly regardless of the database collation.

### 6. `handleFilterChange` must set the neighborhood name badge

When selecting a neighborhood via the map click, `handleNeighborhoodSelect(id, name)` is called and the name badge in the header is updated directly. When selecting via the dropdown in `FilterPanel`, `handleFilterChange({ neighborhood_id: "1" })` is called — but it only has the numeric ID, not the name. The fix is to look up the name from the already-loaded `neighborhoods` data:

```typescript
const name = neighborhoods?.features.find(f => f.properties.id === id)?.properties.name ?? "";
setSelectedNeighborhoodName(name);
```

Without this, selecting from the dropdown would filter the API but not show the name badge in the header.

---

## Test Suite

**62 Vitest examples, 0 failures** | **6 RSpec examples (seeds), 0 failures**

### Frontend structure

```
frontend/src/
  test/
    setup.ts                          # @testing-library/jest-dom import
    fixtures.ts                       # mockNeighborhoods, mockEstablishments, mockEstablishmentDetail
    mocks/
      react-leaflet.tsx               # Stub components (MapContainer, Marker, GeoJSON, etc.)
      leaflet.ts                      # Stub L.divIcon
  hooks/
    useNeighborhoods.test.ts          # 5 examples: URL, loading, success, HTTP error, network error
    useEstablishments.test.ts         # 13 examples: query params, re-fetch on filter change, detail hook
  components/
    Map/
      MapLegend.test.tsx              # 4 examples: marker types, choropleth ranges
      EstablishmentPopup.test.tsx     # 12 examples: loading/error states, data rendering, overflow
    Filters/
      FilterPanel.test.tsx            # 19 examples: all controls render, onChange, reset, state, sort
    DashboardPage.test.tsx            # 9 examples: layout, loading, bidirectional neighborhood sync
```

### Key testing decisions

**Mock react-leaflet at module level** — Leaflet depends on browser APIs (`getBoundingClientRect`, canvas) unavailable in jsdom. All map components (`MapContainer`, `GeoJSON`, `Marker`) are replaced with plain `<div>` stubs via `vi.mock("react-leaflet", ...)`.

**Mock the hook, not fetch, in `EstablishmentPopup` tests** — The component's only job is to render data from `useEstablishmentDetail`. Mocking the hook (`vi.mock("../../hooks/useEstablishments", ...)`) is cleaner than mocking `fetch` at the global level, avoids timing issues with React's async rendering in jsdom, and keeps the test focused on what the component displays.

**`before(:all)` for rake task loading in seeds spec** — `Rails.application.load_tasks` registers callbacks on rake tasks. Calling it in `before(:each)` would double the callbacks each time, causing each importer to be invoked N times. It is called once in `before(:all)` and then `allow(Rails.application).to receive(:load_tasks)` in `before(:each)` prevents seeds.rb from registering callbacks again on each `load`.

### RSpec seeds structure

```
spec/db/seeds_spec.rb   # 6 examples: no error, each importer called once, order, idempotent
```

---

## Running Locally

### Prerequisites

- Docker and Docker Compose, or Node 20+ for running the frontend directly

### With Docker Compose

```bash
# Start all services (database + Rails API + frontend)
docker compose up

# API available at:  http://localhost:3001
# Dashboard at:      http://localhost:5173
```

### Without Docker (frontend only)

```bash
cd frontend
npm install
npm run dev
# Dashboard at http://localhost:5173
# Requires Rails API running on :3001
```

### First-time data import

```bash
# Import CNES + GeoJSON neighborhoods + census data
docker compose exec web bundle exec rails data:import:all
# or equivalently:
docker compose exec web bundle exec rails db:seed
```

### Verifying the map works

After data import, open `http://localhost:5173`. You should see:

1. A map centered on Salvador with colored neighborhood polygons
2. Markers for each health establishment
3. Clicking a neighborhood highlights it and filters the establishments list
4. Hovering over a marker opens a popup with establishment details (fetched on demand); clicking also works
5. The filter sidebar updates the visible markers in real time
