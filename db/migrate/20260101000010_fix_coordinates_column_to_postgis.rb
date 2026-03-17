class FixCoordinatesColumnToPostgis < ActiveRecord::Migration[8.0]
  def up
    remove_index :health_establishments, :coordinates, using: :gist
    remove_column :health_establishments, :coordinates
    add_column :health_establishments, :coordinates, :st_point, geographic: true
    add_index :health_establishments, :coordinates, using: :gist
  end

  def down
    remove_index :health_establishments, :coordinates, using: :gist
    remove_column :health_establishments, :coordinates
    add_column :health_establishments, :coordinates, :point
    add_index :health_establishments, :coordinates, using: :gist
  end
end
