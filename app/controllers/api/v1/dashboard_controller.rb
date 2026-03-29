module Api
  module V1
    class DashboardController < ApplicationController
      include EstablishmentFiltering

      def overview
        base = apply_establishment_filters(HealthEstablishment.active)

        render json: {
          establishments: {
            total: base.count,
            sus: base.sus_only.count,
            by_type: establishments_by_type(base)
          },
          equipments: equipment_summary(base),
          beds: beds_summary(base),
          neighborhoods: {
            total: Neighborhood.count,
            with_data: Neighborhood.with_population.count
          }
        }
      end

      def equipment_by_neighborhood
        base = apply_establishment_filters(HealthEstablishment.active)

        results = base
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
        base = apply_establishment_filters(HealthEstablishment.active)

        results = SpecializedService
                    .joins(:establishment_services)
                    .where(establishment_services: { health_establishment_id: base.select(:id) })
                    .group("specialized_services.code", "specialized_services.name")
                    .count("DISTINCT establishment_services.health_establishment_id")
                    .map { |(code, name), count| { code: code, name: name, establishments_count: count } }
                    .sort_by { |r| -r[:establishments_count] }
                    .first(20)

        render json: { data: results }
      end

      private

      def establishments_by_type(base)
        base.group(:establishment_type_code)
            .count
            .map do |code, count|
          {
            code: code,
            name: HealthEstablishment::ESTABLISHMENT_TYPE_MAP[code] || "Outro",
            count: count
          }
        end.sort_by { |r| -r[:count] }
      end

      def equipment_summary(base)
        establishment_equipments = EstablishmentEquipment.where(health_establishment: base)
        {
          total_equipments: establishment_equipments.sum(:quantity_existing),
          sus_equipments: establishment_equipments.available_sus.sum(:quantity_existing),
          by_type: EquipmentType.joins(equipment_items: :establishment_equipments)
                                .where(establishment_equipments: { health_establishment: base })
                                .group("equipment_types.name")
                                .sum("establishment_equipments.quantity_existing")
                                .map { |name, count| { type: name, total: count } }
                                .sort_by { |r| -r[:total] }
                                .first(10)
        }
      end

      def beds_summary(base)
        beds = HospitalBed.where(health_establishment: base)
        {
          total_existing: beds.sum(:quantity_existing),
          total_sus: beds.sum(:quantity_sus)
        }
      end
    end
  end
end
