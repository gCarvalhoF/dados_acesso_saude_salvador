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
    "62" => "Hospital Dia",
    "67" => "Laboratório de Saúde Pública",
    "70" => "Centro de Atencao Psicossocial",
    "72" => "Centro de Atencao Hemoterapia e Hematologica",
    "73" => "Centro de Atencao a Saúde Indígena",
    "76" => "Central de Regulacao de Servicos de Saude",
    "79" => "Oficina Ortopedica",
    "81" => "Laboratorio de Saude Publica",
    "84" => "Farmacia"
  }.freeze

  MANAGEMENT_TYPE_MAP = {
    "M" => "Municipal",
    "E" => "Estadual",
    "D" => "Dupla",
    "S" => "Sem Gestao"
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
