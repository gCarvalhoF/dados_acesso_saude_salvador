# Phase 7 Implementation — Map-Centric UI Refactor

This document describes everything built in Phase 7. The goal was to put the interactive map at the centre of the experience: it now fills the entire content area while all other UI elements float above it as togglable panels. No backend changes were made.

---

## Table of Contents

1. [Overview](#overview)
2. [Layout Architecture](#layout-architecture)
3. [Modified Components](#modified-components)
4. [Stacking Context Fix — MapLegend](#stacking-context-fix--mapleged)
5. [Chart Visibility System](#chart-visibility-system)
6. [Map Default Position](#map-default-position)
7. [Key Decisions and Gotchas](#key-decisions-and-gotchas)

---

## Overview

Phase 7 replaces the previous split layout (left sidebar + scrollable main area with map in the middle) with a full-viewport map as the application background. Every other component — metric cards, choropleth selector, comparison results, charts — floats above the map as an absolutely-positioned glass panel or animated overlay.

**Files changed** (frontend only):

| File | Nature of change |
|---|---|
| `components/DashboardPage.tsx` | Full layout refactor, new chart-visibility state |
| `components/Filters/FilterPanel.tsx` | `fixed` → `absolute`, charts dropdown section added |
| `components/Dashboard/ChartsPanel.tsx` | Optional `visibleCharts` prop for selective rendering |
| `components/Map/InteractiveMap.tsx` | MapLegend removed, map centre updated |
| `components/Map/MapLegend.tsx` | Self-positioning classes removed |

**Test count**: 181 frontend examples, 0 failures (unchanged from Phase 6).

---

## Layout Architecture

### Before (Phase 6)

```
┌──────────────────────────────────────┐
│ Header                               │
├──────┬───────────────────────────────┤
│      │ MetricCards                   │
│ Side │ ComparisonResult (optional)   │
│ bar  │ Map (fixed height 300/500px)  │
│      │ ChartsPanel (4 charts)        │
└──────┴───────────────────────────────┘
```

- Root: `flex flex-col h-screen bg-gray-50`
- Sidebar: `fixed left-0` full-viewport-height
- Main area scrolls vertically

### After (Phase 7)

```
┌──────────────────────────────────────┐
│ Header (in document flow, full width)│
├──────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌────┐ │
│  │ Choropleth selector     │  │    │ │
│  ├─────────────────────────┤  │Side│ │
│  │ MetricCards (floating)  │  │ bar│ │
│  ├─────────────────────────┤  │    │ │
│  │ ComparisonResult        │  │    │ │  ← when active
│  └─────────────────────────┘  └────┘ │
│                                       │
│           MAP (full area)             │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ ChartsPanel (animated, bottom) │  │  ← when toggled on
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

- Root: `h-screen flex flex-col`
- Header: natural flex item, no absolute positioning, always full width
- Content area: `flex-1 relative overflow-hidden` — all floating elements are absolute children of this

### Header

The header is no longer `position: absolute`. It sits in the normal flex flow as `flex-shrink-0`, which guarantees its height is always respected without needing to hardcode an offset. Padding increased to `px-5 md:px-8 py-4` and gap to `gap-4` for more breathing room.

### Content area

```tsx
<div className="flex-1 relative overflow-hidden">
  {/* Map: z-0 */}
  {/* Floating panels: z-20 */}
  {/* Map legend: z-[19] */}
  {/* Sidebar: z-40 */}
</div>
```

`overflow-hidden` on a `position: relative` ancestor clips the sidebar's CSS transform when it slides off the left edge on mobile, producing the expected slide-in animation without needing `fixed` positioning.

### Floating left panel

The choropleth selector, metric cards, and comparison result are stacked in a flex column anchored at `top-4` on the left, with dynamic right-margin driven by sidebar state:

```tsx
const sidebarOffset = sidebarCollapsed
  ? "left-4 md:left-16"
  : "left-4 md:left-[296px]";
```

On mobile the sidebar is off-screen, so `left-4` is always used. On desktop the offset grows with sidebar width so the floating panel never overlaps it.

Metric cards have no background wrapper — each `Card` component already has `bg-white rounded-lg shadow-sm`. The choropleth selector and comparison result each get their own `bg-white/90 backdrop-blur-sm rounded-xl` glass container.

### Animated charts panel

The charts panel is always rendered in the DOM but translated off-screen when no charts are visible:

```tsx
${chartsVisible
  ? "translate-y-0 opacity-100"
  : "translate-y-[150%] opacity-0 pointer-events-none"}
```

`translate-y-[150%]` pushes the element below the viewport (the panel is already at `bottom-4`). `pointer-events-none` prevents invisible clicks.

---

## Modified Components

### DashboardPage.tsx

New state:

```tsx
const [visibleCharts, setVisibleCharts] = useState<Set<string>>(new Set());
const chartsVisible = visibleCharts.size > 0;
```

`handleChartToggle` toggles individual chart IDs in/out of the Set:

```tsx
function handleChartToggle(chartId: string) {
  setVisibleCharts((prev) => {
    const next = new Set(prev);
    if (next.has(chartId)) next.delete(chartId);
    else next.add(chartId);
    return next;
  });
}
```

Both `visibleCharts` and `onChartToggle` are passed down to `FilterPanel` (optional props with defaults so existing tests need no changes).

### FilterPanel.tsx

**Positioning**: changed from `fixed inset-y-0` to `absolute top-0 bottom-0`. The mobile backdrop changed from `fixed inset-0` to `absolute inset-0`. Both are now anchored to the content area instead of the viewport, so the header always remains visible and accessible even when the mobile sidebar overlay is open.

**Desktop static mode removed**: the old `md:static md:translate-x-0 md:z-auto` classes were deleted. The sidebar is now always `absolute` and always uses CSS transform for visibility — simpler and consistent across breakpoints.

**Charts dropdown section**: added at the bottom of the sidebar, matching the existing Filtros/Comparar Bairros accordion pattern exactly. Internal state only — no prop needed from the parent:

```tsx
const [chartsExpanded, setChartsExpanded] = useState(false);

function handleChartsToggle() {
  if (collapsed) {
    onCollapseToggle();       // expand sidebar first
    setChartsExpanded(true);
  } else {
    setChartsExpanded((e) => !e);
  }
}
```

When the sidebar is collapsed, clicking the chart icon both expands the sidebar and opens the section — the same behaviour as the existing Filtros button. When expanded, a "Gráficos" header button with a rotating chevron reveals four individual chart toggle buttons (highlighted in blue when active).

New additions to `Props`:

```ts
visibleCharts?: Set<string>;   // default: new Set()
onChartToggle?: (chartId: string) => void;
```

Both are optional so `FilterPanel.test.tsx` needed no changes.

### ChartsPanel.tsx

Added optional `visibleCharts?: Set<string>` prop. When omitted, all four charts are shown (backward compatible with existing tests). When provided, only charts whose ID is in the Set are rendered — including during the loading skeleton phase:

```tsx
const ALL_CHART_IDS = ["types", "equipment_by_neighborhood", "equipment_per_10k", "services"];
const shown = visibleCharts ?? new Set(ALL_CHART_IDS);

// loading:
ALL_CHART_IDS.filter((id) => shown.has(id)).map((id) => <Skeleton key={id} />)

// loaded:
{shown.has("types") && <ChartCard title="Tipos de Estabelecimento">...</ChartCard>}
// ... etc.
```

Chart IDs:

| ID | Chart |
|---|---|
| `types` | Tipos de Estabelecimento |
| `equipment_by_neighborhood` | Equipamentos por Bairro (Top 10) |
| `equipment_per_10k` | Equipamentos por 10 mil Habitantes (Top 10) |
| `services` | Serviços Especializados Mais Oferecidos (Top 10) |

---

## Stacking Context Fix — MapLegend

The map legend was previously rendered inside `InteractiveMap`, which wraps the Leaflet `MapContainer` in a `div`. In the new layout that div was at `absolute inset-0 z-0`, which creates a CSS stacking context. The legend's `z-[400]` was relative to that context — globally equivalent to z=0 — so the charts panel at `z-20` appeared on top of it.

**Fix**: `MapLegend` was moved out of `InteractiveMap` and rendered directly in `DashboardPage` inside a `absolute bottom-7 right-2 z-[19]` wrapper. `bottom-7` (28 px) clears the Leaflet attribution bar (~20 px) that sits at the very bottom of the map. The legend's own `absolute bottom-2 right-2 z-[400]` self-positioning classes were removed since the wrapper now handles placement.

Z-index hierarchy in the content area:

| Layer | z-index |
|---|---|
| Map (Leaflet) | 0 |
| Floating panels + charts | 20 |
| Map legend | 19 |
| Mobile backdrop | 30 |
| Sidebar | 40 |

---

## Chart Visibility System

The four charts are identified by string IDs. The source of truth lives in two places that must stay in sync:

- `ChartsPanel.tsx` — `ALL_CHART_IDS` array and `shown.has(id)` guards
- `FilterPanel.tsx` — `CHART_DEFS` array (id + label pairs for the toggle buttons)

If a new chart is added:
1. Add its ID to `ALL_CHART_IDS` in `ChartsPanel.tsx`
2. Add the `{ id, label }` entry to `CHART_DEFS` in `FilterPanel.tsx`
3. Add the `shown.has(id) && <ChartCard>` block in `ChartsPanel.tsx`

---

## Map Default Position

`SALVADOR_CENTER` in `InteractiveMap.tsx` was updated from `[-12.97, -38.51]` to `[-12.88845, -38.43736]` based on the actual preferred view of the city. `INITIAL_ZOOM` remains `12`.

---

## Key Decisions and Gotchas

**Why `flex-col` instead of keeping the header `absolute`?**
Making the header a normal flow element means its height is always the ground truth. The sidebar's `top-0` in the content area lands exactly at the header's bottom edge regardless of font scaling, wrapping, or future content changes. No hardcoded pixel offsets needed.

**Why `overflow-hidden` on the content area instead of `overflow-clip`?**
`overflow: hidden` on a `position: relative` element also clips CSS transforms of absolute children. This is what produces the sidebar slide-out animation on mobile without needing `position: fixed`. `overflow: clip` would not create a scroll container but has less browser support and different clipping semantics.

**Why is the chart panel still rendered when no charts are visible?**
The `translate-y-[150%]` + `pointer-events-none` approach keeps the CSS transition alive. If the element were conditionally rendered (`&&`), the slide-up animation would not play on first show (the element would appear instantly). Keeping it in the DOM at all times means the transition always fires.

**Why z-[19] for the legend and not z-[21]?**
The legend should not obscure the charts panel (z-20); it should sit below chart cards while remaining above the map. z-[19] satisfies both constraints. If the charts panel and legend overlap visually, the charts take precedence, which is intentional since the user explicitly toggled them on.
