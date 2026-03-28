export interface NeighborhoodProperties {
  id: number;
  name: string;
  population_total: number | null;
  population_male: number | null;
  population_female: number | null;
  demographic_density: number | null;
  population_white: number | null;
  population_black: number | null;
  population_brown: number | null;
  income_0_2_wages: number | null;
  income_2_5_wages: number | null;
  income_5_10_wages: number | null;
  income_10_20_wages: number | null;
  income_above_20_wages: number | null;
  establishments_count: number;
  sus_beds_count: number;
  equipment_count: number;
}

export interface NeighborhoodFeature {
  type: "Feature";
  geometry: GeoJSON.MultiPolygon | GeoJSON.Polygon | null;
  properties: NeighborhoodProperties;
}

export interface NeighborhoodCollection {
  type: "FeatureCollection";
  features: NeighborhoodFeature[];
}

export interface EstablishmentProperties {
  id: number;
  cnes_code: string;
  name: string;
  fantasy_name: string | null;
  display_type: string;
  establishment_type_code: string;
  legal_nature_code: string | null;
  legal_nature_name: string | null;
  management_type: string | null;
  management_name: string | null;
  address: string | null;
  neighborhood_name: string | null;
  zip_code: string | null;
  phone: string | null;
  is_sus: boolean;
  is_active: boolean;
  neighborhood_id: number | null;
  equipments?: EquipmentDetail[];
  services?: ServiceDetail[];
  beds?: { total_existing: number; total_sus: number };
}

export interface EquipmentDetail {
  code: string;
  name: string;
  quantity_existing: number;
  quantity_in_use: number;
  available_sus: boolean;
}

export interface ServiceDetail {
  code: string;
  name: string;
  classification_code: string | null;
  ambulatorial_sus: boolean;
  hospitalar_sus: boolean;
}

export interface EstablishmentFeature {
  type: "Feature";
  geometry: GeoJSON.Point | null;
  properties: EstablishmentProperties;
}

export interface EstablishmentCollection {
  type: "FeatureCollection";
  features: EstablishmentFeature[];
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterOptions {
  establishment_types: FilterOption[];
  legal_natures: FilterOption[];
  management_types: FilterOption[];
  equipment_items: FilterOption[];
  specialized_services: FilterOption[];
}

export interface Filters {
  type: string;
  legal_nature: string;
  management: string;
  sus_only: boolean;
  neighborhood_id: string;
  equipment: string;
  service: string;
}

export interface DashboardOverview {
  establishments: {
    total: number;
    sus: number;
    by_type: { code: string; name: string; count: number }[];
  };
  equipments: {
    total_equipments: number;
    sus_equipments: number;
    by_type: { type: string; total: number }[];
  };
  beds: { total_existing: number; total_sus: number };
  neighborhoods: { total: number; with_data: number };
}

export interface EquipmentByNeighborhood {
  neighborhood: string;
  total_equipments: number;
}

export interface ServiceSummaryItem {
  code: string;
  name: string;
  establishments_count: number;
}

export type ChoroplethMetric =
  | "establishments_count"
  | "equipment_count"
  | "sus_beds_count"
  | "population_total"
  | "demographic_density";

export const ESTABLISHMENT_TYPES: Record<string, string> = {
  "": "Todos os tipos",
  "01": "Hospital Geral",
  "02": "Centro de Saude/Unidade Basica",
  "04": "Policlinica",
  "05": "Hospital Especializado",
  "20": "Pronto Socorro Geral",
  "22": "Pronto Atendimento",
  "32": "Clinica/Centro de Especialidade",
  "70": "Centro de Atencao Psicossocial",
};

export const LEGAL_NATURES: Record<string, string> = {
  "": "Todas",
  publica: "Pública",
  privada: "Privada",
  sem_fins_lucrativos: "Sem Fins Lucrativos",
  pessoa_fisica: "Pessoa Física",
};

export const MANAGEMENT_TYPES: Record<string, string> = {
  "": "Todos",
  M: "Municipal",
  E: "Estadual",
  D: "Dupla",
  S: "Sem Gestao",
};
