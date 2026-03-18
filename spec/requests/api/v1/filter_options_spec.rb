require "rails_helper"

RSpec.describe "Api::V1::FilterOptions", type: :request do
  describe "GET /api/v1/filter_options" do
    it "returns the expected top-level keys" do
      get "/api/v1/filter_options"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.keys).to contain_exactly("establishment_types", "legal_natures", "management_types")
    end

    it "each option has value and label" do
      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      json.each_value do |options|
        options.each do |opt|
          expect(opt).to include("value", "label")
        end
      end
    end

    it "always includes the catch-all options" do
      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      expect(json["establishment_types"].first).to eq("value" => "", "label" => "Todos os tipos")
      expect(json["legal_natures"].first).to eq("value" => "", "label" => "Todas")
      expect(json["management_types"].first).to eq("value" => "", "label" => "Todos")
    end

    it "returns all establishment types regardless of database contents" do
      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      values = json["establishment_types"].map { |o| o["value"] }
      expect(values).to include(*HealthEstablishment::ESTABLISHMENT_TYPE_MAP.keys)
    end

    it "returns all management types regardless of database contents" do
      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      values = json["management_types"].map { |o| o["value"] }
      expect(values).to include(*HealthEstablishment::MANAGEMENT_TYPE_MAP.keys)
    end

    it "returns all legal natures regardless of database contents" do
      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      values = json["legal_natures"].map { |o| o["value"] }
      expect(values).to include(*HealthEstablishment::LEGAL_NATURE_PREFIXES.keys)
    end

    it "maps establishment type codes to human-readable labels" do
      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      hospital = json["establishment_types"].find { |o| o["value"] == "01" }
      expect(hospital["label"]).to eq("Hospital Geral")
    end

    it "maps legal nature keys to human-readable labels" do
      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      labels = json["legal_natures"].map { |o| o["label"] }
      expect(labels).to include("Pública", "Privada", "Sem Fins Lucrativos", "Pessoa Física")
    end

    it "sorts establishment types alphabetically" do
      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      labels = json["establishment_types"].map { |o| o["label"] }.drop(1) # skip catch-all
      expect(labels).to eq(labels.sort)
    end
  end
end
