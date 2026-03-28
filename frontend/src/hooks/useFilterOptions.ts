import { useState, useEffect } from "react";
import type { FilterOptions } from "../types";
import { ESTABLISHMENT_TYPES, LEGAL_NATURES, MANAGEMENT_TYPES } from "../types";

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  establishment_types: Object.entries(ESTABLISHMENT_TYPES).map(([value, label]) => ({ value, label })),
  legal_natures: Object.entries(LEGAL_NATURES).map(([value, label]) => ({ value, label })),
  management_types: Object.entries(MANAGEMENT_TYPES).map(([value, label]) => ({ value, label })),
  equipment_items: [],
  specialized_services: [],
};

export function useFilterOptions() {
  const [data, setData] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);

  useEffect(() => {
    fetch("/api/v1/filter_options")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setData)
      .catch(() => setData(DEFAULT_FILTER_OPTIONS));
  }, []);

  return data;
}
