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
            neighborhood_properties(
              n,
              detailed: false,
              equipment_count: equip_counts[n.id] || 0,
              include_comparison_data: true
            )
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

      def neighborhood_properties(neighborhood, detailed: false, equipment_count: nil, include_comparison_data: false)
        props = {
          id: neighborhood.id,
          name: neighborhood.name,
          region_ibge_code: neighborhood.region_ibge_code,
          region_name: neighborhood.region_name,
          state_ibge_code: neighborhood.state_ibge_code,
          state_name: neighborhood.state_name,
          city_ibge_code: neighborhood.city_ibge_code,
          city_name: neighborhood.city_name,
          district_ibge_code: neighborhood.district_ibge_code,
          district_name: neighborhood.district_name,
          subdistrict_ibge_code: neighborhood.subdistrict_ibge_code,
          subdistrict_name: neighborhood.subdistrict_name,
          neighborhood_ibge_code: neighborhood.neighborhood_ibge_code,
          area_km2: neighborhood.area_km2,
          population_total: neighborhood.population_total,
          population_male: neighborhood.population_male,
          population_female: neighborhood.population_female,
          demographic_density: neighborhood.demographic_density,
          population_white: neighborhood.population_white,
          population_black: neighborhood.population_black,
          population_brown: neighborhood.population_brown,
          establishments_count: neighborhood.establishments_count,
          sus_beds_count: neighborhood.sus_beds_count,
          equipment_count: equipment_count || (detailed ? neighborhood.equipment_count : 0)
        }

        return props unless include_comparison_data

        props.merge(comparison_demographics(neighborhood))
      end

      def comparison_demographics(neighborhood)
        {
          population_asian: neighborhood.population_asian,
          population_indigenous: neighborhood.population_indigenous,
          population_0_to_4: neighborhood.population_0_to_4,
          population_5_to_9: neighborhood.population_5_to_9,
          population_10_to_14: neighborhood.population_10_to_14,
          population_15_to_19: neighborhood.population_15_to_19,
          population_20_to_24: neighborhood.population_20_to_24,
          population_25_to_29: neighborhood.population_25_to_29,
          population_30_to_39: neighborhood.population_30_to_39,
          population_40_to_49: neighborhood.population_40_to_49,
          population_50_to_59: neighborhood.population_50_to_59,
          population_60_to_69: neighborhood.population_60_to_69,
          population_70_or_more: neighborhood.population_70_or_more,
          population_male_white: neighborhood.population_male_white,
          population_male_black: neighborhood.population_male_black,
          population_male_asian: neighborhood.population_male_asian,
          population_male_brown: neighborhood.population_male_brown,
          population_male_indigenous: neighborhood.population_male_indigenous,
          population_female_white: neighborhood.population_female_white,
          population_female_black: neighborhood.population_female_black,
          population_female_asian: neighborhood.population_female_asian,
          population_female_brown: neighborhood.population_female_brown,
          population_female_indigenous: neighborhood.population_female_indigenous
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
