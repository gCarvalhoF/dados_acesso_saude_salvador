class HealthEstablishment < ApplicationRecord
  belongs_to :neighborhood, optional: true
  has_many :establishment_equipments, dependent: :destroy
  has_many :equipment_items, through: :establishment_equipments
  has_many :establishment_services, dependent: :destroy
  has_many :specialized_services, through: :establishment_services
  has_many :hospital_beds, dependent: :destroy

  validates :cnes_code, presence: true, uniqueness: true
  validates :name, presence: true

  ESTABLISHMENT_TYPE_MAP = {
    "01" => "Hospital Geral",
    "02" => "Centro de Saude/Unidade Basica",
    "04" => "Policlinica",
    "05" => "Hospital Especializado",
    "07" => "Consultorio",
    "15" => "Unidade Mista",
    "20" => "Pronto Socorro Geral",
    "21" => "Pronto Socorro Especializado",
    "22" => "Pronto Atendimento",
    "32" => "Clinica/Centro de Especialidade",
    "36" => "Clinica de Reabilitacao",
    "39" => "Unidade de Apoio Diagnose e Terapia",
    "40" => "Unidade Movel Terrestre",
    "42" => "Unidade Movel Pre-Hospitalar",
    "43" => "Farmacia",
    "50" => "Unidade de Vigilancia em Saude",
    "60" => "Cooperativa de Trabalhadores na Saude",
    "62" => "Hospital Dia",
    "67" => "Laboratório de Saúde Pública",
    "68" => "Secretaria de Saude",
    "69" => "Unidade de Atencao Residencial",
    "70" => "Centro de Atencao Psicossocial",
    "72" => "Centro de Atencao Hemoterapia e Hematologica",
    "73" => "Centro de Atencao a Saúde Indígena",
    "75" => "Telessaude",
    "76" => "Central de Regulacao de Servicos de Saude",
    "77" => "Atencao Domiciliar (Home Care)",
    "79" => "Oficina Ortopedica",
    "80" => "Laboratorio de Saude Publica",
    "81" => "Laboratorio de Saude Publica",
    "82" => "Centro de Parto Normal",
    "83" => "Polo Academia da Saude",
    "84" => "Farmacia",
    "85" => "Centro de Imunizacao"
  }.freeze

  MANAGEMENT_TYPE_MAP = {
    "M" => "Municipal",
    "E" => "Estadual",
    "D" => "Dupla",
    "S" => "Sem Gestao"
  }.freeze

  REFERENCE_CATEGORIES = {
    "hospital_infeccao" => {
      label: "Hospital de Infecção",
      service_codes: [ SpecializedService::HIV_AIDS_CODE, SpecializedService::TUBERCULOSIS_CODE ],
      match: :all
    },
    "referencia_cardiovascular" => {
      label: "Referência Cardiovascular",
      service_codes: [ SpecializedService::CARDIOLOGY_CODE ],
      match: :any
    },
    "referencia_oncologica" => {
      label: "Referência Oncológica",
      service_codes: [ SpecializedService::ONCOLOGY_CODE ],
      match: :any
    },
    "referencia_trauma" => {
      label: "Referência Trauma/Ortopedia",
      service_codes: [ SpecializedService::TRAUMA_CODE ],
      match: :any
    },
    "hospital_ensino" => {
      label: "Hospital de Ensino",
      column: :is_teaching_hospital
    }
  }.freeze

  scope :active, -> { where(is_active: true) }
  scope :sus_only, -> { where(is_sus: true) }
  scope :by_type, ->(code) { where(establishment_type_code: code) }
  LEGAL_NATURE_PREFIXES = {
    "publica"          => "1",
    "privada"          => "2",
    "sem_fins_lucrativos" => "3",
    "pessoa_fisica"    => "4"
  }.freeze

  scope :by_legal_nature, ->(category) {
    prefix = LEGAL_NATURE_PREFIXES[category]
    prefix ? where("legal_nature_code LIKE ?", "#{prefix}%") : none
  }
  scope :by_management, ->(type) { where(management_type: type) }
  scope :in_neighborhood, ->(neighborhood_id) { where(neighborhood_id: neighborhood_id) }
  scope :with_service, ->(service_code) do
    joins(establishment_services: :specialized_service)
      .where(specialized_services: { code: service_code })
  end
  scope :with_equipment, ->(equipment_code) do
    joins(establishment_equipments: :equipment_item)
      .where(equipment_items: { code: equipment_code })
  end

  scope :by_reference_category, ->(category_key) {
    config = REFERENCE_CATEGORIES[category_key]
    return none unless config

    if config[:column]
      where(config[:column] => true)
    elsif config[:match] == :all
      joins(establishment_services: :specialized_service)
        .where(specialized_services: { code: config[:service_codes] })
        .group(:id)
        .having("COUNT(DISTINCT specialized_services.code) = ?", config[:service_codes].length)
    else
      joins(establishment_services: :specialized_service)
        .where(specialized_services: { code: config[:service_codes] })
    end
  }

  scope :by_reference_categories, ->(keys) {
    keys = Array(keys)
    return by_reference_category(keys.first) if keys.size == 1

    ids = keys.flat_map { |k| by_reference_category(k).pluck(:id) }.uniq
    where(id: ids)
  }

  def reference_categories
    service_codes = specialized_services.pluck(:code)

    REFERENCE_CATEGORIES.filter_map do |key, config|
      if config[:column]
        { key: key, label: config[:label] } if send(config[:column])
      elsif config[:match] == :all
        { key: key, label: config[:label] } if (config[:service_codes] - service_codes).empty?
      else
        { key: key, label: config[:label] } if (config[:service_codes] & service_codes).any?
      end
    end
  end

  def usf?
    establishment_type_code == "02" &&
      establishment_services.joins(:specialized_service)
        .exists?(specialized_services: { code: SpecializedService::ESF_CODE })
  end

  def display_type
    return "USF" if usf?
    ESTABLISHMENT_TYPE_MAP[establishment_type_code] || "Outro"
  end

  def management_name
    MANAGEMENT_TYPE_MAP[management_type] || management_type
  end

  def total_sus_beds
    hospital_beds.sum(:quantity_sus)
  end

  def total_existing_beds
    hospital_beds.sum(:quantity_existing)
  end
end
