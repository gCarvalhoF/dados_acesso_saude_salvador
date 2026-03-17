class CreateHealthEstablishments < ActiveRecord::Migration[8.0]
  def change
    create_table :health_establishments do |t|
      t.string :cnes_code, null: false
      t.string :name, null: false
      t.string :fantasy_name
      t.string :establishment_type_code
      t.string :legal_nature_code
      t.string :legal_nature_name
      t.string :management_type
      t.string :address
      t.string :neighborhood_name
      t.string :zip_code
      t.string :phone
      t.boolean :is_sus, default: false
      t.boolean :is_active, default: true
      t.st_point :coordinates, geographic: true
      t.references :neighborhood, null: true, foreign_key: true

      t.timestamps
    end

    add_index :health_establishments, :cnes_code, unique: true
    add_index :health_establishments, :establishment_type_code
    add_index :health_establishments, :legal_nature_code
    add_index :health_establishments, :management_type
    add_index :health_establishments, :is_sus
    add_index :health_establishments, :is_active
    add_index :health_establishments, :coordinates, using: :gist
  end
end
