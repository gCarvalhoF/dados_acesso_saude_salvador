class CreateNeighborhoods < ActiveRecord::Migration[8.0]
  def change
    create_table :neighborhoods do |t|
      t.string :name, null: false
      t.multi_polygon :geometry, geographic: true

      # 2022 Census (C*)
      t.integer :population_total
      t.float :population_male
      t.float :population_female
      t.float :demographic_density
      t.float :population_0_to_4
      t.float :population_5_to_14
      t.float :population_15_to_19
      t.float :population_20_to_24
      t.float :population_25_to_49
      t.float :population_50_to_69
      t.float :population_above_70
      t.float :population_white
      t.float :population_black
      t.float :population_asian
      t.float :population_brown
      t.float :population_indigenous
      t.float :income_avg
      t.float :income_0_2_wages
      t.float :income_2_5_wages
      t.float :income_5_10_wages
      t.float :income_10_20_wages
      t.float :income_above_20_wages
      t.float :income_none

      t.timestamps
    end

    add_index :neighborhoods, :name, unique: true
    add_index :neighborhoods, :geometry, using: :gist
  end
end
