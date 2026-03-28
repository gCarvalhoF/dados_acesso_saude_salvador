module Api
  module V1
    class FilterOptionsController < ApplicationController
      def index
        render json: {
          establishment_types: establishment_type_options,
          legal_natures: legal_nature_options,
          management_types: management_type_options,
          equipment_items: equipment_item_options,
          specialized_services: specialized_service_options
        }
      end

      private

      def establishment_type_options
        options = HealthEstablishment::ESTABLISHMENT_TYPE_MAP
          .map { |code, label| { value: code, label: label } }
          .sort_by { |opt| opt[:label] }

        [ { value: "", label: "Todos os tipos" } ] + options
      end

      def legal_nature_options
        options = HealthEstablishment::LEGAL_NATURE_PREFIXES
          .map { |key, _| { value: key, label: legal_nature_label(key) } }

        [ { value: "", label: "Todas" } ] + options
      end

      def management_type_options
        options = HealthEstablishment::MANAGEMENT_TYPE_MAP
          .map { |type, label| { value: type, label: label } }

        [ { value: "", label: "Todos" } ] + options
      end

      def equipment_item_options
        options = EquipmentItem.ordered_by_name.pluck(:code, :name)
          .map { |code, name| { value: code, label: name } }

        [ { value: "", label: "Todos os equipamentos" } ] + options
      end

      def specialized_service_options
        options = SpecializedService.ordered_by_name.pluck(:code, :name)
          .map { |code, name| { value: code, label: name } }

        [ { value: "", label: "Todos os serviços" } ] + options
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
