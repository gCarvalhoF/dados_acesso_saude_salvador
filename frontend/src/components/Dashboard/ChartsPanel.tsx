import type {
  DashboardOverview,
  EquipmentByNeighborhood,
  Filters,
  NeighborhoodCollection,
  ServiceSummaryItem,
} from "../../types";
import EstablishmentTypeChart from "./Charts/EstablishmentTypeChart";
import EquipmentByNeighborhoodChart from "./Charts/EquipmentByNeighborhoodChart";
import EquipmentPer10kChart from "./Charts/EquipmentPer10kChart";
import ServiceSummaryChart from "./Charts/ServiceSummaryChart";

interface Props {
  overview: DashboardOverview | null;
  equipmentByNeighborhood: EquipmentByNeighborhood[];
  serviceSummary: ServiceSummaryItem[];
  neighborhoods: NeighborhoodCollection | null;
  loading: boolean;
  onFilterChange?: (partial: Partial<Filters>) => void;
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function ChartsPanel({
  overview,
  equipmentByNeighborhood,
  serviceSummary,
  neighborhoods,
  loading,
  onFilterChange,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 animate-pulse h-80"
          />
        ))}
      </div>
    );
  }

  const neighborhoodNameToId = new Map<string, string>();
  for (const f of neighborhoods?.features ?? []) {
    neighborhoodNameToId.set(f.properties.name, String(f.properties.id));
  }

  function handleNeighborhoodClick(name: string) {
    const id = neighborhoodNameToId.get(name);
    if (id) onFilterChange?.({ neighborhood_id: id });
  }

  function handleTypeClick(code: string) {
    onFilterChange?.({ type: code });
  }

  function handleServiceClick(code: string) {
    onFilterChange?.({ service: code });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Tipos de Estabelecimento">
        <EstablishmentTypeChart
          data={overview?.establishments.by_type ?? []}
          onTypeClick={onFilterChange ? handleTypeClick : undefined}
        />
      </ChartCard>

      <ChartCard title="Equipamentos por Bairro (Top 10)">
        <EquipmentByNeighborhoodChart
          data={equipmentByNeighborhood}
          onNeighborhoodClick={onFilterChange ? handleNeighborhoodClick : undefined}
        />
      </ChartCard>

      <ChartCard title="Equipamentos por 10 mil Habitantes (Top 10)">
        <EquipmentPer10kChart
          equipmentData={equipmentByNeighborhood}
          neighborhoods={neighborhoods}
          onNeighborhoodClick={onFilterChange ? handleNeighborhoodClick : undefined}
        />
      </ChartCard>

      <ChartCard title="Serviços Especializados Mais Oferecidos (Top 10)">
        <ServiceSummaryChart
          data={serviceSummary}
          onServiceClick={onFilterChange ? handleServiceClick : undefined}
        />
      </ChartCard>
    </div>
  );
}
