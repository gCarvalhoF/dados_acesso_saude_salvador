require "rails_helper"

RSpec.describe EquipmentItem, type: :model do
  describe "validations" do
    it "is valid with required attributes" do
      expect(build(:equipment_item)).to be_valid
    end

    it "is invalid without code" do
      expect(build(:equipment_item, code: nil)).not_to be_valid
    end

    it "is invalid without name" do
      expect(build(:equipment_item, name: nil)).not_to be_valid
    end

    it "is invalid with duplicate code" do
      create(:equipment_item, code: "01")
      expect(build(:equipment_item, code: "01")).not_to be_valid
    end
  end

  describe "scopes" do
    it "#by_type filters by equipment type code" do
      type_a = create(:equipment_type, code: "1")
      type_b = create(:equipment_type, code: "2")
      item_a = create(:equipment_item, equipment_type: type_a)
      item_b = create(:equipment_item, equipment_type: type_b)

      expect(EquipmentItem.by_type("1")).to include(item_a)
      expect(EquipmentItem.by_type("1")).not_to include(item_b)
    end
  end
end
