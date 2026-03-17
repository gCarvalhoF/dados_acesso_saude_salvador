require "rails_helper"

RSpec.describe SpecializedService, type: :model do
  describe "validations" do
    it "is valid with required attributes" do
      expect(build(:specialized_service)).to be_valid
    end

    it "is invalid without code" do
      expect(build(:specialized_service, code: nil)).not_to be_valid
    end

    it "is invalid with duplicate code" do
      create(:specialized_service, code: "101")
      expect(build(:specialized_service, code: "101")).not_to be_valid
    end
  end

  describe ".esf" do
    it "returns the ESF service by code" do
      esf = create(:specialized_service, code: SpecializedService::ESF_CODE)
      expect(SpecializedService.esf).to eq(esf)
    end

    it "returns nil when ESF service does not exist" do
      expect(SpecializedService.esf).to be_nil
    end
  end
end
