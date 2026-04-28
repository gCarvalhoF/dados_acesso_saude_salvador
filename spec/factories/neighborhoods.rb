FactoryBot.define do
  factory :neighborhood do
    sequence(:name) { |n| "Bairro #{n}" }
    sequence(:neighborhood_ibge_code) { |n| "292740800#{n.to_s.rjust(2, '0')}" }
    region_ibge_code { "2" }
    region_name { "Nordeste" }
    state_ibge_code { "29" }
    state_name { "Bahia" }
    city_ibge_code { "2927408" }
    city_name { "Salvador" }
    district_ibge_code { "292740805" }
    district_name { "Distrito Sede" }
    subdistrict_ibge_code { "29274080500" }
    subdistrict_name { "Subdistrito 1" }
    area_km2 { 2.5 }
    population_total { 10_000 }
    population_male { 4_800 }
    population_female { 5_200 }
    demographic_density { 100.5 }
  end
end
