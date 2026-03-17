FactoryBot.define do
  factory :equipment_item do
    sequence(:code) { |n| "EQ#{n.to_s.rjust(2, '0')}" }
    sequence(:name) { |n| "Equipamento Item #{n}" }
    association :equipment_type
  end
end
