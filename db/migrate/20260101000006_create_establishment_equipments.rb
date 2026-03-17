class CreateEstablishmentEquipments < ActiveRecord::Migration[8.0]
  def change
    create_table :establishment_equipments do |t|
      t.references :health_establishment, null: false, foreign_key: true
      t.references :equipment_item, null: false, foreign_key: true
      t.integer :quantity_existing, default: 0
      t.integer :quantity_in_use, default: 0
      t.boolean :available_sus, default: false
      t.timestamps
    end

    add_index :establishment_equipments,
              [ :health_establishment_id, :equipment_item_id ],
              unique: true,
              name: "idx_estab_equipment_unique"
  end
end
