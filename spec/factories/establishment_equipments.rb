FactoryBot.define do
  factory :establishment_equipment do
    association :health_establishment
    association :equipment_item
    quantity_existing { 1 }
    quantity_in_use { 1 }
    available_sus { true }
  end
end
