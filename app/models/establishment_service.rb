class EstablishmentService < ApplicationRecord
  belongs_to :health_establishment
  belongs_to :specialized_service

  validates :health_establishment, presence: true
  validates :specialized_service, presence: true
  validates :health_establishment_id,
            uniqueness: { scope: [ :specialized_service_id, :classification_code ] }

  scope :ambulatorial_sus, -> { where(ambulatorial_sus: true) }
  scope :hospitalar_sus, -> { where(hospitalar_sus: true) }
  scope :any_sus, -> { where(ambulatorial_sus: true).or(where(hospitalar_sus: true)) }
end
