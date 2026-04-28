# Seeds - Importa dados de Salvador do CNES, GeoJSON de bairros e Censo
#
# Para executar: rails db:seed
# Ou individualmente:
#   rails data:import:neighborhoods
#   rails data:import:census
#   rails data:import:cnes

puts "Iniciando importacao dos dados de Salvador..."

DataImport::NeighborhoodImporter.call
DataImport::IbgeCensusImporter.call
DataImport::CnesImporter.call

puts "Importacao concluida!"
