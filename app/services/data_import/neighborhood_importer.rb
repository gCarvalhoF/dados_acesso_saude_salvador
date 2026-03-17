module DataImport
  class NeighborhoodImporter < BaseImporter
    def call
      log "Importing neighborhoods..."
      path = salvador_geojson_path("delimitacao_bairros.geojson")
      geojson = JSON.parse(File.read(path))
      count = 0

      geojson["features"].each do |feature|
        props = feature["properties"]
        name = props["nome_bairr"]&.strip
        next if name.blank?

        wkt_geometry = build_geometry_wkt(feature["geometry"])

        neighborhood = Neighborhood.find_or_initialize_by(name: name)
        neighborhood.geometry = wkt_geometry if wkt_geometry
        neighborhood.save!
        count += 1
      rescue => e
        Rails.logger.warn "Could not import neighborhood '#{name}': #{e.message}"
      end

      log "Imported #{count} neighborhoods"
      count
    end

    private

    def build_geometry_wkt(geometry)
      return nil if geometry.nil?

      coords = geometry["coordinates"]
      type = geometry["type"]

      case type
      when "Polygon"
        rings = coords.map { |ring| ring.map { |pt| "#{pt[0]} #{pt[1]}" }.join(", ") }
        "SRID=4326;POLYGON((#{rings.join('), (')}))"
      when "MultiPolygon"
        polygons = coords.map do |poly|
          rings = poly.map { |ring| ring.map { |pt| "#{pt[0]} #{pt[1]}" }.join(", ") }
          "((#{rings.join('), (')}))"
        end
        "SRID=4326;MULTIPOLYGON(#{polygons.join(', ')})"
      end
    end
  end
end
