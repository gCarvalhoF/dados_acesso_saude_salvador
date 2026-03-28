import { useState, useEffect } from "react";
import type {
  DashboardOverview,
  EquipmentByNeighborhood,
  ServiceSummaryItem,
} from "../types";

export function useDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [equipmentByNeighborhood, setEquipmentByNeighborhood] = useState<
    EquipmentByNeighborhood[]
  >([]);
  const [serviceSummary, setServiceSummary] = useState<ServiceSummaryItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/dashboard/overview").then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar resumo");
        return res.json();
      }),
      fetch("/api/v1/dashboard/equipment_by_neighborhood").then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar equipamentos por bairro");
        return res.json();
      }),
      fetch("/api/v1/dashboard/service_summary").then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar resumo de serviços");
        return res.json();
      }),
    ])
      .then(([overviewData, equipData, serviceData]) => {
        setOverview(overviewData);
        setEquipmentByNeighborhood(equipData.data);
        setServiceSummary(serviceData.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { overview, equipmentByNeighborhood, serviceSummary, loading, error };
}
