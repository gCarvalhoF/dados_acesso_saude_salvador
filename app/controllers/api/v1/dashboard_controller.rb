module Api
  module V1
    class DashboardController < ApplicationController
      def overview
        render json: {
          establishments: {
            total: HealthEstablishment.active.count,
            sus: HealthEstablishment.active.sus_only.count,
            by_type: establishments_by_type
          },
          equipments: equipment_summary,
          beds: {
            total_existing: HospitalBed.sum(:quantity_existing),
            total_sus: HospitalBed.sum(:quantity_sus)
          },
          neighborhoods: {
            total: Neighborhood.count,
            with_data: Neighborhood.with_population.count
          }
        }
      end

      def equipment_by_neighborhood
        results = HealthEstablishment
                    .active
                    .where.not(neighborhood_id: nil)
                    .joins(:establishment_equipments)
                    .joins(neighborhood: [])
                    .group("neighborhoods.name", "neighborhoods.id")
                    .sum("establishment_equipments.quantity_existing")
                    .map { |(name, _id), count| { neighborhood: name, total_equipments: count } }
                    .sort_by { |r| -r[:total_equipments] }

        render json: { data: results }
      end

      def service_summary
        results = SpecializedService
                    .joins(:establishment_services)
                    .joins("INNER JOIN health_establishments ON establishment_services.health_establishment_id = health_establishments.id")
                    .where(health_establishments: { is_active: true })
                    .group("specialized_services.code", "specialized_services.name")
                    .count("DISTINCT health_establishments.id")
                    .map { |(code, name), count| { code: code, name: name, establishments_count: count } }
                    .sort_by { |r| -r[:establishments_count] }
                    .first(20)

        render json: { data: results }
      end

      private

      def establishments_by_type
        HealthEstablishment.active
                           .group(:establishment_type_code)
                           .count
                           .map do |code, count|
          {
            code: code,
            name: HealthEstablishment::ESTABLISHMENT_TYPE_MAP[code] || "Outro",
            count: count
          }
        end.sort_by { |r| -r[:count] }
      end

      def equipment_summary
        {
          total_equipments: EstablishmentEquipment.sum(:quantity_existing),
          sus_equipments: EstablishmentEquipment.available_sus.sum(:quantity_existing),
          by_type: EquipmentType.joins(equipment_items: :establishment_equipments)
                                .group("equipment_types.name")
                                .sum("establishment_equipments.quantity_existing")
                                .map { |name, count| { type: name, total: count } }
                                .sort_by { |r| -r[:total] }
                                .first(10)
        }
      end
    end
  end
end
