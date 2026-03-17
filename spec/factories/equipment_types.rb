FactoryBot.define do
  factory :equipment_type do
    sequence(:code) { |n| "#{n}" }
    sequence(:name) { |n| "Tipo Equipamento #{n}" }
  end
end
