require "rails_helper"

RSpec.describe DataImport::CnesImporter do
  subject(:importer) { described_class.new(use_fixtures: true) }

  describe ".call" do
    it "imports equipment types from CSV" do
      expect { importer.call }
        .to change(EquipmentType, :count).by_at_least(1)
    end

    it "imports equipment items from CSV" do
      expect { importer.call }
        .to change(EquipmentItem, :count).by_at_least(1)
    end

    it "imports specialized services from CSV" do
      expect { importer.call }
        .to change(SpecializedService, :count).by_at_least(1)
    end

    it "imports health establishments for Salvador" do
      expect { importer.call }
        .to change(HealthEstablishment, :count).by_at_least(1)
    end

    it "all imported establishments have a cnes_code" do
      importer.call
      expect(HealthEstablishment.where(cnes_code: [nil, ""]).count).to eq(0)
    end

    it "is idempotent (does not duplicate on re-run)" do
      importer.call
      counts = {
        equipment_types: EquipmentType.count,
        equipment_items: EquipmentItem.count,
        services: SpecializedService.count,
        establishments: HealthEstablishment.count
      }

      importer.call

      expect(EquipmentType.count).to eq(counts[:equipment_types])
      expect(EquipmentItem.count).to eq(counts[:equipment_items])
      expect(SpecializedService.count).to eq(counts[:services])
      expect(HealthEstablishment.count).to eq(counts[:establishments])
    end
  end
end
