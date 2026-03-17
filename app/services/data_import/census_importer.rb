module DataImport
  class CensusImporter < BaseImporter
    def call
      log "Importing census data..."
      path = salvador_geojson_path("censo/censo_2010_2022_por_bairro.geojson")
      geojson = JSON.parse(File.read(path))
      count = 0

      geojson["features"].each do |feature|
        props = feature["properties"]
        name = props["NOME_BAIRR"]&.strip
        next if name.blank?

        neighborhood = Neighborhood.find_by(name: name) ||
                       Neighborhood.find_by("LOWER(name) = LOWER(?)", name)
        next unless neighborhood

        neighborhood.assign_attributes(census_attributes(props))
        neighborhood.save!
        count += 1
      rescue => e
        Rails.logger.warn "Could not import census for '#{name}': #{e.message}"
      end

      log "Updated #{count} neighborhoods with census data"
      count
    end

    private

    # Uses 2022 Census fields (C*) when available, falls back to 2010 (B*)
    def census_attributes(props)
      {
        population_total: props["C001"] || props["B001"],
        population_male: props["C002"] || props["B002"],
        population_female: props["C003"] || props["B003"],
        demographic_density: props["C004"] || props["B004"],
        population_0_to_4: props["C005"],
        population_5_to_14: props["C006"],
        population_15_to_19: props["C007"],
        population_20_to_24: props["C008"],
        population_25_to_49: props["C009"],
        population_50_to_69: props["C010"],
        population_above_70: props["C011"],
        population_white: props["C013"] || props["B013"],
        population_black: props["C014"] || props["B014"],
        population_asian: props["C015"] || props["B015"],
        population_brown: props["C016"] || props["B016"],
        population_indigenous: props["C017"] || props["B017"],
        income_0_2_wages: parse_float(props["C055"] || props["B055"]),
        income_2_5_wages: parse_float(props["C056"] || props["B056"]),
        income_5_10_wages: parse_float(props["C057"] || props["B057"]),
        income_10_20_wages: parse_float(props["C058"] || props["B058"]),
        income_above_20_wages: parse_float(props["C059"] || props["B059"]),
        income_none: parse_float(props["C060"] || props["B060"])
      }
    end

    def parse_float(value)
      return nil if value.nil?
      value.to_s.gsub(",", ".").to_f
    rescue
      nil
    end
  end
end
