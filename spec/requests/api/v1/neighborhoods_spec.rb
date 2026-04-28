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

    it "exposes IBGE administrative codes and area" do
      create(
        :neighborhood,
        name: "Itaigara",
        region_ibge_code: "2",
        region_name: "Nordeste",
        state_ibge_code: "29",
        state_name: "Bahia",
        city_ibge_code: "2927408",
        city_name: "Salvador",
        district_ibge_code: "292740805",
        district_name: "Distrito Sede",
        subdistrict_ibge_code: "29274080501",
        subdistrict_name: "Itaigara",
        neighborhood_ibge_code: "29274080501001",
        area_km2: 1.42
      )

      get "/api/v1/neighborhoods"

      props = JSON.parse(response.body)["features"].find { |f| f["properties"]["name"] == "Itaigara" }["properties"]
      expect(props["region_ibge_code"]).to eq("2")
      expect(props["region_name"]).to eq("Nordeste")
      expect(props["state_ibge_code"]).to eq("29")
      expect(props["state_name"]).to eq("Bahia")
      expect(props["city_ibge_code"]).to eq("2927408")
      expect(props["city_name"]).to eq("Salvador")
      expect(props["district_ibge_code"]).to eq("292740805")
      expect(props["district_name"]).to eq("Distrito Sede")
      expect(props["subdistrict_ibge_code"]).to eq("29274080501")
      expect(props["subdistrict_name"]).to eq("Itaigara")
      expect(props["neighborhood_ibge_code"]).to eq("29274080501001")
      expect(props["area_km2"]).to eq(1.42)
    end

    it "does not expose detailed comparison demographics in the index payload" do
      create(:neighborhood, name: "Itaigara", population_25_to_29: 1234.5, population_male_white: 50.0)

      get "/api/v1/neighborhoods"

      props = JSON.parse(response.body)["features"].find { |f| f["properties"]["name"] == "Itaigara" }["properties"]
      expect(props).not_to have_key("population_25_to_29")
      expect(props).not_to have_key("population_male_white")
      expect(props).not_to have_key("population_asian")
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

    it "exposes detailed demographic columns for the comparison view" do
      n1 = create(
        :neighborhood,
        name: "Pituba",
        population_asian: 12.0,
        population_indigenous: 3.0,
        population_0_to_4: 100.0,
        population_5_to_9: 110.0,
        population_10_to_14: 120.0,
        population_15_to_19: 130.0,
        population_20_to_24: 140.0,
        population_25_to_29: 150.0,
        population_30_to_39: 300.0,
        population_40_to_49: 280.0,
        population_50_to_59: 260.0,
        population_60_to_69: 200.0,
        population_70_or_more: 180.0,
        population_male_white: 100.0,
        population_male_black: 50.0,
        population_male_asian: 5.0,
        population_male_brown: 200.0,
        population_male_indigenous: 1.0,
        population_female_white: 110.0,
        population_female_black: 55.0,
        population_female_asian: 6.0,
        population_female_brown: 210.0,
        population_female_indigenous: 2.0
      )
      n2 = create(:neighborhood, name: "Barra")

      get "/api/v1/neighborhoods/compare", params: { ids: "#{n1.id},#{n2.id}" }

      pituba = JSON.parse(response.body)["neighborhoods"].find { |n| n["name"] == "Pituba" }
      expect(pituba["population_asian"]).to eq(12.0)
      expect(pituba["population_indigenous"]).to eq(3.0)
      expect(pituba["population_25_to_29"]).to eq(150.0)
      expect(pituba["population_70_or_more"]).to eq(180.0)
      expect(pituba["population_male_white"]).to eq(100.0)
      expect(pituba["population_female_indigenous"]).to eq(2.0)
    end
  end
end
