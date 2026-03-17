class CreateEquipmentItems < ActiveRecord::Migration[8.0]
  def change
    create_table :equipment_items do |t|
      t.string :code, null: false
      t.string :name, null: false
      t.references :equipment_type, null: false, foreign_key: true
      t.timestamps
    end

    add_index :equipment_items, :code, unique: true
  end
end
