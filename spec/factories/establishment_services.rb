FactoryBot.define do
  factory :establishment_service do
    association :health_establishment
    association :specialized_service
    classification_code { "001" }
    service_characteristic { "1" }
    ambulatorial_sus { true }
    hospitalar_sus { false }
  end
end
