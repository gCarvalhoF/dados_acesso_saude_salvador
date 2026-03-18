/**
 * Valores de tema para uso em contextos JavaScript (ex: Leaflet).
 * Espelham as CSS custom properties definidas em theme.css.
 */

export const markerColors = {
  usf:                    "#16a34a",
  ubs:                    "#2563eb",
  hospitalGeral:          "#dc2626",
  hospitalEspecializado:  "#ea580c",
  prontoSocorro:          "#b91c1c",
  prontoAtendimento:      "#ca8a04",
  policlinica:            "#7c3aed",
  caps:                   "#0891b2",
  default:                "#6b7280",
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
