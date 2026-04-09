module DataImport
  class CnesImporter < BaseImporter
    def initialize(use_fixtures: false, version: nil)
      @use_fixtures = use_fixtures
      @version = version || latest_cnes_version
    end

    def call
      log "Starting CNES import for Salvador (#{SALVADOR_MUNICIPALITY_CODE})..."

      import_equipment_types
      import_equipment_items
      import_specialized_services
      import_health_establishments
      import_establishment_equipments
      import_establishment_services
      import_hospital_beds
      import_teaching_hospitals
      associate_neighborhoods

      log "CNES import complete."
    end

    private

    # -------------------------
    # Lookup tables
    # -------------------------

    def import_equipment_types
      log "Importing equipment types..."
      count = 0
      parse_csv(cnes_csv_path("tbTipoEquipamento#{@version}.csv", @version)) do |row|
        code = row["CO_TIPO_EQUIPAMENTO"]&.strip
        name = row["DS_TIPO_EQUIPAMENTO"]&.strip
        next if code.blank? || name.blank?

        EquipmentType.find_or_create_by!(code: code) { |et| et.name = name }
        count += 1
      end
      log "  #{count} equipment types processed"
    end

    def import_equipment_items
      log "Importing equipment items..."
      count = 0
      parse_csv(cnes_csv_path("tbEquipamento#{@version}.csv", @version)) do |row|
        code = row["CO_EQUIPAMENTO"]&.strip
        name = row["DS_EQUIPAMENTO"]&.strip
        type_code = row["CO_TIPO_EQUIPAMENTO"]&.strip
        next if code.blank? || name.blank?

        equipment_type = EquipmentType.find_by(code: type_code)
        next unless equipment_type

        EquipmentItem.find_or_create_by!(code: code) do |ei|
          ei.name = name
          ei.equipment_type = equipment_type
        end
        count += 1
      end
      log "  #{count} equipment items processed"
    end

    def import_specialized_services
      log "Importing specialized services..."
      count = 0
      parse_csv(cnes_csv_path("tbServicoEspecializado#{@version}.csv", @version)) do |row|
        code = row["CO_SERVICO_ESPECIALIZADO"]&.strip
        name = row["DS_SERVICO_ESPECIALIZADO"]&.strip
        next if code.blank? || name.blank?

        SpecializedService.find_or_create_by!(code: code) { |s| s.name = name }
        count += 1
      end
      log "  #{count} specialized services processed"
    end

    # -------------------------
    # Establishments
    # -------------------------

    def import_health_establishments
      log "Importing health establishments for Salvador..."
      count = 0

      parse_csv(cnes_csv_path("tbEstabelecimento#{@version}.csv", @version)) do |row|
        municipality = row["CO_MUNICIPIO_GESTOR"]&.strip
        next unless municipality == SALVADOR_MUNICIPALITY_CODE

        cnes_code = row["CO_CNES"]&.strip
        next if cnes_code.blank?

        lat = row["NU_LATITUDE"]&.strip&.gsub(",", ".")
        lon = row["NU_LONGITUDE"]&.strip&.gsub(",", ".")

        coordinates = build_point(lat, lon)
        is_sus = resolve_is_sus(row["CO_CLIENTELA"])

        establishment = HealthEstablishment.find_or_initialize_by(cnes_code: cnes_code)
        establishment.assign_attributes(
          name: row["NO_RAZAO_SOCIAL"]&.strip || cnes_code,
          fantasy_name: row["NO_FANTASIA"]&.strip,
          establishment_type_code: row["TP_UNIDADE"]&.strip,
          legal_nature_code: row["CO_NATUREZA_JUR"]&.strip,
          management_type: row["TP_GESTAO"]&.strip,
          address: build_address(row),
          neighborhood_name: row["NO_BAIRRO"]&.strip,
          zip_code: row["CO_CEP"]&.strip,
          phone: row["NU_TELEFONE"]&.strip,
          is_sus: is_sus,
          is_active: true,
          coordinates: coordinates
        )
        establishment.save!
        count += 1
      rescue => e
        Rails.logger.warn "Could not import establishment #{cnes_code}: #{e.message}"
      end

      log "  #{count} health establishments imported"
    end

    # -------------------------
    # Relation tables
    # -------------------------

    def import_establishment_equipments
      log "Importing establishment-equipment relations..."
      count = 0
      salvador_cnes_codes = HealthEstablishment.pluck(:cnes_code).to_set

      parse_csv(cnes_csv_path("rlEstabEquipamento#{@version}.csv", @version)) do |row|
        unit_code = row["CO_UNIDADE"]&.strip
        cnes_code = unit_code&.slice(6..) # CO_CNES is CO_UNIDADE without municipality prefix
        next unless salvador_cnes_codes.include?(cnes_code)

        establishment = HealthEstablishment.find_by(cnes_code: cnes_code)
        next unless establishment

        equipment_code = row["CO_EQUIPAMENTO"]&.strip
        equipment_item = EquipmentItem.find_by(code: equipment_code)
        next unless equipment_item

        EstablishmentEquipment.find_or_create_by!(
          health_establishment: establishment,
          equipment_item: equipment_item
        ) do |ee|
          ee.quantity_existing = row["QT_EXISTENTE"].to_i
          ee.quantity_in_use = row["QT_USO"].to_i
          ee.available_sus = row["TP_SUS"]&.strip == "1"
        end
        count += 1
      rescue => e
        Rails.logger.warn "Could not import equipment relation: #{e.message}"
      end

      log "  #{count} establishment-equipment relations imported"
    end

    def import_establishment_services
      log "Importing establishment-service relations..."
      count = 0
      salvador_unit_codes = HealthEstablishment.pluck(:cnes_code)
                                               .map { |c| "#{SALVADOR_MUNICIPALITY_CODE}#{c}" }
                                               .to_set

      parse_csv(cnes_csv_path("rlEstabServClass#{@version}.csv", @version)) do |row|
        unit_code = row["CO_UNIDADE"]&.strip
        next unless salvador_unit_codes.include?(unit_code)

        cnes_code = unit_code.slice(6..)
        establishment = HealthEstablishment.find_by(cnes_code: cnes_code)
        next unless establishment

        service_code = row["CO_SERVICO"]&.strip
        service = SpecializedService.find_by(code: service_code)
        next unless service

        classification = row["CO_CLASSIFICACAO"]&.strip

        EstablishmentService.find_or_create_by!(
          health_establishment: establishment,
          specialized_service: service,
          classification_code: classification
        ) do |es|
          es.service_characteristic = row["TP_CARACTERISTICA"]&.strip
          es.ambulatorial_sus = row["CO_AMBULATORIAL_SUS"]&.strip == "1"
          es.hospitalar_sus = row["CO_HOSPITALAR_SUS"]&.strip == "1"
        end
        count += 1
      rescue => e
        Rails.logger.warn "Could not import service relation: #{e.message}"
      end

      log "  #{count} establishment-service relations imported"
    end

    def import_hospital_beds
      log "Importing hospital beds..."
      count = 0
      salvador_unit_codes = HealthEstablishment.pluck(:cnes_code)
                                               .map { |c| "#{SALVADOR_MUNICIPALITY_CODE}#{c}" }
                                               .to_set

      parse_csv(cnes_csv_path("rlEstabComplementar#{@version}.csv", @version)) do |row|
        unit_code = row["CO_UNIDADE"]&.strip
        next unless salvador_unit_codes.include?(unit_code)

        cnes_code = unit_code.slice(6..)
        establishment = HealthEstablishment.find_by(cnes_code: cnes_code)
        next unless establishment

        HospitalBed.find_or_create_by!(
          health_establishment: establishment,
          bed_code: row["CO_LEITO"]&.strip,
          bed_type_code: row["CO_TIPO_LEITO"]&.strip
        ) do |bed|
          bed.quantity_existing = row["QT_EXIST"].to_i
          bed.quantity_sus = row["QT_SUS"].to_i
        end
        count += 1
      rescue => e
        Rails.logger.warn "Could not import bed: #{e.message}"
      end

      log "  #{count} hospital beds imported"
    end

    # -------------------------
    # Teaching hospital flag
    # -------------------------

    TEACHING_HOSPITAL_CODE = "0506"

    def import_teaching_hospitals
      log "Importing teaching hospital flags..."
      count = 0
      salvador_cnes_codes = HealthEstablishment.pluck(:cnes_code).to_set

      parse_csv(cnes_csv_path("rlEstabSipac#{@version}.csv", @version)) do |row|
        unit_code = row["CO_UNIDADE"]&.strip
        next unless unit_code&.start_with?(SALVADOR_MUNICIPALITY_CODE)

        habilitacao = row["COD_SUB_GRUPO_HABILITACAO"]&.strip
        next unless habilitacao == TEACHING_HOSPITAL_CODE

        cnes_code = unit_code.slice(6..)
        next unless salvador_cnes_codes.include?(cnes_code)

        HealthEstablishment.where(cnes_code: cnes_code, is_teaching_hospital: false)
                           .update_all(is_teaching_hospital: true)
        count += 1
      rescue => e
        Rails.logger.warn "Could not import teaching hospital flag: #{e.message}"
      end

      log "  #{count} teaching hospital flags set"
    end

    # -------------------------
    # Spatial association
    # -------------------------

    def associate_neighborhoods
      log "Associating establishments with neighborhoods via spatial query..."
      count = 0

      HealthEstablishment.where(neighborhood_id: nil).where.not(coordinates: nil).find_each do |est|
        neighborhood = Neighborhood.find_by_sql([
          "SELECT * FROM neighborhoods WHERE ST_Contains(geometry::geometry, ST_SetSRID(ST_Point(?, ?), 4326)) LIMIT 1",
          est.coordinates.longitude,
          est.coordinates.latitude
        ]).first

        if neighborhood
          est.update_columns(neighborhood_id: neighborhood.id)
          count += 1
        end
      end

      log "  #{count} establishments spatially associated with neighborhoods"
    end

    # -------------------------
    # Helpers
    # -------------------------

    def build_address(row)
      parts = [
        row["NO_LOGRADOURO"]&.strip,
        row["NU_ENDERECO"]&.strip,
        row["NO_COMPLEMENTO"]&.strip
      ].compact.reject(&:blank?)
      parts.join(", ")
    end

    def build_point(lat, lon)
      return nil if lat.blank? || lon.blank?
      lat_f = lat.to_f
      lon_f = lon.to_f
      return nil if lat_f.zero? && lon_f.zero?

      "SRID=4326;POINT(#{lon_f} #{lat_f})"
    rescue
      nil
    end

    def resolve_is_sus(co_clientela)
      # CO_CLIENTELA: 01 = SUS, 02 = Non-SUS, 03 = Both
      co_clientela&.strip&.in?(%w[01 03]) || false
    end
  end
end
