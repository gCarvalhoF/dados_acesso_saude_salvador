import { useState } from "react";
import type { Filters } from "../types";
import { useNeighborhoods } from "../hooks/useNeighborhoods";
import { useEstablishments } from "../hooks/useEstablishments";
import { useFilterOptions } from "../hooks/useFilterOptions";
import InteractiveMap from "./Map/InteractiveMap";
import FilterPanel from "./Filters/FilterPanel";

const DEFAULT_FILTERS: Filters = {
  type: "",
  legal_nature: "",
  management: "",
  sus_only: false,
  neighborhood_id: "",
};

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<number | null>(null);
  const [selectedNeighborhoodName, setSelectedNeighborhoodName] = useState<string>("");

  const { data: neighborhoods, loading: loadingNeighborhoods } = useNeighborhoods();
  const { data: establishments, loading: loadingEstablishments } = useEstablishments(filters);
  const filterOptions = useFilterOptions();

  function handleFilterChange(partial: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
    // Se trocar bairro pelo filtro, sincronizar seleção no mapa
    if (partial.neighborhood_id !== undefined) {
      const id = partial.neighborhood_id ? Number(partial.neighborhood_id) : null;
      setSelectedNeighborhood(id);
      if (!id) {
        setSelectedNeighborhoodName("");
      } else {
        const name = neighborhoods?.features.find((f) => f.properties.id === id)?.properties.name ?? "";
        setSelectedNeighborhoodName(name);
      }
    }
  }

  function handleNeighborhoodSelect(id: number | null, name: string) {
    setSelectedNeighborhood(id);
    setSelectedNeighborhoodName(id ? name : "");
    setFilters((prev) => ({ ...prev, neighborhood_id: id ? String(id) : "" }));
  }

  const totalCount = establishments?.features.length ?? 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Saúde em Salvador
          </h1>
          <p className="text-xs text-gray-500">
            Distribuição de equipamentos e estabelecimentos de saúde
          </p>
        </div>

        {selectedNeighborhoodName && (
          <div className="flex items-center gap-2">
            <span className="bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full font-medium">
              {selectedNeighborhoodName}
            </span>
            <button
              onClick={() => handleNeighborhoodSelect(null, "")}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              title="Limpar seleção"
            >
              ×
            </button>
          </div>
        )}

        {(loadingNeighborhoods || loadingEstablishments) && (
          <span className="text-xs text-gray-400 animate-pulse">Carregando...</span>
        )}
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <FilterPanel
          filters={filters}
          filterOptions={filterOptions}
          onChange={handleFilterChange}
          neighborhoods={neighborhoods}
          totalCount={totalCount}
          loading={loadingEstablishments}
        />

        <main className="flex-1 relative">
          <InteractiveMap
            neighborhoods={neighborhoods}
            establishments={establishments}
            selectedNeighborhood={selectedNeighborhood}
            onNeighborhoodSelect={handleNeighborhoodSelect}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </main>
      </div>
    </div>
  );
}
