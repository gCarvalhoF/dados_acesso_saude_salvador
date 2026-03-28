import { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type {
  NeighborhoodCollection,
  NeighborhoodProperties,
  ChoroplethMetric,
} from "../../types";
import { choroplethColors, neighborhoodColors } from "../../styles/theme";

export const METRIC_LABELS: Record<ChoroplethMetric, string> = {
  establishments_count: "Estabelecimentos",
  equipment_count: "Equipamentos",
  sus_beds_count: "Leitos SUS",
  population_total: "População",
  demographic_density: "Dens. Demográfica",
};

interface Props {
  data: NeighborhoodCollection;
  selectedId: number | null;
  onSelect: (id: number | null, name: string) => void;
  metric: ChoroplethMetric;
}

function computeBins(data: NeighborhoodCollection, metric: ChoroplethMetric): number[] {
  const values = data.features
    .map((f) => (f.properties[metric] as number) ?? 0)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);

  if (values.length === 0) return [1, 2, 3, 4];

  const percentile = (p: number) => {
    const idx = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, idx)];
  };

  const bins = [
    percentile(20),
    percentile(40),
    percentile(60),
    percentile(80),
  ];

  // Deduplicate: ensure strictly increasing
  const unique = [bins[0]];
  for (let i = 1; i < bins.length; i++) {
    if (bins[i] > unique[unique.length - 1]) {
      unique.push(bins[i]);
    } else {
      unique.push(unique[unique.length - 1] + 1);
    }
  }
  return unique;
}

function getColor(value: number, bins: number[]): string {
  if (value === 0 || value == null) return choroplethColors[0];
  if (value <= bins[0]) return choroplethColors[1];
  if (value <= bins[1]) return choroplethColors[2];
  if (value <= bins[2]) return choroplethColors[3];
  return choroplethColors[4];
}

export function formatBinLabels(bins: number[], metric: ChoroplethMetric) {
  const isDecimal = metric === "demographic_density";
  const fmt = (v: number) =>
    isDecimal ? v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : v.toLocaleString("pt-BR");

  return [
    { color: choroplethColors[0], label: "0" },
    { color: choroplethColors[1], label: `1–${fmt(bins[0])}` },
    { color: choroplethColors[2], label: `${fmt(bins[0] + (isDecimal ? 0.1 : 1))}–${fmt(bins[1])}` },
    { color: choroplethColors[3], label: `${fmt(bins[1] + (isDecimal ? 0.1 : 1))}–${fmt(bins[2])}` },
    { color: choroplethColors[4], label: `${fmt(bins[2] + (isDecimal ? 0.1 : 1))}+` },
  ];
}

export default function NeighborhoodLayer({ data, selectedId, onSelect, metric }: Props) {
  const bins = useMemo(() => computeBins(data, metric), [data, metric]);

  const style = (feature?: GeoJSON.Feature): PathOptions => {
    const props = feature?.properties as NeighborhoodProperties;
    const value = (props?.[metric] as number) ?? 0;
    const isSelected = props?.id === selectedId;
    return {
      fillColor: getColor(value, bins),
      fillOpacity: isSelected ? 0.85 : 0.55,
      color: isSelected ? neighborhoodColors.selected : neighborhoodColors.border,
      weight: isSelected ? 2.5 : 1,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: Layer) => {
    const props = feature.properties as NeighborhoodProperties;
    const value = (props[metric] as number) ?? 0;
    const isDecimal = metric === "demographic_density";
    const fmtValue = isDecimal
      ? value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
      : value.toLocaleString("pt-BR");

    const tooltipContent = `
      <strong>${props.name}</strong><br/>
      ${METRIC_LABELS[metric]}: ${fmtValue}
      ${props.population_total ? `<br/>População: ${props.population_total.toLocaleString("pt-BR")}` : ""}
    `;
    (layer as L.Path).bindTooltip(tooltipContent);
    layer.on({
      click: () => {
        const isAlreadySelected = props.id === selectedId;
        onSelect(isAlreadySelected ? null : props.id, props.name);
      },
    });
  };

  return (
    <GeoJSON
      key={`neighborhoods-${selectedId}-${metric}`}
      data={data as GeoJSON.FeatureCollection}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}
