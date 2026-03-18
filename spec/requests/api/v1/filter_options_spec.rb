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
      create(:health_establishment)

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

    it "returns only establishment types present in active establishments" do
      create(:health_establishment, establishment_type_code: "01")
      create(:health_establishment, establishment_type_code: "22")
      create(:health_establishment, establishment_type_code: "01", is_active: false)

      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      values = json["establishment_types"].map { |o| o["value"] }
      expect(values).to include("01", "22")
      expect(values).not_to include("02")
    end

    it "returns only management types present in active establishments" do
      create(:health_establishment, management_type: "M")
      create(:health_establishment, management_type: "E", is_active: false)

      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      values = json["management_types"].map { |o| o["value"] }
      expect(values).to include("M")
      expect(values).not_to include("E")
    end

    it "returns only legal natures present in active establishments" do
      create(:health_establishment, legal_nature_code: "1244")  # pública (prefix "1")
      create(:health_establishment, legal_nature_code: "2062", is_active: false)  # privada (prefix "2")

      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      values = json["legal_natures"].map { |o| o["value"] }
      expect(values).to include("publica")
      expect(values).not_to include("privada")
    end

    it "maps legal nature codes to human-readable labels" do
      create(:health_establishment, legal_nature_code: "1244")
      create(:health_establishment, legal_nature_code: "2062")
      create(:health_establishment, legal_nature_code: "3069")
      create(:health_establishment, legal_nature_code: "4120")

      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      labels = json["legal_natures"].map { |o| o["label"] }
      expect(labels).to include("Pública", "Privada", "Sem Fins Lucrativos", "Pessoa Física")
    end

    it "maps establishment type codes to human-readable labels" do
      create(:health_establishment, establishment_type_code: "01")

      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      hospital = json["establishment_types"].find { |o| o["value"] == "01" }
      expect(hospital["label"]).to eq("Hospital Geral")
    end

    it "returns empty lists (except catch-all) when there are no active establishments" do
      get "/api/v1/filter_options"

      json = JSON.parse(response.body)
      expect(json["establishment_types"]).to eq([ { "value" => "", "label" => "Todos os tipos" } ])
      expect(json["legal_natures"]).to eq([ { "value" => "", "label" => "Todas" } ])
      expect(json["management_types"]).to eq([ { "value" => "", "label" => "Todos" } ])
    end
  end
end
