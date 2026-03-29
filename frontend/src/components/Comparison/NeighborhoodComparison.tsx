import { useState } from "react";
import type { NeighborhoodCollection } from "../../types";
import { useNeighborhoodComparison } from "../../hooks/useNeighborhoodComparison";
import MultiSelect from "../ui/MultiSelect";
import ComparisonTable from "./ComparisonTable";

interface Props {
  neighborhoods: NeighborhoodCollection | null;
  selectedIds: number[];
  onSelectedIdsChange: (ids: number[]) => void;
}

export default function NeighborhoodComparison({
  neighborhoods,
  selectedIds,
  onSelectedIdsChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const { data, loading } = useNeighborhoodComparison(selectedIds);

  const options = (neighborhoods?.features ?? [])
    .map((f) => ({
      value: f.properties.id,
      label: f.properties.name,
      description: f.properties.city_name ?? undefined,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          Comparar Bairros
          {selectedIds.length >= 2 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {selectedIds.length} selecionados
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="pt-3">
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
          </div>

          {selectedIds.length < 2 && (
            <p className="text-xs text-gray-400">Selecione pelo menos 2 bairros para comparar.</p>
          )}

          {loading && (
            <div className="text-sm text-gray-500 animate-pulse py-4 text-center">
              Carregando comparativo...
            </div>
          )}

          {data && data.length >= 2 && <ComparisonTable neighborhoods={data} />}
        </div>
      )}
    </div>
  );
}
