class EquipmentType < ApplicationRecord
  has_many :equipment_items, dependent: :destroy

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true

  scope :ordered_by_name, -> { order(:name) }
end
