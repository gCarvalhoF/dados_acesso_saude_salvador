module EstablishmentFiltering
  extend ActiveSupport::Concern

  private

  def apply_establishment_filters(scope)
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
end
