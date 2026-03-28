import type {
  NeighborhoodCollection,
  EstablishmentCollection,
  EstablishmentProperties,
  FilterOptions,
  DashboardOverview,
  EquipmentByNeighborhood,
  ServiceSummaryItem,
} from "../../src/types";
import { ESTABLISHMENT_TYPES, LEGAL_NATURES, MANAGEMENT_TYPES } from "../../src/types";

export const mockFilterOptions: FilterOptions = {
  establishment_types: Object.entries(ESTABLISHMENT_TYPES).map(([value, label]) => ({ value, label })),
  legal_natures: Object.entries(LEGAL_NATURES).map(([value, label]) => ({ value, label })),
  management_types: Object.entries(MANAGEMENT_TYPES).map(([value, label]) => ({ value, label })),
  equipment_items: [
    { value: "", label: "Todos os equipamentos" },
    { value: "02", label: "Mamografo" },
    { value: "11", label: "Tomografo" },
  ],
  specialized_services: [
    { value: "", label: "Todos os serviços" },
    { value: "116", label: "Cardiologia" },
    { value: "132", label: "Oncologia" },
  ],
  reference_categories: [
    { value: "", label: "Todas as referências" },
    { value: "hospital_infeccao", label: "Hospital de Infecção" },
    { value: "referencia_cardiovascular", label: "Referência Cardiovascular" },
    { value: "referencia_oncologica", label: "Referência Oncológica" },
    { value: "referencia_trauma", label: "Referência Trauma/Ortopedia" },
    { value: "hospital_ensino", label: "Hospital de Ensino" },
  ],
};

export const mockNeighborhoods: NeighborhoodCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: null,
      properties: {
        id: 1,
        name: "Pituba",
        population_total: 50000,
        population_male: 24000,
        population_female: 26000,
        demographic_density: 120.5,
        population_white: 20000,
        population_black: 10000,
        population_brown: 15000,
        income_0_2_wages: 5000,
        income_2_5_wages: 10000,
        income_5_10_wages: 8000,
        income_10_20_wages: 4000,
        income_above_20_wages: 2000,
        establishments_count: 8,
        sus_beds_count: 120,
        equipment_count: 15,
      },
    },
    {
      type: "Feature",
      geometry: null,
      properties: {
        id: 2,
        name: "Barra",
        population_total: 30000,
        population_male: 14000,
        population_female: 16000,
        demographic_density: 90.0,
        population_white: 12000,
        population_black: 6000,
        population_brown: 9000,
        income_0_2_wages: 3000,
        income_2_5_wages: 7000,
        income_5_10_wages: 6000,
        income_10_20_wages: 3000,
        income_above_20_wages: 1500,
        establishments_count: 3,
        sus_beds_count: 40,
        equipment_count: 5,
      },
    },
  ],
};

export const mockEstablishments: EstablishmentCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-38.5, -12.97] },
      properties: {
        id: 10,
        cnes_code: "0000010",
        name: "UBS Pituba",
        fantasy_name: "UBS Pituba",
        display_type: "Centro de Saude/Unidade Basica",
        establishment_type_code: "02",
        legal_nature_code: "1244",
        legal_nature_name: "Prefeitura Municipal",
        management_type: "M",
        management_name: "Municipal",
        address: "Rua das Flores, 10",
        neighborhood_name: "Pituba",
        zip_code: "41810000",
        phone: "71 3333-0001",
        is_sus: true,
        is_active: true,
        neighborhood_id: 1,
        reference_categories: [],
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-38.51, -12.96] },
      properties: {
        id: 11,
        cnes_code: "0000011",
        name: "Hospital Geral da Barra",
        fantasy_name: null,
        display_type: "Hospital Geral",
        establishment_type_code: "01",
        legal_nature_code: "1023",
        legal_nature_name: "Secretaria Estadual de Saúde",
        management_type: "E",
        management_name: "Estadual",
        address: "Av. Oceânica, 500",
        neighborhood_name: "Barra",
        zip_code: "40170010",
        phone: "71 3333-0002",
        is_sus: true,
        is_active: true,
        neighborhood_id: 2,
        reference_categories: ["Referência Cardiovascular"],
      },
    },
  ],
};

export const mockEstablishmentDetail: EstablishmentProperties = {
  ...mockEstablishments.features[0].properties,
  reference_categories: ["Referência Cardiovascular"],
  equipments: [
    { code: "02", name: "Mamografo", quantity_existing: 2, quantity_in_use: 1, available_sus: true },
    { code: "11", name: "Tomografo", quantity_existing: 1, quantity_in_use: 1, available_sus: false },
  ],
  services: [
    { code: "116", name: "Cardiologia", classification_code: "001", ambulatorial_sus: true, hospitalar_sus: false },
  ],
  beds: { total_existing: 0, total_sus: 0 },
};

export const mockDashboardOverview: DashboardOverview = {
  establishments: {
    total: 150,
    sus: 120,
    by_type: [
      { code: "02", name: "Centro de Saude/Unidade Basica", count: 60 },
      { code: "01", name: "Hospital Geral", count: 25 },
      { code: "05", name: "Hospital Especializado", count: 15 },
    ],
  },
  equipments: {
    total_equipments: 500,
    sus_equipments: 350,
    by_type: [
      { type: "Mamografo", total: 30 },
      { type: "Tomografo", total: 25 },
    ],
  },
  beds: { total_existing: 2000, total_sus: 1500 },
  neighborhoods: { total: 163, with_data: 160 },
};

export const mockEquipmentByNeighborhood: EquipmentByNeighborhood[] = [
  { neighborhood: "Pituba", total_equipments: 45 },
  { neighborhood: "Barra", total_equipments: 30 },
  { neighborhood: "Brotas", total_equipments: 20 },
];

export const mockServiceSummary: ServiceSummaryItem[] = [
  { code: "116", name: "Cardiologia", establishments_count: 40 },
  { code: "132", name: "Oncologia", establishments_count: 25 },
  { code: "101", name: "ESF", establishments_count: 60 },
];
