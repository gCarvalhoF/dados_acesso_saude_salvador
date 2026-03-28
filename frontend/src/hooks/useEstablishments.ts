import { useState, useEffect } from "react";
import type { EstablishmentCollection, EstablishmentProperties, Filters } from "../types";

export function useEstablishments(filters: Filters) {
  const [data, setData] = useState<EstablishmentCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.legal_nature) params.set("legal_nature", filters.legal_nature);
    if (filters.management) params.set("management", filters.management);
    if (filters.sus_only) params.set("sus_only", "true");
    if (filters.neighborhood_id) params.set("neighborhood_id", filters.neighborhood_id);
    if (filters.equipment) params.set("equipment", filters.equipment);
    if (filters.service) params.set("service", filters.service);

    setLoading(true);
    fetch(`/api/v1/health_establishments?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar estabelecimentos");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters.type, filters.legal_nature, filters.management, filters.sus_only, filters.neighborhood_id, filters.equipment, filters.service]);

  return { data, loading, error };
}

export function useEstablishmentDetail(id: number | null) {
  const [data, setData] = useState<EstablishmentProperties | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) { setData(null); return; }

    setLoading(true);
    fetch(`/api/v1/health_establishments/${id}`)
      .then((res) => res.json())
      .then((feature) => setData(feature.properties))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading };
}
