class UpdateNeighborhood < ActiveRecord::Migration[8.0]
  def change
    change_table(:neighborhoods) do |t|
      t.remove_index :name, unique: true

      # Remove columns from City Census
      t.remove :population_0_to_4, type: :float
      t.remove :population_5_to_14, type: :float
      t.remove :population_15_to_19, type: :float
      t.remove :population_20_to_24, type: :float
      t.remove :population_25_to_49, type: :float
      t.remove :population_50_to_69, type: :float
      t.remove :population_above_70, type: :float
      t.remove :population_male, type: :float
      t.remove :population_female, type: :float
      t.remove :population_white, type: :float
      t.remove :population_black, type: :float
      t.remove :population_asian, type: :float
      t.remove :population_brown, type: :float
      t.remove :population_indigenous, type: :float
      t.remove :income_avg, type: :float
      t.remove :income_0_2_wages, type: :float
      t.remove :income_2_5_wages, type: :float
      t.remove :income_5_10_wages, type: :float
      t.remove :income_10_20_wages, type: :float
      t.remove :income_above_20_wages, type: :float
      t.remove :income_none, type: :float
    end

    change_table(:neighborhoods) do |t|
      t.index :name

      # Add new columns based on IBGE neighborhood data
      t.string :region_ibge_code
      t.string :region_name
      t.string :state_ibge_code
      t.string :state_name
      t.string :city_ibge_code
      t.string :city_name
      t.string :district_ibge_code
      t.string :district_name
      t.string :subdistrict_ibge_code
      t.string :subdistrict_name
      t.string :neighborhood_ibge_code
      t.float :area_km2, precision: 10, scale: 2

      # Add new columns for demographic data from IBGE census
      t.float :population_male
      t.float :population_female

      t.float :population_0_to_4
      t.float :population_5_to_9
      t.float :population_10_to_14
      t.float :population_15_to_19
      t.float :population_20_to_24
      t.float :population_25_to_29
      t.float :population_30_to_39
      t.float :population_40_to_49
      t.float :population_50_to_59
      t.float :population_60_to_69
      t.float :population_70_or_more

      t.float :population_white
      t.float :population_black
      t.float :population_asian
      t.float :population_brown
      t.float :population_indigenous

      # Add new columns for demographic data from IBGE census (these will be used only on neighborhood comparison tool)

      t.float :population_male_white
      t.float :population_male_black
      t.float :population_male_asian
      t.float :population_male_brown
      t.float :population_male_indigenous

      t.float :population_female_white
      t.float :population_female_black
      t.float :population_female_asian
      t.float :population_female_brown
      t.float :population_female_indigenous
    end
  end
end
