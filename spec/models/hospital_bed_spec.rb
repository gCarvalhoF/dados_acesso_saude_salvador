require "rails_helper"

RSpec.describe HospitalBed, type: :model do
  describe "validations" do
    it "is valid with required attributes" do
      expect(build(:hospital_bed)).to be_valid
    end

    it "is invalid without health_establishment" do
      expect(build(:hospital_bed, health_establishment: nil)).not_to be_valid
    end

    it "is invalid with negative quantity_existing" do
      expect(build(:hospital_bed, quantity_existing: -1)).not_to be_valid
    end

    it "is invalid with negative quantity_sus" do
      expect(build(:hospital_bed, quantity_sus: -1)).not_to be_valid
    end
  end

  describe "scopes" do
    it "#sus_beds returns beds with quantity_sus > 0" do
      sus = create(:hospital_bed, quantity_sus: 5)
      non_sus = create(:hospital_bed, quantity_sus: 0)
      expect(HospitalBed.sus_beds).to include(sus)
      expect(HospitalBed.sus_beds).not_to include(non_sus)
    end

    it "#by_type filters by bed_type_code" do
      type_1 = create(:hospital_bed, bed_type_code: "01")
      type_2 = create(:hospital_bed, bed_type_code: "02")
      expect(HospitalBed.by_type("01")).to include(type_1)
      expect(HospitalBed.by_type("01")).not_to include(type_2)
    end
  end
end
