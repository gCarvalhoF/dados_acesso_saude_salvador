class Neighborhood < ApplicationRecord
  has_many :health_establishments, dependent: :nullify

  validates :name, presence: true

  scope :with_population, -> { where.not(population_total: nil) }
  scope :ordered_by_name, -> { order(:name) }

  def equipment_count
    health_establishments.joins(:establishment_equipments).sum("establishment_equipments.quantity_existing")
  end

  def establishments_count
    health_establishments.active.count
  end

  def sus_beds_count
    health_establishments.joins(:hospital_beds).sum("hospital_beds.quantity_sus")
  end
end
