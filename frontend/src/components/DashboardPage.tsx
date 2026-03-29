import { useState } from "react";
import type { ChoroplethMetric, Filters } from "../types";
import { useNeighborhoods } from "../hooks/useNeighborhoods";
import { useEstablishments } from "../hooks/useEstablishments";
import { useFilterOptions } from "../hooks/useFilterOptions";
import { useDashboard } from "../hooks/useDashboard";
import InteractiveMap from "./Map/InteractiveMap";
import FilterPanel from "./Filters/FilterPanel";
import MetricCards from "./Dashboard/MetricCards";
import ChartsPanel from "./Dashboard/ChartsPanel";
import NeighborhoodComparison from "./Comparison/NeighborhoodComparison";
import { METRIC_LABELS } from "./Map/NeighborhoodLayer";

const DEFAULT_FILTERS: Filters = {
  type: "01,02,04,05,32",
  legal_nature: "",
  management: "",
  sus_only: false,
  neighborhood_id: "",
  equipment: "",
  service: "",
  reference_category: "",
};

const CHOROPLETH_OPTIONS: ChoroplethMetric[] = [
  "establishments_count",
  "equipment_count",
  "sus_beds_count",
  "population_total",
  "demographic_density",
];

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<number | null>(null);
  const [selectedNeighborhoodName, setSelectedNeighborhoodName] = useState<string>("");
  const [choroplethMetric, setChoroplethMetric] = useState<ChoroplethMetric>("establishments_count");
  const [filterOpen, setFilterOpen] = useState(false);
  const [comparisonIds, setComparisonIds] = useState<number[]>([]);

  const { data: neighborhoods, loading: loadingNeighborhoods } = useNeighborhoods();
  const { data: establishments, loading: loadingEstablishments } = useEstablishments(filters);
  const filterOptions = useFilterOptions();
  const {
    overview,
    equipmentByNeighborhood,
    serviceSummary,
    loading: loadingDashboard,
  } = useDashboard(filters);

  function handleFilterChange(partial: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
    if (partial.neighborhood_id !== undefined) {
      if (!partial.neighborhood_id) {
        setSelectedNeighborhood(null);
        setSelectedNeighborhoodName("");
      } else {
        const ids = partial.neighborhood_id.split(",").map(Number);
        setSelectedNeighborhood(ids[0]);
        const names = ids.map(
          (nid) => neighborhoods?.features.find((f) => f.properties.id === nid)?.properties.name ?? ""
        ).filter(Boolean);
        setSelectedNeighborhoodName(names.join(", "));
      }
    }
  }

  function handleNeighborhoodSelect(id: number | null, name: string) {
    setSelectedNeighborhood(id);
    setSelectedNeighborhoodName(id ? name : "");
    setFilters((prev) => ({ ...prev, neighborhood_id: id ? String(id) : "" }));
  }

  function handleClearNeighborhood() {
    setSelectedNeighborhood(null);
    setSelectedNeighborhoodName("");
    setComparisonIds([]);
    setFilters((prev) => ({ ...prev, neighborhood_id: "" }));
  }

  function handleComparisonIdsChange(ids: number[]) {
    setComparisonIds(ids);
    if (ids.length === 0) {
      setSelectedNeighborhood(null);
      setSelectedNeighborhoodName("");
      setFilters((prev) => ({ ...prev, neighborhood_id: "" }));
    } else {
      const names = ids.map(
        (nid) => neighborhoods?.features.find((f) => f.properties.id === nid)?.properties.name ?? ""
      ).filter(Boolean);
      setSelectedNeighborhood(ids[0]);
      setSelectedNeighborhoodName(names.join(", "));
      setFilters((prev) => ({ ...prev, neighborhood_id: ids.join(",") }));
    }
  }

  const totalCount = establishments?.features.length ?? 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-5 py-3 flex items-center justify-between flex-shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="md:hidden p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
            aria-label="Abrir filtros"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Saúde em Salvador
            </h1>
            <p className="text-xs text-gray-500">
              Distribuição de equipamentos e estabelecimentos de saúde
            </p>
          </div>
        </div>

        {selectedNeighborhoodName && (
          <div className="flex items-center gap-2">
            <span className="bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full font-medium">
              {selectedNeighborhoodName}
            </span>
            <button
              onClick={handleClearNeighborhood}
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
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Metric Cards */}
            <MetricCards overview={overview} loading={loadingDashboard} />

            {/* Neighborhood Comparison */}
            <NeighborhoodComparison
              neighborhoods={neighborhoods}
              selectedIds={comparisonIds}
              onSelectedIdsChange={handleComparisonIdsChange}
            />

            {/* Choropleth metric selector + Map */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                <label htmlFor="choropleth-metric" className="text-xs font-medium text-gray-600">
                  Métrica do mapa:
                </label>
                <select
                  id="choropleth-metric"
                  value={choroplethMetric}
                  onChange={(e) => setChoroplethMetric(e.target.value as ChoroplethMetric)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {CHOROPLETH_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {METRIC_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="h-[300px] md:h-[500px]">
                <InteractiveMap
                  neighborhoods={neighborhoods}
                  establishments={establishments}
                  selectedNeighborhood={selectedNeighborhood}
                  onNeighborhoodSelect={handleNeighborhoodSelect}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  choroplethMetric={choroplethMetric}
                />
              </div>
            </div>

            {/* Charts */}
            <ChartsPanel
              overview={overview}
              equipmentByNeighborhood={equipmentByNeighborhood}
              serviceSummary={serviceSummary}
              neighborhoods={neighborhoods}
              loading={loadingDashboard}
              onFilterChange={handleFilterChange}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
