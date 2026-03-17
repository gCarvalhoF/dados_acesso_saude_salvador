FactoryBot.define do
  factory :specialized_service do
    sequence(:code) { |n| "#{100 + n}" }
    sequence(:name) { |n| "Servico Especializado #{n}" }

    factory :esf_service do
      code { SpecializedService::ESF_CODE }
      name { "Estrategia de Saude da Familia" }
    end
  end
end
