import type { NeighborhoodCollection } from "../../types";
import MultiSelect from "../ui/MultiSelect";

interface Props {
  neighborhoods: NeighborhoodCollection | null;
  selectedIds: number[];
  onSelectedIdsChange: (ids: number[]) => void;
}

export default function NeighborhoodComparisonInput({
  neighborhoods,
  selectedIds,
  onSelectedIdsChange,
}: Props) {
  const options = (neighborhoods?.features ?? [])
    .map((f) => ({
      value: f.properties.id,
      label: f.properties.name,
      description: f.properties.city_name ?? undefined,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  return (
    <div id="neighborhood-comparison-panel" className="px-1 pt-2 space-y-2">
      <MultiSelect
        id="neighborhood-compare"
        label="Selecione bairros para comparar"
        options={options}
        selected={selectedIds}
        onChange={onSelectedIdsChange}
        max={5}
      />
      <p className="text-xs text-blue-600">
        Ao selecionar bairros, o mapa, gráficos e cards são filtrados automaticamente.
      </p>
      {selectedIds.length < 2 && (
        <p className="text-xs text-gray-400">Selecione pelo menos 2 bairros para comparar.</p>
      )}
    </div>
  );
}
