namespace :data do
  namespace :import do
    desc "Import neighborhood boundaries from GeoJSON"
    task neighborhoods: :environment do
      DataImport::NeighborhoodImporter.call
    end

    desc "Import IBGE Census demographic data for Salvador neighborhoods"
    task ibge_census: :environment do
      DataImport::IbgeCensusImporter.call
    end

    desc "Import all CNES data for Salvador from CSVs"
    task cnes: :environment do
      DataImport::CnesImporter.call
    end

    desc "Run all imports in order: neighborhoods -> census -> CNES"
    task all: :environment do
      Rake::Task["data:import:neighborhoods"].invoke
      Rake::Task["data:import:ibge_census"].invoke
      Rake::Task["data:import:cnes"].invoke
    end
  end
end
