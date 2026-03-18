import { GeoJSON } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type { NeighborhoodCollection, NeighborhoodProperties } from "../../types";

interface Props {
  data: NeighborhoodCollection;
  selectedId: number | null;
  onSelect: (id: number | null, name: string) => void;
}

function getColor(count: number): string {
  if (count === 0) return "#f0f0f0";
  if (count < 3) return "#c6e9f5";
  if (count < 8) return "#5ab4d6";
  if (count < 15) return "#2378b5";
  return "#08306b";
}

export default function NeighborhoodLayer({ data, selectedId, onSelect }: Props) {
  const style = (feature?: GeoJSON.Feature): PathOptions => {
    const props = feature?.properties as NeighborhoodProperties;
    const isSelected = props?.id === selectedId;
    return {
      fillColor: getColor(props?.establishments_count ?? 0),
      fillOpacity: isSelected ? 0.85 : 0.55,
      color: isSelected ? "#f97316" : "#555",
      weight: isSelected ? 2.5 : 1,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: Layer) => {
    const props = feature.properties as NeighborhoodProperties;
    const tooltipContent = `
      <strong>${props.name}</strong><br/>
      Estabelecimentos: ${props.establishments_count}<br/>
      Leitos SUS: ${props.sus_beds_count}
      ${props.population_total ? `<br/>Populacao: ${props.population_total.toLocaleString("pt-BR")}` : ""}
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
      key={`neighborhoods-${selectedId}`}
      data={data as GeoJSON.FeatureCollection}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}
