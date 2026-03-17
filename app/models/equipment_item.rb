class EquipmentItem < ApplicationRecord
  belongs_to :equipment_type
  has_many :establishment_equipments, dependent: :destroy
  has_many :health_establishments, through: :establishment_equipments

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true

  scope :ordered_by_name, -> { order(:name) }
  scope :by_type, ->(type_code) { joins(:equipment_type).where(equipment_types: { code: type_code }) }
end
