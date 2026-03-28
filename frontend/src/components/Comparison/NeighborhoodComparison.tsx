import { useState } from "react";
import type { NeighborhoodCollection } from "../../types";
import { useNeighborhoodComparison } from "../../hooks/useNeighborhoodComparison";
import MultiSelect from "../ui/MultiSelect";
import ComparisonTable from "./ComparisonTable";

interface Props {
  neighborhoods: NeighborhoodCollection | null;
}

export default function NeighborhoodComparison({ neighborhoods }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { data, loading } = useNeighborhoodComparison(selectedIds);

  const options = (neighborhoods?.features ?? [])
    .map((f) => ({ value: f.properties.id, label: f.properties.name }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span>Comparar Bairros</span>
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
              onChange={setSelectedIds}
              max={5}
            />
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
