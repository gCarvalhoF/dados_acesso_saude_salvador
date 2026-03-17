require "rails_helper"

RSpec.describe "Api::V1::Dashboard", type: :request do
  describe "GET /api/v1/dashboard/overview" do
    before do
      create(:health_establishment, is_active: true, is_sus: true)
      create(:health_establishment, is_active: true, is_sus: false)
      create(:health_establishment, :inactive, is_sus: true)
    end

    it "returns 200" do
      get "/api/v1/dashboard/overview"
      expect(response).to have_http_status(:ok)
    end

    it "returns establishment totals" do
      get "/api/v1/dashboard/overview"
      json = JSON.parse(response.body)
      expect(json["establishments"]["total"]).to eq(2)
      expect(json["establishments"]["sus"]).to eq(1)
    end

    it "includes establishments_by_type" do
      get "/api/v1/dashboard/overview"
      json = JSON.parse(response.body)
      expect(json["establishments"]["by_type"]).to be_an(Array)
    end

    it "returns beds totals" do
      est = create(:health_establishment, is_active: true)
      create(:hospital_bed, health_establishment: est, quantity_existing: 10, quantity_sus: 8)

      get "/api/v1/dashboard/overview"
      json = JSON.parse(response.body)
      expect(json["beds"]["total_sus"]).to be >= 8
      expect(json["beds"]["total_existing"]).to be >= 10
    end

    it "returns neighborhood counts" do
      create(:neighborhood, population_total: 5000)
      create(:neighborhood, population_total: nil)

      get "/api/v1/dashboard/overview"
      json = JSON.parse(response.body)
      expect(json["neighborhoods"]["total"]).to be >= 2
      expect(json["neighborhoods"]["with_data"]).to be >= 1
    end
  end

  describe "GET /api/v1/dashboard/equipment_by_neighborhood" do
    it "returns 200 with data array" do
      get "/api/v1/dashboard/equipment_by_neighborhood"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to have_key("data")
      expect(json["data"]).to be_an(Array)
    end

    it "aggregates equipment quantities by neighborhood" do
      neighborhood = create(:neighborhood, name: "Pituba")
      est = create(:health_establishment, neighborhood: neighborhood)
      eq_item = create(:equipment_item)
      create(:establishment_equipment, health_establishment: est, equipment_item: eq_item, quantity_existing: 3)

      get "/api/v1/dashboard/equipment_by_neighborhood"

      json = JSON.parse(response.body)
      row = json["data"].find { |r| r["neighborhood"] == "Pituba" }
      expect(row).not_to be_nil
      expect(row["total_equipments"]).to eq(3)
    end
  end

  describe "GET /api/v1/dashboard/service_summary" do
    it "returns 200 with data array" do
      get "/api/v1/dashboard/service_summary"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to have_key("data")
      expect(json["data"]).to be_an(Array)
    end

    it "counts distinct establishments per service" do
      service = create(:specialized_service, code: "116", name: "Cardiologia")
      est1 = create(:health_establishment)
      est2 = create(:health_establishment)
      create(:establishment_service, health_establishment: est1, specialized_service: service)
      create(:establishment_service, health_establishment: est2, specialized_service: service,
             classification_code: "002")

      get "/api/v1/dashboard/service_summary"

      json = JSON.parse(response.body)
      row = json["data"].find { |r| r["code"] == "116" }
      expect(row).not_to be_nil
      expect(row["establishments_count"]).to eq(2)
    end
  end
end
