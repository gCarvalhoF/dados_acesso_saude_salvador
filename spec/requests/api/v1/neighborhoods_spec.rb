require "rails_helper"

RSpec.describe "Api::V1::Neighborhoods", type: :request do
  describe "GET /api/v1/neighborhoods" do
    it "returns a GeoJSON FeatureCollection" do
      create(:neighborhood, name: "Pituba")
      create(:neighborhood, name: "Barra")

      get "/api/v1/neighborhoods"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["type"]).to eq("FeatureCollection")
      expect(json["features"].length).to eq(2)
    end

    it "returns features with expected properties" do
      n = create(:neighborhood, name: "Itaigara", population_total: 20_000)

      get "/api/v1/neighborhoods"

      feature = JSON.parse(response.body)["features"].find { |f| f["properties"]["name"] == "Itaigara" }
      expect(feature).not_to be_nil
      expect(feature["properties"]["population_total"]).to eq(20_000)
      expect(feature["properties"]).to have_key("establishments_count")
    end

    it "includes equipment_count in properties" do
      n = create(:neighborhood, name: "Pituba")

      get "/api/v1/neighborhoods"

      feature = JSON.parse(response.body)["features"].find { |f| f["properties"]["name"] == "Pituba" }
      expect(feature["properties"]).to have_key("equipment_count")
    end

    it "returns the correct equipment_count for a neighborhood" do
      n = create(:neighborhood, name: "Pituba")
      est = create(:health_establishment, neighborhood: n)
      eq_item = create(:equipment_item)
      create(:establishment_equipment, health_establishment: est, equipment_item: eq_item, quantity_existing: 5)

      get "/api/v1/neighborhoods"

      feature = JSON.parse(response.body)["features"].find { |f| f["properties"]["name"] == "Pituba" }
      expect(feature["properties"]["equipment_count"]).to eq(5)
    end

    it "returns 0 equipment_count for a neighborhood without equipment" do
      create(:neighborhood, name: "Vazia")

      get "/api/v1/neighborhoods"

      feature = JSON.parse(response.body)["features"].find { |f| f["properties"]["name"] == "Vazia" }
      expect(feature["properties"]["equipment_count"]).to eq(0)
    end

    it "returns an empty FeatureCollection when no neighborhoods exist" do
      get "/api/v1/neighborhoods"

      json = JSON.parse(response.body)
      expect(json["type"]).to eq("FeatureCollection")
      expect(json["features"]).to be_empty
    end
  end

  describe "GET /api/v1/neighborhoods/:id" do
    it "returns the neighborhood feature" do
      neighborhood = create(:neighborhood, name: "Garcia")

      get "/api/v1/neighborhoods/#{neighborhood.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["type"]).to eq("Feature")
      expect(json["properties"]["name"]).to eq("Garcia")
    end

    it "returns 404 for unknown id" do
      get "/api/v1/neighborhoods/999999"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/neighborhoods/compare" do
    it "returns 200 with neighborhood properties for valid ids" do
      n1 = create(:neighborhood, name: "Pituba", population_total: 50_000)
      n2 = create(:neighborhood, name: "Barra", population_total: 30_000)

      get "/api/v1/neighborhoods/compare", params: { ids: "#{n1.id},#{n2.id}" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["neighborhoods"].length).to eq(2)
      names = json["neighborhoods"].map { |n| n["name"] }
      expect(names).to contain_exactly("Pituba", "Barra")
    end

    it "includes equipment_count for compared neighborhoods" do
      n1 = create(:neighborhood, name: "Pituba")
      n2 = create(:neighborhood, name: "Barra")
      est = create(:health_establishment, neighborhood: n1)
      eq_item = create(:equipment_item)
      create(:establishment_equipment, health_establishment: est, equipment_item: eq_item, quantity_existing: 7)

      get "/api/v1/neighborhoods/compare", params: { ids: "#{n1.id},#{n2.id}" }

      json = JSON.parse(response.body)
      pituba = json["neighborhoods"].find { |n| n["name"] == "Pituba" }
      barra = json["neighborhoods"].find { |n| n["name"] == "Barra" }
      expect(pituba["equipment_count"]).to eq(7)
      expect(barra["equipment_count"]).to eq(0)
    end

    it "returns 422 when fewer than 2 ids are provided" do
      n1 = create(:neighborhood, name: "Pituba")

      get "/api/v1/neighborhoods/compare", params: { ids: n1.id.to_s }

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["error"]).to be_present
    end

    it "returns 422 when no ids are provided" do
      get "/api/v1/neighborhoods/compare"

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "caps at 5 neighborhoods" do
      neighborhoods = create_list(:neighborhood, 7)
      ids = neighborhoods.map(&:id).join(",")

      get "/api/v1/neighborhoods/compare", params: { ids: ids }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["neighborhoods"].length).to be <= 5
    end

    it "deduplicates repeated ids" do
      n1 = create(:neighborhood, name: "Pituba")
      n2 = create(:neighborhood, name: "Barra")

      get "/api/v1/neighborhoods/compare", params: { ids: "#{n1.id},#{n1.id},#{n2.id}" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["neighborhoods"].length).to eq(2)
    end
  end
end
