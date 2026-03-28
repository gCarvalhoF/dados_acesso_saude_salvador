require "rails_helper"

RSpec.describe HealthEstablishment, type: :model do
  describe "validations" do
    it "is valid with required attributes" do
      expect(build(:health_establishment)).to be_valid
    end

    it "is invalid without cnes_code" do
      expect(build(:health_establishment, cnes_code: nil)).not_to be_valid
    end

    it "is invalid without name" do
      expect(build(:health_establishment, name: nil)).not_to be_valid
    end

    it "is invalid with a duplicate cnes_code" do
      create(:health_establishment, cnes_code: "1234567")
      expect(build(:health_establishment, cnes_code: "1234567")).not_to be_valid
    end
  end

  describe "scopes" do
    it "#active returns only active establishments" do
      active = create(:health_establishment, is_active: true)
      inactive = create(:health_establishment, is_active: false)
      expect(HealthEstablishment.active).to include(active)
      expect(HealthEstablishment.active).not_to include(inactive)
    end

    it "#sus_only returns only SUS establishments" do
      sus = create(:health_establishment, is_sus: true)
      non_sus = create(:health_establishment, is_sus: false)
      expect(HealthEstablishment.sus_only).to include(sus)
      expect(HealthEstablishment.sus_only).not_to include(non_sus)
    end

    it "#by_type filters by establishment type code" do
      ubs = create(:health_establishment, establishment_type_code: "02")
      hospital = create(:health_establishment, :hospital)
      expect(HealthEstablishment.by_type("02")).to include(ubs)
      expect(HealthEstablishment.by_type("02")).not_to include(hospital)
    end

    it "#by_management filters by management type" do
      municipal = create(:health_establishment, management_type: "M")
      estadual = create(:health_establishment, management_type: "E")
      expect(HealthEstablishment.by_management("M")).to include(municipal)
      expect(HealthEstablishment.by_management("M")).not_to include(estadual)
    end

    it "#with_service filters by service code" do
      service = create(:specialized_service, code: "116")
      est_with = create(:health_establishment)
      est_without = create(:health_establishment)
      create(:establishment_service, health_establishment: est_with, specialized_service: service)

      expect(HealthEstablishment.with_service("116")).to include(est_with)
      expect(HealthEstablishment.with_service("116")).not_to include(est_without)
    end

    it "#with_equipment filters by equipment code" do
      eq_item = create(:equipment_item, code: "11")
      est_with = create(:health_establishment)
      est_without = create(:health_establishment)
      create(:establishment_equipment, health_establishment: est_with, equipment_item: eq_item)

      expect(HealthEstablishment.with_equipment("11")).to include(est_with)
      expect(HealthEstablishment.with_equipment("11")).not_to include(est_without)
    end
  end

  describe "#usf?" do
    it "returns true when type is 02 and has ESF service" do
      esf = create(:esf_service)
      est = create(:health_establishment, establishment_type_code: "02")
      create(:establishment_service, health_establishment: est, specialized_service: esf)
      expect(est.usf?).to be true
    end

    it "returns false when type is 02 but has no ESF service" do
      est = create(:health_establishment, establishment_type_code: "02")
      expect(est.usf?).to be false
    end

    it "returns false when type is not 02" do
      esf = create(:esf_service)
      est = create(:health_establishment, :hospital)
      create(:establishment_service, health_establishment: est, specialized_service: esf)
      expect(est.usf?).to be false
    end
  end

  describe "#display_type" do
    it "returns USF when establishment is a USF" do
      esf = create(:esf_service)
      est = create(:health_establishment, establishment_type_code: "02")
      create(:establishment_service, health_establishment: est, specialized_service: esf)
      expect(est.display_type).to eq("USF")
    end

    it "returns mapped name for known type codes" do
      est = create(:health_establishment, establishment_type_code: "01")
      expect(est.display_type).to eq("Hospital Geral")
    end

    it "returns Outro for unknown type codes" do
      est = create(:health_establishment, establishment_type_code: "99")
      expect(est.display_type).to eq("Outro")
    end
  end

  describe "#management_name" do
    it "returns the human-readable management type" do
      est = create(:health_establishment, management_type: "M")
      expect(est.management_name).to eq("Municipal")
    end
  end

  describe "#reference_categories" do
    it "returns empty array when no matching services or flags" do
      est = create(:health_establishment)
      expect(est.reference_categories).to eq([])
    end

    it "returns Hospital de Infecção when both HIV/AIDS and Tuberculosis services present" do
      est = create(:health_establishment, :with_infection_services)
      categories = est.reference_categories
      expect(categories.map { |c| c[:key] }).to include("hospital_infeccao")
      expect(categories.find { |c| c[:key] == "hospital_infeccao" }[:label]).to eq("Hospital de Infecção")
    end

    it "does not return Hospital de Infecção when only one infection service present" do
      hiv = create(:specialized_service, code: SpecializedService::HIV_AIDS_CODE, name: "DST/HIV/AIDS")
      est = create(:health_establishment)
      create(:establishment_service, health_establishment: est, specialized_service: hiv)
      expect(est.reference_categories.map { |c| c[:key] }).not_to include("hospital_infeccao")
    end

    it "returns Referência Cardiovascular with cardiology service" do
      est = create(:health_establishment, :with_cardiology)
      expect(est.reference_categories.map { |c| c[:key] }).to include("referencia_cardiovascular")
    end

    it "returns Referência Oncológica with oncology service" do
      est = create(:health_establishment, :with_oncology)
      expect(est.reference_categories.map { |c| c[:key] }).to include("referencia_oncologica")
    end

    it "returns Referência Trauma/Ortopedia with trauma service" do
      est = create(:health_establishment, :with_trauma)
      expect(est.reference_categories.map { |c| c[:key] }).to include("referencia_trauma")
    end

    it "returns Hospital de Ensino when is_teaching_hospital is true" do
      est = create(:health_establishment, :teaching_hospital)
      expect(est.reference_categories.map { |c| c[:key] }).to include("hospital_ensino")
    end

    it "returns multiple categories when applicable" do
      est = create(:health_establishment, :teaching_hospital, :with_cardiology)
      keys = est.reference_categories.map { |c| c[:key] }
      expect(keys).to include("hospital_ensino", "referencia_cardiovascular")
    end
  end

  describe ".by_reference_category" do
    it "filters by hospital_infeccao (requires both services)" do
      est_with = create(:health_establishment, :with_infection_services)
      est_without = create(:health_establishment)
      results = HealthEstablishment.by_reference_category("hospital_infeccao")
      expect(results).to include(est_with)
      expect(results).not_to include(est_without)
    end

    it "filters by referencia_cardiovascular" do
      est_with = create(:health_establishment, :with_cardiology)
      est_without = create(:health_establishment)
      results = HealthEstablishment.by_reference_category("referencia_cardiovascular")
      expect(results).to include(est_with)
      expect(results).not_to include(est_without)
    end

    it "filters by referencia_oncologica" do
      est_with = create(:health_establishment, :with_oncology)
      est_without = create(:health_establishment)
      results = HealthEstablishment.by_reference_category("referencia_oncologica")
      expect(results).to include(est_with)
      expect(results).not_to include(est_without)
    end

    it "filters by referencia_trauma" do
      est_with = create(:health_establishment, :with_trauma)
      est_without = create(:health_establishment)
      results = HealthEstablishment.by_reference_category("referencia_trauma")
      expect(results).to include(est_with)
      expect(results).not_to include(est_without)
    end

    it "filters by hospital_ensino" do
      est_with = create(:health_establishment, :teaching_hospital)
      est_without = create(:health_establishment)
      results = HealthEstablishment.by_reference_category("hospital_ensino")
      expect(results).to include(est_with)
      expect(results).not_to include(est_without)
    end

    it "returns none for unknown category" do
      create(:health_establishment)
      expect(HealthEstablishment.by_reference_category("unknown")).to be_empty
    end
  end

  describe ".by_reference_categories" do
    it "returns union of multiple categories" do
      est_cardio = create(:health_establishment, :with_cardiology)
      est_ensino = create(:health_establishment, :teaching_hospital)
      est_plain = create(:health_establishment)

      results = HealthEstablishment.by_reference_categories(%w[referencia_cardiovascular hospital_ensino])
      expect(results).to include(est_cardio, est_ensino)
      expect(results).not_to include(est_plain)
    end

    it "delegates to by_reference_category for a single key" do
      est_cardio = create(:health_establishment, :with_cardiology)
      est_plain = create(:health_establishment)

      results = HealthEstablishment.by_reference_categories(%w[referencia_cardiovascular])
      expect(results).to include(est_cardio)
      expect(results).not_to include(est_plain)
    end
  end

  describe "#total_sus_beds" do
    it "sums quantity_sus across all hospital beds" do
      est = create(:health_establishment)
      create(:hospital_bed, health_establishment: est, quantity_sus: 10)
      create(:hospital_bed, health_establishment: est, quantity_sus: 5)
      expect(est.total_sus_beds).to eq(15)
    end
  end

  describe "#total_existing_beds" do
    it "sums quantity_existing across all hospital beds" do
      est = create(:health_establishment)
      create(:hospital_bed, health_establishment: est, quantity_existing: 20)
      create(:hospital_bed, health_establishment: est, quantity_existing: 10)
      expect(est.total_existing_beds).to eq(30)
    end
  end
end
