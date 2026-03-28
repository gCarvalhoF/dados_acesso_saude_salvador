import { useState, useEffect } from "react";
import type { NeighborhoodProperties } from "../types";

export function useNeighborhoodComparison(ids: number[]) {
  const [data, setData] = useState<NeighborhoodProperties[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idsKey = ids.join(",");
  const idsCount = ids.length;

  useEffect(() => {
    if (idsCount < 2) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/v1/neighborhoods/compare?ids=${idsKey}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar comparativo");
        return res.json();
      })
      .then((json) => setData(json.neighborhoods))
      .catch((e) => {
        setError(e.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [idsKey, idsCount]);

  return { data, loading, error };
}
