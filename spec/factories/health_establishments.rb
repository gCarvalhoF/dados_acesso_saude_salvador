FactoryBot.define do
  factory :health_establishment do
    sequence(:cnes_code) { |n| n.to_s.rjust(7, "0") }
    sequence(:name) { |n| "Unidade de Saude #{n}" }
    fantasy_name { nil }
    establishment_type_code { "02" }
    legal_nature_code { "1244" }
    management_type { "M" }
    address { "Rua das Flores, 123" }
    neighborhood_name { "Centro" }
    zip_code { "40000000" }
    phone { "71 3333-4444" }
    is_sus { true }
    is_active { true }
    coordinates { nil }
    neighborhood { nil }

    trait :usf do
      after(:create) do |est|
        esf = SpecializedService.find_by(code: SpecializedService::ESF_CODE) ||
              create(:esf_service)
        create(:establishment_service, health_establishment: est, specialized_service: esf)
      end
    end

    trait :hospital do
      establishment_type_code { "01" }
      sequence(:name) { |n| "Hospital #{n}" }
    end

    trait :sus_only do
      is_sus { true }
    end

    trait :non_sus do
      is_sus { false }
    end

    trait :inactive do
      is_active { false }
    end

    trait :with_coordinates do
      after(:build) do |est|
        factory = RGeo::Geographic.spherical_factory(srid: 4326)
        est.coordinates = factory.point(-38.5, -12.97)
      end
    end
  end
end
