import type {
  NeighborhoodCollection,
  EstablishmentCollection,
  EstablishmentProperties,
} from "../../src/types";

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
      },
    },
  ],
};

export const mockEstablishmentDetail: EstablishmentProperties = {
  ...mockEstablishments.features[0].properties,
  equipments: [
    { code: "02", name: "Mamografo", quantity_existing: 2, quantity_in_use: 1, available_sus: true },
    { code: "11", name: "Tomografo", quantity_existing: 1, quantity_in_use: 1, available_sus: false },
  ],
  services: [
    { code: "116", name: "Cardiologia", classification_code: "001", ambulatorial_sus: true, hospitalar_sus: false },
  ],
  beds: { total_existing: 0, total_sus: 0 },
};
