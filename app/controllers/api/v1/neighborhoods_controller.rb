module Api
  module V1
    class NeighborhoodsController < ApplicationController
      def index
        neighborhoods = Neighborhood.ordered_by_name

        equip_counts = EstablishmentEquipment
          .joins(health_establishment: :neighborhood)
          .group("health_establishments.neighborhood_id")
          .sum(:quantity_existing)

        render json: {
          type: "FeatureCollection",
          features: neighborhoods.map { |n| neighborhood_feature(n, equipment_count: equip_counts[n.id] || 0) }
        }
      end

      def show
        neighborhood = Neighborhood.find(params[:id])
        render json: neighborhood_feature(neighborhood, detailed: true)
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      def compare
        ids = params[:ids].to_s.split(",").map(&:to_i).uniq.first(5)

        if ids.length < 2
          return render json: { error: "Selecione pelo menos 2 bairros" }, status: :unprocessable_entity
        end

        neighborhoods = Neighborhood.where(id: ids)

        equip_counts = EstablishmentEquipment
          .joins(health_establishment: :neighborhood)
          .where(health_establishments: { neighborhood_id: ids })
          .group("health_establishments.neighborhood_id")
          .sum(:quantity_existing)

        render json: {
          neighborhoods: neighborhoods.map { |n|
            neighborhood_properties(n, detailed: false, equipment_count: equip_counts[n.id] || 0)
          }
        }
      end

      private

      def neighborhood_feature(neighborhood, detailed: false, equipment_count: nil)
        {
          type: "Feature",
          geometry: geometry_hash(neighborhood.geometry),
          properties: neighborhood_properties(neighborhood, detailed: detailed, equipment_count: equipment_count)
        }
      end

      def neighborhood_properties(neighborhood, detailed: false, equipment_count: nil)
        {
          id: neighborhood.id,
          name: neighborhood.name,
          population_total: neighborhood.population_total,
          population_male: neighborhood.population_male,
          population_female: neighborhood.population_female,
          demographic_density: neighborhood.demographic_density,
          population_white: neighborhood.population_white,
          population_black: neighborhood.population_black,
          population_brown: neighborhood.population_brown,
          income_0_2_wages: neighborhood.income_0_2_wages,
          income_2_5_wages: neighborhood.income_2_5_wages,
          income_5_10_wages: neighborhood.income_5_10_wages,
          income_10_20_wages: neighborhood.income_10_20_wages,
          income_above_20_wages: neighborhood.income_above_20_wages,
          establishments_count: neighborhood.establishments_count,
          sus_beds_count: neighborhood.sus_beds_count,
          equipment_count: equipment_count || (detailed ? neighborhood.equipment_count : 0)
        }
      end

      def geometry_hash(geometry)
        return nil unless geometry
        factory = RGeo::Geographic.spherical_factory(srid: 4326)
        geojson_factory = RGeo::GeoJSON.method(:encode)
        RGeo::GeoJSON.encode(geometry)
      rescue
        nil
      end
    end
  end
end
