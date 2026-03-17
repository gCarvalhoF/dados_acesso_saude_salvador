class EstablishmentEquipment < ApplicationRecord
  belongs_to :health_establishment
  belongs_to :equipment_item

  validates :health_establishment, presence: true
  validates :equipment_item, presence: true
  validates :health_establishment_id, uniqueness: { scope: :equipment_item_id }
  validates :quantity_existing, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :quantity_in_use, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :available_sus, -> { where(available_sus: true) }
  scope :with_existing, -> { where("quantity_existing > 0") }
end
