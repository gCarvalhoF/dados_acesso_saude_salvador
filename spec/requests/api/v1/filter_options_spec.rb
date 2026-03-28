require "rails_helper"

RSpec.describe "Api::V1::FilterOptions", type: :request do
  describe "GET /api/v1/filter_options" do
    it "returns the expected top-level keys" do
      get "/api/v1/filter_options"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.keys).to contain_exactly(
        "establishment_types", "legal_natures", "management_types",
        "equipment_items", "specialized_services", "reference_categories"
      )
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
      expect(json["reference_categories"].first).to eq("value" => "", "label" => "Todas as referências")
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
      labels = json["establishment_types"].map { |o| o["label"] }.drop(2) # skip catch-all and preset
      expect(labels).to eq(labels.sort)
    end

    describe "equipment_items" do
      it "includes a catch-all option as the first element" do
        get "/api/v1/filter_options"

        json = JSON.parse(response.body)
        expect(json["equipment_items"].first).to eq("value" => "", "label" => "Todos os equipamentos")
      end

      it "returns equipment items from the database" do
        create(:equipment_item, code: "EQ01", name: "Mamografo")
        create(:equipment_item, code: "EQ02", name: "Tomografo")

        get "/api/v1/filter_options"

        json = JSON.parse(response.body)
        values = json["equipment_items"].map { |o| o["value"] }
        expect(values).to include("EQ01", "EQ02")
      end

      it "sorts equipment items alphabetically by name" do
        create(:equipment_item, code: "EQ01", name: "Tomografo")
        create(:equipment_item, code: "EQ02", name: "Mamografo")

        get "/api/v1/filter_options"

        json = JSON.parse(response.body)
        labels = json["equipment_items"].map { |o| o["label"] }.drop(1)
        expect(labels).to eq(labels.sort)
      end

      it "each option has value and label" do
        create(:equipment_item)

        get "/api/v1/filter_options"

        json = JSON.parse(response.body)
        json["equipment_items"].each do |opt|
          expect(opt).to include("value", "label")
        end
      end
    end

    describe "specialized_services" do
      it "includes a catch-all option as the first element" do
        get "/api/v1/filter_options"

        json = JSON.parse(response.body)
        expect(json["specialized_services"].first).to eq("value" => "", "label" => "Todos os serviços")
      end

      it "returns specialized services from the database" do
        create(:specialized_service, code: "116", name: "Cardiologia")
        create(:specialized_service, code: "132", name: "Oncologia")

        get "/api/v1/filter_options"

        json = JSON.parse(response.body)
        values = json["specialized_services"].map { |o| o["value"] }
        expect(values).to include("116", "132")
      end

      it "sorts services alphabetically by name" do
        create(:specialized_service, code: "132", name: "Oncologia")
        create(:specialized_service, code: "116", name: "Cardiologia")

        get "/api/v1/filter_options"

        json = JSON.parse(response.body)
        labels = json["specialized_services"].map { |o| o["label"] }.drop(1)
        expect(labels).to eq(labels.sort)
      end

      it "each option has value and label" do
        create(:specialized_service)

        get "/api/v1/filter_options"

        json = JSON.parse(response.body)
        json["specialized_services"].each do |opt|
          expect(opt).to include("value", "label")
        end
      end
    end
    describe "reference_categories" do
      it "includes a catch-all option as the first element" do
        get "/api/v1/filter_options"

        json = JSON.parse(response.body)
        expect(json["reference_categories"].first).to eq("value" => "", "label" => "Todas as referências")
      end

      it "returns all reference category options" do
        get "/api/v1/filter_options"

        json = JSON.parse(response.body)
        values = json["reference_categories"].map { |o| o["value"] }
        expect(values).to include(
          "hospital_infeccao", "referencia_cardiovascular",
          "referencia_oncologica", "referencia_trauma", "hospital_ensino"
        )
      end

      it "each option has value and label" do
        get "/api/v1/filter_options"

        json = JSON.parse(response.body)
        json["reference_categories"].each do |opt|
          expect(opt).to include("value", "label")
        end
      end
    end
  end
end
