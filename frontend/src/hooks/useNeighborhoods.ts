import { useState, useEffect } from "react";
import type { NeighborhoodCollection } from "../types";

export function useNeighborhoods() {
  const [data, setData] = useState<NeighborhoodCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/neighborhoods")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar bairros");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
