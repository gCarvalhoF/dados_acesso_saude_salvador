# Phase 3 Implementation — Dashboard Completo

This document describes everything built in Phase 3 of the health access dashboard project. It covers metric cards, distribution charts, advanced filters, selectable choropleth metrics, and the associated backend changes.

---

## Table of Contents

1. [Overview](#overview)
2. [Backend Changes](#backend-changes)
3. [Frontend Types and Hooks](#frontend-types-and-hooks)
4. [New Components](#new-components)
5. [Modified Components](#modified-components)
6. [Test Suite](#test-suite)
7. [Key Decisions and Gotchas](#key-decisions-and-gotchas)

---

## Overview

Phase 3 transforms the dashboard from a map-only view into a full analytics dashboard. It adds:

- **6 metric summary cards** showing key aggregate numbers (establishments, equipment, beds — total and SUS)
- **4 distribution charts** (recharts): establishment type pie chart, equipment by neighborhood bar chart, equipment per 10k inhabitants bar chart, top specialized services bar chart
- **Advanced filters**: equipment type and specialized service dropdowns in the filter panel
- **Selectable choropleth metric**: the neighborhood layer can now be colored by 5 different metrics (establishments, equipment, SUS beds, population, demographic density) with dynamic quantile-based binning
- **Restructured layout**: the main content area is now a scrollable column with cards at top, map in the middle, and charts below

Backend changes were minimal — two controller modifications to support the new frontend features. All existing dashboard API endpoints (`overview`, `equipment_by_neighborhood`, `service_summary`) were already sufficient for the charts.

**Test counts**: 91 frontend examples (9 test files), 109 backend examples (0 failures).

---

## Backend Changes

### 1. Filter options expanded with equipment and service lists

**File**: `app/controllers/api/v1/filter_options_controller.rb`

Two new private methods added to the existing controller:

- `equipment_item_options`: queries `EquipmentItem.ordered_by_name.pluck(:code, :name)`, maps to `{ value, label }` pairs, prepends a catch-all `{ value: "", label: "Todos os equipamentos" }`
- `specialized_service_options`: same pattern for `SpecializedService`

The response shape expanded from 3 to 5 keys:

```json
{
  "establishment_types": [...],
  "legal_natures": [...],
  "management_types": [...],
  "equipment_items": [...],
  "specialized_services": [...]
}
```

This reuses the existing endpoint and follows the same `{ value, label }` contract that the frontend's `FilterSelect` component expects. No new routes were needed.

### 2. Equipment count in neighborhoods index

**File**: `app/controllers/api/v1/neighborhoods_controller.rb`

Previously, `equipment_count` was only returned in the `show` (detail) endpoint. Phase 3's selectable choropleth needs it in the `index` response for all neighborhoods.

The `Neighborhood#equipment_count` model method performs a join + sum per record, causing N+1 queries when called in a loop. The fix precomputes all counts in a single aggregate query:

```ruby
equip_counts = EstablishmentEquipment
  .joins(health_establishment: :neighborhood)
  .group("health_establishments.neighborhood_id")
  .sum(:quantity_existing)
```

The precomputed hash is passed through `neighborhood_feature` and `neighborhood_properties` as an optional `equipment_count:` parameter. For the `show` endpoint, the model method is still used as a fallback since it's a single record.

---

## Frontend Types and Hooks

### New types (`frontend/src/types/index.ts`)

| Type | Purpose |
|---|---|
| `DashboardOverview` | Shape of `GET /api/v1/dashboard/overview` response |
| `EquipmentByNeighborhood` | Shape of each row in `equipment_by_neighborhood` data array |
| `ServiceSummaryItem` | Shape of each row in `service_summary` data array |
| `ChoroplethMetric` | Union type of 5 selectable metrics: `establishments_count`, `equipment_count`, `sus_beds_count`, `population_total`, `demographic_density` |

### Modified types

- `Filters`: added `equipment: string` and `service: string` fields
- `FilterOptions`: added `equipment_items: FilterOption[]` and `specialized_services: FilterOption[]`
- `NeighborhoodProperties`: `equipment_count` changed from optional (`?`) to required (backend now always includes it)

### New hook: `useDashboard`

**File**: `frontend/src/hooks/useDashboard.ts`

Fetches all three dashboard endpoints in parallel using `Promise.all`:

```typescript
Promise.all([
  fetch("/api/v1/dashboard/overview"),
  fetch("/api/v1/dashboard/equipment_by_neighborhood"),
  fetch("/api/v1/dashboard/service_summary"),
])
```

Returns `{ overview, equipmentByNeighborhood, serviceSummary, loading, error }`. Called once on mount (no dependencies).

### Modified hooks

**`useFilterOptions`**: added `equipment_items: []` and `specialized_services: []` to the `DEFAULT_FILTER_OPTIONS` fallback object.

**`useEstablishments`**: added `equipment` and `service` to the `URLSearchParams` construction and the `useEffect` dependency array.

---

## New Components

### MetricCards

**File**: `frontend/src/components/Dashboard/MetricCards.tsx`

A responsive grid of 6 cards (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6`). Each card shows a label and a large formatted number (pt-BR locale).

Cards displayed:
1. Estabelecimentos (total)
2. Estab. SUS
3. Equipamentos (total)
4. Equip. SUS
5. Leitos Totais
6. Leitos SUS

Shows animated skeleton placeholders while loading.

### ChartsPanel

**File**: `frontend/src/components/Dashboard/ChartsPanel.tsx`

Container component rendering 4 charts in a `grid-cols-1 lg:grid-cols-2` layout. Each chart is wrapped in a `ChartCard` with a title header. Shows animated skeleton placeholders while loading.

### Chart components (4 files in `Dashboard/Charts/`)

All charts use recharts with `ResponsiveContainer` for fluid sizing.

| Component | Chart type | Data source | Notes |
|---|---|---|---|
| `EstablishmentTypeChart` | Pie chart | `overview.establishments.by_type` | 10-color palette, labels truncated at 20 chars |
| `EquipmentByNeighborhoodChart` | Horizontal bar | `equipmentByNeighborhood` | Top 15 neighborhoods, sorted by volume |
| `EquipmentPer10kChart` | Horizontal bar | Computed on frontend | `(total_equipments / population_total) * 10000`, top 15, excludes neighborhoods with 0 population |
| `ServiceSummaryChart` | Horizontal bar | `serviceSummary` | Top 15 services by establishment count |

The "equipment per 10k inhabitants" metric is computed on the frontend by joining the `equipmentByNeighborhood` data with the neighborhood population data (already available from `useNeighborhoods`). This avoids a new backend endpoint.

---

## Modified Components

### FilterPanel

**File**: `frontend/src/components/Filters/FilterPanel.tsx`

Two new `FilterSelect` components added between "Tipo de Gestão" and "Apenas SUS":

1. **Equipamento** — populates from `filterOptions.equipment_items`
2. **Serviço Especializado** — populates from `filterOptions.specialized_services`

The "Limpar filtros" button now also resets `equipment: ""` and `service: ""`.

### NeighborhoodLayer

**File**: `frontend/src/components/Map/NeighborhoodLayer.tsx`

Major changes:

1. **New `metric` prop** (`ChoroplethMetric`) — determines which property to color by
2. **Dynamic quantile binning** — replaces the hardcoded `getColor` function. The `computeBins` function calculates 4 breakpoints at the 20th, 40th, 60th, and 80th percentiles of the actual data values. This adapts automatically to any metric's range.
3. **Deduplication logic** — ensures bin breakpoints are strictly increasing even when many neighborhoods share the same value
4. **Dynamic tooltip** — shows the selected metric's label and formatted value instead of hardcoded "Estabelecimentos"
5. **GeoJSON key** — now includes `metric` in addition to `selectedId`, forcing a remount when the metric changes

Exports `METRIC_LABELS` (Portuguese labels for each metric) and `formatBinLabels` (generates legend labels from bin breakpoints) for use by `MapLegend`.

### MapLegend

**File**: `frontend/src/components/Map/MapLegend.tsx`

Now accepts `metric` and `neighborhoods` props. Computes bins using the same logic as `NeighborhoodLayer` (duplicated to avoid prop drilling — bins are cheap to compute). The choropleth section title dynamically shows `"{MetricLabel} por bairro"` instead of the hardcoded "Estab. por bairro".

### InteractiveMap

**File**: `frontend/src/components/Map/InteractiveMap.tsx`

New `choroplethMetric` prop passed through to `NeighborhoodLayer` (as `metric`) and `MapLegend` (as `metric` + `neighborhoods`).

### DashboardPage

**File**: `frontend/src/components/DashboardPage.tsx`

Major layout restructure:

**New state:**
- `choroplethMetric: ChoroplethMetric` (default: `"establishments_count"`)
- `DEFAULT_FILTERS` expanded with `equipment: ""` and `service: ""`

**New hooks:**
- `useDashboard()` — provides data for MetricCards and ChartsPanel

**Layout change:**

```
┌──────────────────────────────────────┐
│ Header                               │
├─────────┬────────────────────────────┤
│ Filters │ MetricCards (horizontal)   │
│ (fixed) ├────────────────────────────┤
│         │ Metric selector + Map      │
│         ├────────────────────────────┤
│         │ ChartsPanel (2x2 grid)     │
└─────────┴────────────────────────────┘
```

The main area (`<main>`) is now `overflow-y-auto` with a `space-y-4` vertical stack:
1. `MetricCards` — summary numbers
2. Map wrapper with choropleth metric `<select>` above it (`h-[500px]` fixed height)
3. `ChartsPanel` — four distribution charts

The metric selector is a small `<select>` labeled "Métrica do mapa:" placed in a bar above the map. The label was chosen to avoid collision with the "Bairro" filter label in test queries (originally "Colorir bairros por:" conflicted with `/bairro/i` regex).

---

## Test Suite

### Backend (RSpec) — 109 examples, 0 failures

**Updated files:**

`spec/requests/api/v1/filter_options_spec.rb` — 8 new tests:
- `equipment_items`: catch-all option present, DB data returned, alphabetical sort, value/label shape
- `specialized_services`: catch-all option present, DB data returned, alphabetical sort, value/label shape
- Updated top-level keys assertion to include the 2 new keys

`spec/requests/api/v1/neighborhoods_spec.rb` — 3 new tests:
- `equipment_count` key present in index properties
- Correct count when equipment exists (via factory setup: neighborhood → establishment → equipment)
- Returns 0 for neighborhoods without equipment

### Frontend (Vitest) — 91 examples, 0 failures (9 test files)

**New test files:**

`src/hooks/useDashboard.test.ts` — 4 tests:
- Starts in loading state with null/empty data
- Fetches all 3 dashboard endpoints
- Returns data after success
- Exposes error when an endpoint fails

`src/components/Dashboard/MetricCards.test.tsx` — 10 tests:
- Loading state: shows 6 animated skeletons
- Null overview: shows skeletons
- With data: renders all 6 card labels and formatted values (pt-BR locale)
- No skeletons when data is loaded

`src/components/Dashboard/ChartsPanel.test.tsx` — 8 tests:
- Loading state: shows 4 animated placeholders, no chart titles
- With data: renders all 4 chart titles
- No placeholders when data is loaded
- Mounts without errors with empty data arrays

**Updated test files:**

`src/hooks/useEstablishments.test.ts`:
- `defaultFilters` extended with `equipment: ""` and `service: ""`
- Multi-param test updated to include `equipment` and `service` assertions

`src/components/Filters/FilterPanel.test.tsx`:
- `defaultFilters` and `defaultFilterOptions` extended with new fields
- 2 new rendering tests: equipment select and service select present
- 2 new interaction tests: onChange called with correct field on selection
- "Limpar filtros" assertion updated to include `equipment: ""` and `service: ""`

`src/components/Map/MapLegend.test.tsx`:
- Updated to pass required `metric` and `neighborhoods` props
- Tests dynamic metric label ("Estabelecimentos por bairro" / "Equipamentos por bairro")

`src/components/DashboardPage.test.tsx`:
- Mock sequence expanded with 3 dashboard API responses
- recharts `ResponsiveContainer` mocked with fixed-dimension div
- New test: choropleth metric selector renders
- New test: metric cards render numbers after loading
- Tests adapted for new layout

`src/test/fixtures.ts`:
- Added `mockDashboardOverview`, `mockEquipmentByNeighborhood`, `mockServiceSummary`
- `mockNeighborhoods` features extended with `equipment_count`
- `mockFilterOptions` extended with `equipment_items` and `specialized_services`

### Testing patterns

**recharts in jsdom**: recharts' `ResponsiveContainer` requires actual DOM dimensions (via `ResizeObserver`), which jsdom does not provide. The solution is to mock `ResponsiveContainer` at the module level with a fixed-size `<div>`:

```typescript
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  };
});
```

This preserves all other recharts exports (PieChart, BarChart, etc.) while only stubbing the problematic container.

**Chart content testing**: Since recharts renders SVG and jsdom has limited SVG support, chart tests focus on titles/labels and mount-without-error assertions rather than verifying individual bars or slices.

---

## Key Decisions and Gotchas

### 1. Quantile-based binning for the choropleth

The Phase 2 choropleth used hardcoded bins (0, 1-2, 3-7, 8-14, 15+) tailored to establishment counts. These bins are meaningless for other metrics — population values range in the thousands, density in the hundreds, etc.

The fix computes 4 breakpoints at the 20th, 40th, 60th, and 80th percentiles of the actual non-zero values in the current dataset. This produces 5 bins that adapt to any metric automatically. Zero values always get the lightest color.

A deduplication step ensures strictly increasing breakpoints. When many neighborhoods share the same value (common for sparse metrics like equipment count), the raw percentiles can repeat. The algorithm increments duplicate breakpoints by 1 (or 0.1 for decimal metrics like density).

### 2. Equipment per 10k inhabitants computed on the frontend

The PRD lists "Equipment per 10,000 inhabitants by neighborhood" as a chart. Rather than adding a new backend endpoint, this is computed on the frontend by joining:
- `equipmentByNeighborhood` (from `GET /api/v1/dashboard/equipment_by_neighborhood`) — provides total_equipments per neighborhood name
- `neighborhoods` (from `GET /api/v1/neighborhoods`) — provides population_total per neighborhood name

The join is done by neighborhood name (string match). Neighborhoods with zero or null population are excluded to avoid division by zero. The top 15 results are displayed.

### 3. N+1 fix for equipment_count in neighborhoods index

The `Neighborhood#equipment_count` model method does `health_establishments.joins(:establishment_equipments).sum(...)` — one query per neighborhood. With 170 neighborhoods, this generates 170 queries.

The controller-level fix precomputes all counts in a single query:

```ruby
equip_counts = EstablishmentEquipment
  .joins(health_establishment: :neighborhood)
  .group("health_establishments.neighborhood_id")
  .sum(:quantity_existing)
```

The result is a `{ neighborhood_id => count }` hash used directly when building the response. The model method is preserved for the `show` endpoint where N+1 is not an issue.

### 4. Metric selector label avoids test collision

The initial label "Colorir bairros por:" matched the regex `/bairro/i` used by existing tests to find the neighborhood filter dropdown, causing `getByLabelText` to fail with "multiple elements found". The label was changed to "Métrica do mapa:" which is semantically clear and test-safe.

### 5. Bin computation duplicated in MapLegend

`NeighborhoodLayer` and `MapLegend` both need the bin breakpoints. Rather than prop-drilling bins through `InteractiveMap`, both components independently compute bins from the same data. The computation is O(n log n) with n = ~170 neighborhoods — negligible cost. Both use `useMemo` to avoid recomputation on every render.

### 6. recharts Tooltip formatter type

recharts' `Tooltip` `formatter` prop expects `(value: ValueType | undefined, ...)` but chart components often assume `number`. Using `(value) => Number(value).toLocaleString(...)` with implicit typing satisfies both the type checker and the runtime behavior.
