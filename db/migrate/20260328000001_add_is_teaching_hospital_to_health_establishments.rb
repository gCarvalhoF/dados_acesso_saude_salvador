class AddIsTeachingHospitalToHealthEstablishments < ActiveRecord::Migration[8.0]
  def change
    add_column :health_establishments, :is_teaching_hospital, :boolean, default: false, null: false
  end
end
