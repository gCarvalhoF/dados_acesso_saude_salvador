module DataImport
  class BaseImporter
    SALVADOR_MUNICIPALITY_CODE = "292740"
    AUX_DATA_PATH = Rails.root.join("aux-data")
    CNES_PATH = Rails.root.join("aux-data", "cnes-database")
    IBGE_PATH = Rails.root.join("aux-data", "ibge")
    FIXTURE_CNES_PATH = Rails.root.join("spec", "fixtures", "cnes_csv")

    def self.call(**kwargs)
      new(**kwargs).call
    end

    private

    def cnes_csv_path(filename, version)
      if @use_fixtures
        # Remove date suffix like 202508 from filename to match fixture file
        fixture_name = filename.gsub(/\d{6}\.csv$/, ".csv")
        FIXTURE_CNES_PATH.join(fixture_name)
      else
        AUX_DATA_PATH.join("cnes-database", version, filename)
      end
    end

    def latest_cnes_version
      return if @use_fixtures

      Dir.entries(CNES_PATH).select { |f| f.to_i.positive? }.max
    end

    def salvador_geojson_path(filename)
      AUX_DATA_PATH.join("salvador", filename)
    end

    def ibge_csv_path(filename)
      IBGE_PATH.join("data", filename)
    end

    def ibge_geo_data_path(filename)
      IBGE_PATH.join("data", "geo-data", filename)
    end

    def parse_csv(path, &block)
      require "csv"
      CSV.foreach(path, headers: true, col_sep: ";", quote_char: '"', encoding: "ISO-8859-1:UTF-8") do |row|
        block.call(row)
      end
    rescue CSV::MalformedCSVError => e
      Rails.logger.warn "CSV parse warning for #{path}: #{e.message}"
    end

    def load_geojson(path)
      require "rgeo/geo_json"
      json = File.read(path)
      RGeo::GeoJSON.decode(json, geo_factory: geo_factory)
    end

    def geo_factory
      @geo_factory ||= RGeo::Geographic.spherical_factory(srid: 4326)
    end

    def log(message)
      Rails.logger.info "[DataImport] #{message}"
      puts "[DataImport] #{message}"
    end
  end
end
