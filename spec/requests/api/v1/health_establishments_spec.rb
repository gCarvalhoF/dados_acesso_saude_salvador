require "rails_helper"

RSpec.describe "Api::V1::HealthEstablishments", type: :request do
  describe "GET /api/v1/health_establishments" do
    it "returns a GeoJSON FeatureCollection" do
      create(:health_establishment, name: "UBS Centro")
      create(:health_establishment, name: "Hospital Sul")

      get "/api/v1/health_establishments"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["type"]).to eq("FeatureCollection")
      expect(json["features"].length).to eq(2)
    end

    it "excludes inactive establishments" do
      create(:health_establishment, :inactive)
      active = create(:health_establishment, is_active: true)

      get "/api/v1/health_establishments"

      json = JSON.parse(response.body)
      expect(json["features"].length).to eq(1)
      expect(json["features"][0]["properties"]["cnes_code"]).to eq(active.cnes_code)
    end

    it "filters by type" do
      ubs = create(:health_establishment, establishment_type_code: "02")
      hospital = create(:health_establishment, :hospital)

      get "/api/v1/health_establishments", params: { type: "02" }

      json = JSON.parse(response.body)
      codes = json["features"].map { |f| f["properties"]["cnes_code"] }
      expect(codes).to include(ubs.cnes_code)
      expect(codes).not_to include(hospital.cnes_code)
    end

    it "filters by sus_only" do
      sus = create(:health_establishment, is_sus: true)
      non_sus = create(:health_establishment, is_sus: false)

      get "/api/v1/health_establishments", params: { sus_only: "true" }

      json = JSON.parse(response.body)
      codes = json["features"].map { |f| f["properties"]["cnes_code"] }
      expect(codes).to include(sus.cnes_code)
      expect(codes).not_to include(non_sus.cnes_code)
    end

    it "filters by management type" do
      municipal = create(:health_establishment, management_type: "M")
      estadual = create(:health_establishment, management_type: "E")

      get "/api/v1/health_establishments", params: { management: "M" }

      json = JSON.parse(response.body)
      codes = json["features"].map { |f| f["properties"]["cnes_code"] }
      expect(codes).to include(municipal.cnes_code)
      expect(codes).not_to include(estadual.cnes_code)
    end

    it "filters by neighborhood_id" do
      neighborhood = create(:neighborhood)
      in_hood = create(:health_establishment, neighborhood: neighborhood)
      out_hood = create(:health_establishment, neighborhood: nil)

      get "/api/v1/health_establishments", params: { neighborhood_id: neighborhood.id }

      json = JSON.parse(response.body)
      codes = json["features"].map { |f| f["properties"]["cnes_code"] }
      expect(codes).to include(in_hood.cnes_code)
      expect(codes).not_to include(out_hood.cnes_code)
    end

    it "filters by service code" do
      service = create(:specialized_service, code: "116")
      est_with = create(:health_establishment)
      est_without = create(:health_establishment)
      create(:establishment_service, health_establishment: est_with, specialized_service: service)

      get "/api/v1/health_establishments", params: { service: "116" }

      json = JSON.parse(response.body)
      codes = json["features"].map { |f| f["properties"]["cnes_code"] }
      expect(codes).to include(est_with.cnes_code)
      expect(codes).not_to include(est_without.cnes_code)
    end

    it "filters by equipment code" do
      eq_item = create(:equipment_item, code: "11")
      est_with = create(:health_establishment)
      est_without = create(:health_establishment)
      create(:establishment_equipment, health_establishment: est_with, equipment_item: eq_item)

      get "/api/v1/health_establishments", params: { equipment: "11" }

      json = JSON.parse(response.body)
      codes = json["features"].map { |f| f["properties"]["cnes_code"] }
      expect(codes).to include(est_with.cnes_code)
      expect(codes).not_to include(est_without.cnes_code)
    end

    it "filters by reference_category" do
      est_cardio = create(:health_establishment, :with_cardiology)
      est_plain = create(:health_establishment)

      get "/api/v1/health_establishments", params: { reference_category: "referencia_cardiovascular" }

      json = JSON.parse(response.body)
      codes = json["features"].map { |f| f["properties"]["cnes_code"] }
      expect(codes).to include(est_cardio.cnes_code)
      expect(codes).not_to include(est_plain.cnes_code)
    end

    it "filters by comma-separated type codes" do
      hospital = create(:health_establishment, establishment_type_code: "01")
      ubs = create(:health_establishment, establishment_type_code: "02")
      caps = create(:health_establishment, establishment_type_code: "70")

      get "/api/v1/health_establishments", params: { type: "01,02" }

      json = JSON.parse(response.body)
      codes = json["features"].map { |f| f["properties"]["cnes_code"] }
      expect(codes).to include(hospital.cnes_code, ubs.cnes_code)
      expect(codes).not_to include(caps.cnes_code)
    end

    it "filters by comma-separated management types" do
      municipal = create(:health_establishment, management_type: "M")
      estadual = create(:health_establishment, management_type: "E")
      dupla = create(:health_establishment, management_type: "D")

      get "/api/v1/health_establishments", params: { management: "M,E" }

      json = JSON.parse(response.body)
      codes = json["features"].map { |f| f["properties"]["cnes_code"] }
      expect(codes).to include(municipal.cnes_code, estadual.cnes_code)
      expect(codes).not_to include(dupla.cnes_code)
    end

    it "filters by comma-separated reference categories" do
      est_cardio = create(:health_establishment, :with_cardiology)
      est_ensino = create(:health_establishment, :teaching_hospital)
      est_plain = create(:health_establishment)

      get "/api/v1/health_establishments", params: { reference_category: "referencia_cardiovascular,hospital_ensino" }

      json = JSON.parse(response.body)
      codes = json["features"].map { |f| f["properties"]["cnes_code"] }
      expect(codes).to include(est_cardio.cnes_code, est_ensino.cnes_code)
      expect(codes).not_to include(est_plain.cnes_code)
    end

    it "includes reference_categories in properties" do
      create(:health_establishment, :with_cardiology)

      get "/api/v1/health_establishments"

      json = JSON.parse(response.body)
      props = json["features"][0]["properties"]
      expect(props["reference_categories"]).to include("Referência Cardiovascular")
    end
  end

  describe "GET /api/v1/health_establishments/:id" do
    it "returns detailed establishment feature" do
      est = create(:health_establishment, name: "UBS Pituba")
      eq_item = create(:equipment_item, code: "02", name: "Mamografo")
      service = create(:specialized_service, code: "116", name: "Cardiologia")
      create(:establishment_equipment, health_establishment: est, equipment_item: eq_item, quantity_existing: 2)
      create(:establishment_service, health_establishment: est, specialized_service: service)
      create(:hospital_bed, health_establishment: est, quantity_sus: 5)

      get "/api/v1/health_establishments/#{est.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["type"]).to eq("Feature")
      expect(json["properties"]["name"]).to eq("UBS Pituba")
      expect(json["properties"]["equipments"].length).to eq(1)
      expect(json["properties"]["equipments"][0]["name"]).to eq("Mamografo")
      expect(json["properties"]["services"].length).to eq(1)
      expect(json["properties"]["services"][0]["code"]).to eq("116")
      expect(json["properties"]["beds"]["total_sus"]).to eq(5)
    end

    it "returns 404 for unknown id" do
      get "/api/v1/health_establishments/999999"
      expect(response).to have_http_status(:not_found)
    end
  end
end
