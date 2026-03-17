require "rails_helper"

RSpec.describe EstablishmentEquipment, type: :model do
  describe "validations" do
    it "is valid with required attributes" do
      expect(build(:establishment_equipment)).to be_valid
    end

    it "is invalid without health_establishment" do
      expect(build(:establishment_equipment, health_establishment: nil)).not_to be_valid
    end

    it "is invalid without equipment_item" do
      expect(build(:establishment_equipment, equipment_item: nil)).not_to be_valid
    end

    it "is invalid with duplicate health_establishment + equipment_item" do
      existing = create(:establishment_equipment)
      duplicate = build(:establishment_equipment,
                        health_establishment: existing.health_establishment,
                        equipment_item: existing.equipment_item)
      expect(duplicate).not_to be_valid
    end

    it "is invalid with negative quantity_existing" do
      expect(build(:establishment_equipment, quantity_existing: -1)).not_to be_valid
    end
  end

  describe "scopes" do
    it "#available_sus returns only SUS-available equipment" do
      sus = create(:establishment_equipment, available_sus: true)
      non_sus = create(:establishment_equipment, available_sus: false)
      expect(EstablishmentEquipment.available_sus).to include(sus)
      expect(EstablishmentEquipment.available_sus).not_to include(non_sus)
    end

    it "#with_existing returns only records with quantity_existing > 0" do
      with_eq = create(:establishment_equipment, quantity_existing: 2)
      without_eq = create(:establishment_equipment, quantity_existing: 0)
      expect(EstablishmentEquipment.with_existing).to include(with_eq)
      expect(EstablishmentEquipment.with_existing).not_to include(without_eq)
    end
  end
end
