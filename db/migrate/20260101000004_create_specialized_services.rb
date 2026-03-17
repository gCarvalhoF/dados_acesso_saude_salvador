class CreateSpecializedServices < ActiveRecord::Migration[8.0]
  def change
    create_table :specialized_services do |t|
      t.string :code, null: false
      t.string :name, null: false
      t.timestamps
    end

    add_index :specialized_services, :code, unique: true
  end
end
