FactoryBot.define do
  factory :neighborhood do
    sequence(:name) { |n| "Bairro #{n}" }
    population_total { 10_000 }
    population_male { 4_800 }
    population_female { 5_200 }
    demographic_density { 100.5 }
    income_0_2_wages { 30.0 }
    income_2_5_wages { 25.0 }
    income_5_10_wages { 20.0 }
    income_10_20_wages { 15.0 }
    income_above_20_wages { 10.0 }
  end
end
