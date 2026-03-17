class HospitalBed < ApplicationRecord
  belongs_to :health_establishment

  validates :health_establishment, presence: true
  validates :quantity_existing, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :quantity_sus, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :sus_beds, -> { where("quantity_sus > 0") }
  scope :by_type, ->(type_code) { where(bed_type_code: type_code) }
end
