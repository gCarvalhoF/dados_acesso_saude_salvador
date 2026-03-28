module Api
  module V1
    class HealthEstablishmentsController < ApplicationController
      def index
        establishments = filtered_establishments

        render json: {
          type: "FeatureCollection",
          features: establishments.map { |e| establishment_feature(e) }
        }
      end

      def show
        establishment = HealthEstablishment.find(params[:id])
        render json: establishment_feature(establishment, detailed: true)
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      private

      def filtered_establishments
        scope = HealthEstablishment.active.includes(:neighborhood, { establishment_services: :specialized_service }, :establishment_equipments)

        scope = scope.by_type(split_param(:type)) if params[:type].present?
        scope = scope.by_legal_nature(params[:legal_nature]) if params[:legal_nature].present?
        scope = scope.by_management(split_param(:management)) if params[:management].present?
        scope = scope.sus_only if params[:sus_only] == "true"
        scope = scope.in_neighborhood(split_param(:neighborhood_id)) if params[:neighborhood_id].present?
        scope = scope.with_service(split_param(:service)) if params[:service].present?
        scope = scope.with_equipment(split_param(:equipment)) if params[:equipment].present?
        if params[:reference_category].present?
          keys = split_param(:reference_category)
          scope = scope.by_reference_categories(keys)
        end

        scope
      end

      def split_param(key)
        val = params[key].to_s
        val.include?(",") ? val.split(",") : val
      end

      def establishment_feature(establishment, detailed: false)
        {
          type: "Feature",
          geometry: point_geometry(establishment.coordinates),
          properties: establishment_properties(establishment, detailed: detailed)
        }
      end

      def establishment_properties(establishment, detailed: false)
        props = {
          id: establishment.id,
          cnes_code: establishment.cnes_code,
          name: establishment.name,
          fantasy_name: establishment.fantasy_name,
          display_type: establishment.display_type,
          establishment_type_code: establishment.establishment_type_code,
          legal_nature_code: establishment.legal_nature_code,
          legal_nature_name: establishment.legal_nature_name,
          management_type: establishment.management_type,
          management_name: establishment.management_name,
          address: establishment.address,
          neighborhood_name: establishment.neighborhood_name,
          zip_code: establishment.zip_code,
          phone: establishment.phone,
          is_sus: establishment.is_sus,
          is_active: establishment.is_active,
          neighborhood_id: establishment.neighborhood_id,
          reference_categories: establishment.reference_categories.map { |c| c[:label] }
        }

        if detailed
          props[:equipments] = establishment.establishment_equipments.includes(:equipment_item).map do |ee|
            {
              code: ee.equipment_item.code,
              name: ee.equipment_item.name,
              quantity_existing: ee.quantity_existing,
              quantity_in_use: ee.quantity_in_use,
              available_sus: ee.available_sus
            }
          end

          props[:services] = establishment.establishment_services.includes(:specialized_service).map do |es|
            {
              code: es.specialized_service.code,
              name: es.specialized_service.name,
              classification_code: es.classification_code,
              ambulatorial_sus: es.ambulatorial_sus,
              hospitalar_sus: es.hospitalar_sus
            }
          end

          props[:beds] = {
            total_existing: establishment.total_existing_beds,
            total_sus: establishment.total_sus_beds
          }
        end

        props
      end

      def point_geometry(point)
        return nil unless point
        {
          type: "Point",
          coordinates: [ point.longitude, point.latitude ]
        }
      end
    end
  end
end
