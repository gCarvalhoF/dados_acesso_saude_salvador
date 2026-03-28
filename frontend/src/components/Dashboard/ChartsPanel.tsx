import type {
  DashboardOverview,
  EquipmentByNeighborhood,
  ServiceSummaryItem,
  NeighborhoodCollection,
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Tipos de Estabelecimento">
        <EstablishmentTypeChart
          data={overview?.establishments.by_type ?? []}
        />
      </ChartCard>

      <ChartCard title="Equipamentos por Bairro (Top 10)">
        <EquipmentByNeighborhoodChart data={equipmentByNeighborhood} />
      </ChartCard>

      <ChartCard title="Equipamentos por 10 mil Habitantes (Top 10)">
        <EquipmentPer10kChart
          equipmentData={equipmentByNeighborhood}
          neighborhoods={neighborhoods}
        />
      </ChartCard>

      <ChartCard title="Serviços Especializados Mais Oferecidos (Top 10)">
        <ServiceSummaryChart data={serviceSummary} />
      </ChartCard>
    </div>
  );
}
