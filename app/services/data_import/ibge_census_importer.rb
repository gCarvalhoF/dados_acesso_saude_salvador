module DataImport
  class IbgeCensusImporter < BaseImporter
    def call
      log "Starting IBGE Census import"

      import_color_and_race_data
      import_demography_data

      log "IBGE Census import complete."
    end

    def import_color_and_race_data
      import_neighborhood_data_from_csv_file(ibge_csv_path("agregados_por_bairros_cor_ou_raca_BR.csv"), ibge_color_and_race_columns_mapping)
    end

    def import_demography_data
      import_neighborhood_data_from_csv_file(ibge_csv_path("agregados_por_bairros_demografia_BR.csv"), ibge_demography_columns_mapping)
    end

    def import_neighborhood_data_from_csv_file(file, columns_mapping)
      parse_csv(file) do |row|
        neighborhood = Neighborhood.find_by(neighborhood_ibge_code: row["CD_BAIRRO"])

        next unless neighborhood

        ibge_demography_data = {}
        columns_mapping.each do |key, value|
          ibge_demography_data[value] = row[key.to_s].to_i
        end

        neighborhood.update!(ibge_demography_data)
      end
    end

    private

    def ibge_color_and_race_columns_mapping
      {
        "V01317":	:population_white, # Cor ou raça é branca
        "V01318":	:population_black, # Cor ou raça é preta
        "V01319":	:population_asian, # Cor ou raça é amarela
        "V01320":	:population_brown, # Cor ou raça é parda
        "V01321":	:population_indigenous, # Cor ou raça é indígena
        "V01322":	:population_male_white, # Sexo masculino, Cor ou raça é branca
        "V01323":	:population_male_black, # Sexo masculino, Cor ou raça é preta
        "V01324":	:population_male_asian, # Sexo masculino, Cor ou raça é amarela
        "V01325":	:population_male_brown, # Sexo masculino, Cor ou raça é parda
        "V01326":	:population_male_indigenous, # Sexo masculino, Cor ou raça é indígena
        "V01327":	:population_female_white, # Sexo feminino, Cor ou raça é branca
        "V01328":	:population_female_black, # Sexo feminino, Cor ou raça é preta
        "V01329":	:population_female_asian, # Sexo feminino, Cor ou raça é amarela
        "V01330":	:population_female_brown, # Sexo feminino, Cor ou raça é parda
        "V01331":	:population_female_indigenous # Sexo feminino, Cor ou raça é  indígena",
      }
    end

    def ibge_demography_columns_mapping
      {
        "V01006":	:population_total, # Quantidade de moradores
        "V01007":	:population_male, # Quantidade de moradores do sexo masculino
        "V01008":	:population_female, # Quantidade de moradores do sexo feminino
        "V01031":	:population_0_to_4, # Quantidade de moradores de 0 a 4 anos
        "V01032":	:population_5_to_9, # Quantidade de moradores de 5 a 9 anos
        "V01033":	:population_10_to_14, # Quantidade de moradores de 10 a 14 anos
        "V01034":	:population_15_to_19, # Quantidade de moradores de 15 a 19 anos
        "V01035":	:population_20_to_24, # Quantidade de moradores de 20 a 24 anos
        "V01036":	:population_25_to_29, # Quantidade de moradores de 25 a 29 anos
        "V01037":	:population_30_to_39, # Quantidade de moradores de 30 a 39 anos
        "V01038":	:population_40_to_49, # Quantidade de moradores de 40 a 49 anos
        "V01039":	:population_50_to_59, # Quantidade de moradores de 50 a 59 anos
        "V01040":	:population_60_to_69, # Quantidade de moradores de 60 a 69 anos
        "V01041":	:population_70_or_more # Quantidade de moradores de 70 anos ou mais
      }
    end
  end
end
