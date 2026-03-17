class SpecializedService < ApplicationRecord
  has_many :establishment_services, dependent: :destroy
  has_many :health_establishments, through: :establishment_services

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true

  # Well-known service codes
  ESF_CODE = "101"
  CARDIOLOGY_CODE = "116"
  ONCOLOGY_CODE = "132"
  HIV_AIDS_CODE = "106"
  TUBERCULOSIS_CODE = "111"
  TRAUMA_CODE = "155"

  scope :ordered_by_name, -> { order(:name) }

  def self.esf
    find_by(code: ESF_CODE)
  end
end
