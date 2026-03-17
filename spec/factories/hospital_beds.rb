FactoryBot.define do
  factory :hospital_bed do
    association :health_establishment
    bed_code { "01" }
    bed_type_code { "01" }
    quantity_existing { 10 }
    quantity_sus { 8 }
  end
end
