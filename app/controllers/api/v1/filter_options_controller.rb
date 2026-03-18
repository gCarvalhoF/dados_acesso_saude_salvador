module Api
  module V1
    class FilterOptionsController < ApplicationController
      def index
        render json: {
          establishment_types: establishment_type_options,
          legal_natures: legal_nature_options,
          management_types: management_type_options
        }
      end

      private

      def establishment_type_options
        existing_codes = HealthEstablishment.active
          .distinct
          .pluck(:establishment_type_code)
          .to_set

        options = HealthEstablishment::ESTABLISHMENT_TYPE_MAP
          .select { |code, _| existing_codes.include?(code) }
          .map { |code, label| { value: code, label: label } }
          .sort_by { |opt| opt[:label] }

        [ { value: "", label: "Todos os tipos" } ] + options
      end

      def legal_nature_options
        existing_prefixes = HealthEstablishment.active
          .distinct
          .pluck(:legal_nature_code)
          .compact
          .map { |code| code[0] }
          .to_set

        options = HealthEstablishment::LEGAL_NATURE_PREFIXES
          .select { |_, prefix| existing_prefixes.include?(prefix) }
          .map { |key, _| { value: key, label: legal_nature_label(key) } }

        [ { value: "", label: "Todas" } ] + options
      end

      def management_type_options
        existing_types = HealthEstablishment.active
          .distinct
          .pluck(:management_type)
          .compact
          .to_set

        options = HealthEstablishment::MANAGEMENT_TYPE_MAP
          .select { |type, _| existing_types.include?(type) }
          .map { |type, label| { value: type, label: label } }

        [ { value: "", label: "Todos" } ] + options
      end

      def legal_nature_label(key)
        {
          "publica"             => "Pública",
          "privada"             => "Privada",
          "sem_fins_lucrativos" => "Sem Fins Lucrativos",
          "pessoa_fisica"       => "Pessoa Física"
        }.fetch(key, key)
      end
    end
  end
end
