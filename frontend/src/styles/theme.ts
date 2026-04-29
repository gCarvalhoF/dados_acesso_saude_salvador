/**
 * Valores de tema para uso em contextos JavaScript (ex: Leaflet).
 * Espelham as CSS custom properties definidas em theme.css.
 */

export const markerColors = {
  usf:                    "#16a34a", // green  — primary care circle
  ubs:                    "#2563eb", // blue   — primary care circle
  hospitalGeral:          "#dc2626", // red    — hospital cross
  hospitalEspecializado:  "#9b2226", // dark red — hospital cross
  prontoSocorro:          "#ea580c", // orange — emergency triangle
  prontoAtendimento:      "#ca8a04", // amber  — emergency triangle
  policlinica:            "#7c3aed", // purple — specialty circle
  caps:                   "#0891b2", // cyan   — specialty circle
  default:                "#6b7280", // gray
} as const;

export const choroplethColors = {
  0: "#f0f0f0",
  1: "#c6e9f5",
  2: "#5ab4d6",
  3: "#2378b5",
  4: "#08306b",
} as const;

export const neighborhoodColors = {
  selected: "#f97316",
  border:   "#555555",
} as const;
