require "rails_helper"

RSpec.describe Neighborhood, type: :model do
  describe "validations" do
    it "is valid with a name" do
      expect(build(:neighborhood)).to be_valid
    end

    it "is invalid without a name" do
      expect(build(:neighborhood, name: nil)).not_to be_valid
    end

    it "is invalid with a duplicate name" do
      create(:neighborhood, name: "Pituba")
      expect(build(:neighborhood, name: "Pituba")).not_to be_valid
    end
  end

  describe "associations" do
    it "has many health_establishments" do
      neighborhood = create(:neighborhood)
      establishment = create(:health_establishment, neighborhood: neighborhood)
      expect(neighborhood.health_establishments).to include(establishment)
    end
  end

  describe "scopes" do
    it "#with_population returns neighborhoods with population data" do
      with_pop = create(:neighborhood, population_total: 5000)
      without_pop = create(:neighborhood, population_total: nil)
      expect(Neighborhood.with_population).to include(with_pop)
      expect(Neighborhood.with_population).not_to include(without_pop)
    end

    it "#ordered_by_name returns alphabetically sorted neighborhoods" do
      create(:neighborhood, name: "Zeta")
      create(:neighborhood, name: "Alpha")
      expect(Neighborhood.ordered_by_name.first.name).to eq("Alpha")
      expect(Neighborhood.ordered_by_name.last.name).to eq("Zeta")
    end
  end

  describe "#establishments_count" do
    it "counts only active establishments" do
      neighborhood = create(:neighborhood)
      create(:health_establishment, neighborhood: neighborhood, is_active: true)
      create(:health_establishment, neighborhood: neighborhood, is_active: false)
      expect(neighborhood.establishments_count).to eq(1)
    end
  end

  describe "#sus_beds_count" do
    it "sums SUS beds across all establishments" do
      neighborhood = create(:neighborhood)
      est = create(:health_establishment, neighborhood: neighborhood)
      create(:hospital_bed, health_establishment: est, quantity_sus: 5)
      create(:hospital_bed, health_establishment: est, quantity_sus: 3)
      expect(neighborhood.sus_beds_count).to eq(8)
    end
  end
end
