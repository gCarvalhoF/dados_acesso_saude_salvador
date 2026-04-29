import { useState, useEffect } from "react";
import type {
  Filters,
  DashboardOverview,
  EquipmentByNeighborhood,
  ServiceSummaryItem,
} from "../types";

export function useDashboard(filters: Filters) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [equipmentByNeighborhood, setEquipmentByNeighborhood] = useState<
    EquipmentByNeighborhood[]
  >([]);
  const [serviceSummary, setServiceSummary] = useState<ServiceSummaryItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    type,
    legal_nature,
    management,
    sus_only,
    neighborhood_id,
    equipment,
    service,
    reference_category,
  } = filters;

  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (legal_nature) params.set("legal_nature", legal_nature);
    if (management) params.set("management", management);
    if (sus_only) params.set("sus_only", "true");
    if (neighborhood_id) params.set("neighborhood_id", neighborhood_id);
    if (equipment) params.set("equipment", equipment);
    if (service) params.set("service", service);
    if (reference_category) params.set("reference_category", reference_category);

    const qs = params.toString() ? `?${params.toString()}` : "";

    setLoading(true);
    Promise.all([
      fetch(`/api/v1/dashboard/overview${qs}`).then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar resumo");
        return res.json();
      }),
      fetch(`/api/v1/dashboard/equipment_by_neighborhood${qs}`).then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar equipamentos por bairro");
        return res.json();
      }),
      fetch(`/api/v1/dashboard/service_summary${qs}`).then((res) => {
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
  }, [
    type,
    legal_nature,
    management,
    sus_only,
    neighborhood_id,
    equipment,
    service,
    reference_category,
  ]);

  return { overview, equipmentByNeighborhood, serviceSummary, loading, error };
}
