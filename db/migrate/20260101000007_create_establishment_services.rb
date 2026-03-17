class CreateEstablishmentServices < ActiveRecord::Migration[8.0]
  def change
    create_table :establishment_services do |t|
      t.references :health_establishment, null: false, foreign_key: true
      t.references :specialized_service, null: false, foreign_key: true
      t.string :classification_code
      t.string :service_characteristic
      t.boolean :ambulatorial_sus, default: false
      t.boolean :hospitalar_sus, default: false
      t.timestamps
    end

    add_index :establishment_services,
              [ :health_establishment_id, :specialized_service_id, :classification_code ],
              unique: true,
              name: "idx_estab_service_unique"
  end
end
