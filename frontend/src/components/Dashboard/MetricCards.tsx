import type { DashboardOverview } from "../../types";

interface Props {
  overview: DashboardOverview | null;
  loading: boolean;
}

interface CardProps {
  label: string;
  value: number;
}

function Card({ label, value }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
      <div className="h-6 bg-gray-200 rounded w-16" />
    </div>
  );
}

export default function MetricCards({ overview, loading }: Props) {
  if (loading || !overview) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Estabelecimentos", value: overview.establishments.total },
    { label: "Estab. SUS", value: overview.establishments.sus },
    { label: "Equipamentos", value: overview.equipments.total_equipments },
    { label: "Equip. SUS", value: overview.equipments.sus_equipments },
    { label: "Leitos Totais", value: overview.beds.total_existing },
    { label: "Leitos SUS", value: overview.beds.total_sus },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <Card key={card.label} label={card.label} value={card.value} />
      ))}
    </div>
  );
}
