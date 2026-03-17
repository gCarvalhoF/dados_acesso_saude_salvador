class CreateHospitalBeds < ActiveRecord::Migration[8.0]
  def change
    create_table :hospital_beds do |t|
      t.references :health_establishment, null: false, foreign_key: true
      t.string :bed_code
      t.string :bed_type_code
      t.integer :quantity_existing, default: 0
      t.integer :quantity_sus, default: 0
      t.timestamps
    end
  end
end
