# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_03_28_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "postgis"

  create_table "equipment_items", force: :cascade do |t|
    t.string "code", null: false
    t.string "name", null: false
    t.bigint "equipment_type_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_equipment_items_on_code", unique: true
    t.index ["equipment_type_id"], name: "index_equipment_items_on_equipment_type_id"
  end

  create_table "equipment_types", force: :cascade do |t|
    t.string "code", null: false
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_equipment_types_on_code", unique: true
  end

  create_table "establishment_equipments", force: :cascade do |t|
    t.bigint "health_establishment_id", null: false
    t.bigint "equipment_item_id", null: false
    t.integer "quantity_existing", default: 0
    t.integer "quantity_in_use", default: 0
    t.boolean "available_sus", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["equipment_item_id"], name: "index_establishment_equipments_on_equipment_item_id"
    t.index ["health_establishment_id", "equipment_item_id"], name: "idx_estab_equipment_unique", unique: true
    t.index ["health_establishment_id"], name: "index_establishment_equipments_on_health_establishment_id"
  end

  create_table "establishment_services", force: :cascade do |t|
    t.bigint "health_establishment_id", null: false
    t.bigint "specialized_service_id", null: false
    t.string "classification_code"
    t.string "service_characteristic"
    t.boolean "ambulatorial_sus", default: false
    t.boolean "hospitalar_sus", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["health_establishment_id", "specialized_service_id", "classification_code"], name: "idx_estab_service_unique", unique: true
    t.index ["health_establishment_id"], name: "index_establishment_services_on_health_establishment_id"
    t.index ["specialized_service_id"], name: "index_establishment_services_on_specialized_service_id"
  end

  create_table "health_establishments", force: :cascade do |t|
    t.string "cnes_code", null: false
    t.string "name", null: false
    t.string "fantasy_name"
    t.string "establishment_type_code"
    t.string "legal_nature_code"
    t.string "legal_nature_name"
    t.string "management_type"
    t.string "address"
    t.string "neighborhood_name"
    t.string "zip_code"
    t.string "phone"
    t.boolean "is_sus", default: false
    t.boolean "is_active", default: true
    t.bigint "neighborhood_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.geography "coordinates", limit: {srid: 4326, type: "st_point", geographic: true}
    t.boolean "is_teaching_hospital", default: false, null: false
    t.index ["cnes_code"], name: "index_health_establishments_on_cnes_code", unique: true
    t.index ["coordinates"], name: "index_health_establishments_on_coordinates", using: :gist
    t.index ["establishment_type_code"], name: "index_health_establishments_on_establishment_type_code"
    t.index ["is_active"], name: "index_health_establishments_on_is_active"
    t.index ["is_sus"], name: "index_health_establishments_on_is_sus"
    t.index ["legal_nature_code"], name: "index_health_establishments_on_legal_nature_code"
    t.index ["management_type"], name: "index_health_establishments_on_management_type"
    t.index ["neighborhood_id"], name: "index_health_establishments_on_neighborhood_id"
  end

  create_table "hospital_beds", force: :cascade do |t|
    t.bigint "health_establishment_id", null: false
    t.string "bed_code"
    t.string "bed_type_code"
    t.integer "quantity_existing", default: 0
    t.integer "quantity_sus", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["health_establishment_id"], name: "index_hospital_beds_on_health_establishment_id"
  end

  create_table "neighborhoods", force: :cascade do |t|
    t.string "name", null: false
    t.geography "geometry", limit: {srid: 4326, type: "multi_polygon", geographic: true}
    t.integer "population_total"
    t.float "population_male"
    t.float "population_female"
    t.float "demographic_density"
    t.float "population_0_to_4"
    t.float "population_5_to_14"
    t.float "population_15_to_19"
    t.float "population_20_to_24"
    t.float "population_25_to_49"
    t.float "population_50_to_69"
    t.float "population_above_70"
    t.float "population_white"
    t.float "population_black"
    t.float "population_asian"
    t.float "population_brown"
    t.float "population_indigenous"
    t.float "income_avg"
    t.float "income_0_2_wages"
    t.float "income_2_5_wages"
    t.float "income_5_10_wages"
    t.float "income_10_20_wages"
    t.float "income_above_20_wages"
    t.float "income_none"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["geometry"], name: "index_neighborhoods_on_geometry", using: :gist
    t.index ["name"], name: "index_neighborhoods_on_name", unique: true
  end

  create_table "specialized_services", force: :cascade do |t|
    t.string "code", null: false
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_specialized_services_on_code", unique: true
  end

  add_foreign_key "equipment_items", "equipment_types"
  add_foreign_key "establishment_equipments", "equipment_items"
  add_foreign_key "establishment_equipments", "health_establishments"
  add_foreign_key "establishment_services", "health_establishments"
  add_foreign_key "establishment_services", "specialized_services"
  add_foreign_key "health_establishments", "neighborhoods"
  add_foreign_key "hospital_beds", "health_establishments"
end
