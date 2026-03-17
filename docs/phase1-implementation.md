# Phase 1 Implementation — Health Access Dashboard (Salvador, BA)

This document describes everything built in Phase 1 of the health access dashboard project. It is meant for onboarding new contributors and as a changelog baseline for future phases.

---

## Table of Contents

1. [Overview](#overview)
2. [Stack and Infrastructure](#stack-and-infrastructure)
3. [Database Design](#database-design)
4. [Data Import Pipeline](#data-import-pipeline)
5. [API Endpoints](#api-endpoints)
6. [Test Suite](#test-suite)
7. [Key Decisions and Gotchas](#key-decisions-and-gotchas)
8. [Running Locally](#running-locally)

---

## Overview

Phase 1 establishes the Rails API backend for a dashboard that visualizes health infrastructure access in Salvador, Bahia. It covers:

- Full database schema with PostGIS spatial support
- Data import pipeline consuming CNES CSV files (official Brazilian health registry) and GeoJSON files (neighborhood boundaries, census data)
- A read-only REST API returning GeoJSON-compatible responses for geographic visualization
- A dashboard aggregate endpoint with statistics for the frontend
- Full RSpec test coverage (83 examples, 0 failures)

---

## Stack and Infrastructure

### Core Technology

| Layer | Technology | Notes |
|---|---|---|
| Language | Ruby 3.2 | |
| Framework | Rails 8.0 (API-only) | `config.api_only = true` — no views, sessions, or cookies |
| Database | PostgreSQL 16 with PostGIS 3.5 | Spatial queries, geographic column types |
| PostGIS ORM | `activerecord-postgis-adapter` 11.0 | Provides `st_point`, `geography`, `geometry` column types |
| GeoJSON | `rgeo-geojson` | Encodes/decodes RGeo geometry objects to/from GeoJSON |
| Testing | RSpec + FactoryBot | |
| Containerization | Docker + Docker Compose | |

### Docker Compose

The project runs in Docker. Host port mappings were adjusted from Rails defaults to avoid conflicts with other running containers:

- PostgreSQL: host port `5433` → container port `5432`
- Rails server: host port `3001` → container port `3000`

The database container uses `postgis/postgis:16-3.5-alpine`.

### Environment Forcing in Tests

The container sets `RAILS_ENV=development` via `docker-compose.yml`. Rails' default `ENV['RAILS_ENV'] ||= 'test'` would not override this, causing tests to run against the development database. The fix is in `spec/rails_helper.rb`:

```ruby
ENV['RAILS_ENV'] = 'test'  # hard assignment, not ||=
```

This must remain — removing it would cause all request specs to fail with 403 (host authorization).

---

## Database Design

### Schema Overview

Ten migrations define the schema. All table names follow standard Rails plural conventions except where noted.

```
neighborhoods
  └─ health_establishments (neighborhood_id FK, optional)
       ├─ establishment_equipments → equipment_items → equipment_types
       ├─ establishment_services → specialized_services
       └─ hospital_beds
```

### Migrations

#### `add_postgis_extension_to_database`
Enables the PostGIS extension. Must run before any spatial column is created.

#### `create_neighborhoods`
Stores neighborhood boundary polygons and census data.

Key decisions:
- `geometry` column uses `t.multi_polygon :geometry, geographic: true` — this creates a PostGIS `geography(MultiPolygon, 4326)` column, which uses real-world distance calculations (meters) instead of Cartesian.
- All census fields (population, income, age/race breakdowns) are stored as `float` to accommodate both raw counts and proportional values from different census years.
- Unique index on `name` enforces deduplication on import.

#### `create_equipment_types` and `create_equipment_items`
Two-level hierarchy: a type (e.g., "Equipamentos de Audiologia") contains many items (e.g., "Audiômetro").

Why the rename: The original table was called `equipments`. Rails treats "equipment" as an uncountable noun, making `equipment` the "plural" which caused ActiveRecord to look for a table called `equipment` (not `equipments`) when resolving foreign keys — resulting in `PG::UndefinedTable` errors. Renaming to `equipment_items` avoids the need for custom inflection rules.

#### `create_specialized_services`
Lookup table for CNES-classified health services (e.g., "Estratégia de Saúde da Família", "Cardiologia").

#### `create_health_establishments`
Core table. Each row is a health facility in Salvador.

Key columns:
- `cnes_code` — unique identifier from the CNES registry (not the auto-incremented `id`)
- `establishment_type_code` — two-digit code (e.g., "01" = Hospital Geral, "02" = Centro de Saúde)
- `is_sus` — whether the facility attends SUS (public health system) patients, derived from `CO_CLIENTELA` field in the source CSV (`01` = SUS only, `02` = non-SUS, `03` = both → SUS true for 01 and 03)
- `is_active` — all imported records set to `true`; flag exists for future soft-deletion
- `coordinates` — PostGIS geographic point (see gotcha below)
- `neighborhood_id` — nullable FK, populated via spatial query after import

#### `fix_coordinates_column_to_postgis` (migration #10)

This is a fixup migration. The original migration used `t.point :coordinates, geographic: true`. The `point` method in Rails resolves to the standard PostgreSQL `point` type (a 2D coordinate pair), not a PostGIS geography type. The PostGIS adapter provides `t.st_point` for this purpose.

The consequence was that saving a WKT string like `"SRID=4326;POINT(-38.46 -12.98)"` to the column triggered `invalid value for Float(): "SRID=4326;POINT(...)"` from ActiveRecord's standard point OID handler — silently caught by the importer's rescue block, causing 0 establishments to import.

Fix: migration drops the column and re-adds it as `t.st_point :coordinates, geographic: true`, creating `geography(Point, 4326)`.

The original migration file was also corrected to `t.st_point` so a fresh schema load from scratch will be correct.

#### `create_establishment_equipments`
Join table linking establishments to equipment items. Stores quantities and SUS availability.
- Unique index on `[health_establishment_id, equipment_item_id]` prevents duplicate associations.

#### `create_establishment_services`
Join table linking establishments to specialized services with an additional `classification_code` dimension (a single establishment can offer the same service under multiple classifications).
- Unique index on `[health_establishment_id, specialized_service_id, classification_code]`.

#### `create_hospital_beds`
Stores bed inventory per establishment. Unlike equipment (which has a unique constraint), beds can have multiple rows per establishment — each row represents a bed type (`bed_type_code`).

---

## Data Import Pipeline

All importers inherit from `DataImport::BaseImporter` and follow the same interface: `Importer.call(...)` creates an instance and calls `#call`.

### BaseImporter

Provides shared utilities:
- `parse_csv(path)` — parses semicolon-delimited CSV files encoded in ISO-8859-1 (the encoding used by Brazil's government data exports). Transcodes to UTF-8 on read.
- `load_geojson(path)` — decodes GeoJSON using RGeo with a spherical geographic factory (SRID 4326).
- `cnes_csv_path(filename)` — resolves the path to a CSV file. In test mode (`use_fixtures: true`), it strips the date suffix (e.g., `tbEstabelecimento202508.csv` → `tbEstabelecimento.csv`) and resolves to `spec/fixtures/cnes_csv/`. In production mode it resolves to `aux-data/cnes-database/`.

### NeighborhoodImporter

Source: `aux-data/salvador/delimitacao_bairros.geojson`

Imports neighborhood polygon boundaries. The importer converts GeoJSON geometry to WKT format with SRID prefix (`SRID=4326;MULTIPOLYGON(...)`) before assigning to the `geometry` column.

Handles both `Polygon` and `MultiPolygon` input geometries — converting single polygons to multi-polygon format for schema consistency.

Uses `find_or_create_by!(name:)` for idempotency.

### CensusImporter

Source: `aux-data/salvador/censo/censo_2010_2022_por_bairro.geojson`

Enriches existing neighborhood records with census data by matching on name. Prefers 2022 census fields (prefixed `C` in the GeoJSON properties) over 2010 fields (prefixed `B`) when both are present.

### CnesImporter

The main importer. Reads from 7 CNES CSV files in order:

1. **tbTipoEquipamento** → `equipment_types`
2. **tbEquipamento** → `equipment_items` (links to equipment_types)
3. **tbServicoEspecializado** → `specialized_services`
4. **tbEstabelecimento** → `health_establishments` (filtered to Salvador: `CO_MUNICIPIO_GESTOR == "292740"`)
5. **rlEstabEquipamento** → `establishment_equipments`
6. **rlEstabServClass** → `establishment_services`
7. **rlEstabComplementar** → `hospital_beds`
8. Spatial association: runs `ST_Contains` query to match each establishment to its neighborhood

**Salvador filter**: The CNES dataset is national. The importer filters `tbEstabelecimento` rows where `CO_MUNICIPIO_GESTOR == "292740"` (Salvador's IBGE municipality code). Relation tables (equipment, services, beds) are filtered by checking if the unit's CNES code is in the set of already-imported Salvador establishments.

**Unit code extraction**: In CNES relation tables, `CO_UNIDADE` is a 13-character code formed by concatenating the 6-digit municipality code and the 7-digit CNES code. The importer extracts the CNES portion with `unit_code.slice(6..)`.

**Error handling**: Each row in relation table imports is wrapped in a rescue block that logs failures without stopping the import. This prevents one bad row from halting the entire import, at the cost of silent failures — appropriate for a bulk CSV import but worth monitoring in production.

### Rake Tasks

```
rake import:neighborhoods    # Run NeighborhoodImporter
rake import:census           # Run CensusImporter
rake import:cnes             # Run CnesImporter
rake import:all              # Run all three in order
```

---

## API Endpoints

All endpoints are read-only (GET). Responses use JSON. Geographic endpoints return GeoJSON-compatible structures.

### `GET /api/v1/neighborhoods`

Returns a GeoJSON `FeatureCollection` of all neighborhoods, ordered by name. Each feature includes:
- `id`, `name`
- `population_total`, `demographic_density`
- `establishments_count`, `sus_beds_count`
- `geometry` (MultiPolygon)

### `GET /api/v1/neighborhoods/:id`

Returns a single neighborhood `Feature` with all demographic and income breakdowns included.

### `GET /api/v1/health_establishments`

Returns a GeoJSON `FeatureCollection` of active health establishments. Supports query parameters:

| Parameter | Type | Description |
|---|---|---|
| `type` | string | Filter by `establishment_type_code` |
| `legal_nature` | string | Filter by `legal_nature_code` |
| `management` | string | Filter by `management_type` (M/E/D/S) |
| `neighborhood_id` | integer | Filter by neighborhood |
| `sus_only` | boolean | Only SUS-attending establishments |
| `service` | string | Only establishments offering this service code |
| `equipment` | string | Only establishments with this equipment code |

Each feature includes: `cnes_code`, `name`, `fantasy_name`, `establishment_type_code`, `display_type`, `management_type`, `is_sus`, `is_active`, address fields, and coordinates as GeoJSON Point geometry.

### `GET /api/v1/health_establishments/:id`

Detailed view of a single establishment. Includes:
- All base fields
- `equipments`: array of `{code, name, type_name, quantity_existing, quantity_in_use, available_sus}`
- `services`: array of `{code, name, classification_code, ambulatorial_sus, hospitalar_sus}`
- `beds`: array of `{bed_code, bed_type_code, quantity_existing, quantity_sus}`

### `GET /api/v1/dashboard/overview`

Aggregate statistics:

```json
{
  "establishments": {
    "total": 1200,
    "sus": 800,
    "by_type": [{"type_code": "02", "count": 450}, ...]
  },
  "equipment": {
    "total_existing": 3400,
    "total_in_use": 2100,
    "by_type": [{"type_name": "Diagnóstico por Imagem", "total": 340}, ...]
  },
  "beds": {
    "total_existing": 5000,
    "total_sus": 3200
  },
  "neighborhoods": {
    "total": 170,
    "with_data": 165
  }
}
```

### `GET /api/v1/dashboard/equipment_by_neighborhood`

Returns `{ "data": [...] }` where each row is `{ neighborhood, total_equipments }`, sorted descending.

### `GET /api/v1/dashboard/service_summary`

Returns `{ "data": [...] }` — top 20 services by distinct establishment count. Each row: `{ code, name, establishments_count }`.

---

## Test Suite

**83 examples, 0 failures** as of Phase 1 completion.

### Structure

```
spec/
  models/
    neighborhood_spec.rb
    health_establishment_spec.rb
    equipment_item_spec.rb
    specialized_service_spec.rb
    establishment_equipment_spec.rb
    hospital_bed_spec.rb
  requests/
    api/v1/
      neighborhoods_spec.rb
      health_establishments_spec.rb
      dashboard_spec.rb
  services/
    data_import/
      neighborhood_importer_spec.rb
      cnes_importer_spec.rb
  factories/
    neighborhoods.rb
    health_establishments.rb
    equipment_types.rb
    equipment_items.rb
    specialized_services.rb
    establishment_equipments.rb
    establishment_services.rb
    hospital_beds.rb
  fixtures/
    cnes_csv/
      tbEstabelecimento.csv       (10 Salvador establishments)
      tbTipoEquipamento.csv       (6 equipment types)
      tbEquipamento.csv           (5 equipment items)
      tbServicoEspecializado.csv  (5 services)
      rlEstabEquipamento.csv      (20 equipment relations)
      rlEstabServClass.csv        (20 service relations)
      rlEstabComplementar.csv     (3 bed records)
```

### Fixture CSVs

Small fixture files (30–100 rows) replace the full CNES national dataset for tests. The `BaseImporter#cnes_csv_path` method strips date suffixes (e.g., `202508`) when resolving fixture paths. The `CnesImporter` is instantiated with `use_fixtures: true` in specs.

---

## Key Decisions and Gotchas

### 1. `t.st_point` vs `t.point` for PostGIS

Rails' `t.point` creates a standard PostgreSQL `point` type. PostGIS geography points require `t.st_point :column, geographic: true`. Using `t.point` causes `activerecord-postgis-adapter` to bypass its geographic type casting, and any WKT string passed to the column raises `invalid value for Float()`.

**Rule**: Always use `t.st_point` for PostGIS point columns in migrations.

### 2. `schema.rb` loses PostGIS column metadata

`db/schema.rb` (Ruby format) dumps `t.st_point` as `t.point "coordinates"` — losing the `geographic: true` annotation. This means `db:schema:load` (used for test DB setup) recreates the wrong column type.

The workaround is to run migrations directly on the test database (`RAILS_ENV=test rails db:migrate`) rather than loading from schema. The `fix_coordinates_column_to_postgis` migration corrects any previously-loaded test databases.

Long-term fix would be switching to `config.active_record.schema_format = :sql` and generating `structure.sql` via `pg_dump` from a PostgreSQL 16 client (the web container has pg_dump 15, which is incompatible with the PG 16 server).

### 3. "equipment" is uncountable in Rails

Rails considers "equipment" uncountable (no plural), so `has_many :equipment` resolves to a table called `equipment`. Renamed to `equipment_items` / `EquipmentItem` to avoid needing a custom inflection rule.

### 4. Test database pollution

If `rails runner` or a non-transactional operation inserts data into the test database, subsequent RSpec runs using `find_or_create_by!` will find those records rather than creating new ones, causing `change(...).by_at_least(1)` matchers to show 0. Fix: `RAILS_ENV=test rails db:schema:load` resets the test DB to a clean state.

### 5. ISO-8859-1 CSV encoding

CNES files from the Brazilian government are encoded in ISO-8859-1 (Latin-1). Ruby's CSV parser must be told to transcode: `encoding: "ISO-8859-1:UTF-8"`. Without this, special characters in names (accents, cedillas) cause parse errors and records to import as 0.

### 6. Salvador municipality filter

The CNES dataset covers all of Brazil. The `tbEstabelecimento` file contains hundreds of thousands of rows. The importer filters early (`next unless municipality == "292740"`) to avoid loading irrelevant data. The constant `SALVADOR_MUNICIPALITY_CODE = "292740"` is defined in `BaseImporter` so it can be shared with future importers.

### 7. RAILS_ENV in Docker

The `docker-compose.yml` sets `RAILS_ENV=development` for the web container. `ENV['RAILS_ENV'] ||= 'test'` in `spec/rails_helper.rb` does NOT override this. The assignment must be `ENV['RAILS_ENV'] = 'test'` (unconditional). Without this, request specs receive 403 responses from Rails' host authorization middleware.

---

## Running Locally

### Prerequisites
- Docker and Docker Compose

### First-time setup

```bash
docker compose up -d
docker compose exec web bundle exec rails db:create db:migrate
```

### Import real data

Place CNES CSV files in `aux-data/cnes-database/` and GeoJSON files in `aux-data/salvador/`, then:

```bash
docker compose exec web bundle exec rake import:all
```

### Run tests

```bash
docker compose exec web bundle exec rspec
```

### API

Available at `http://localhost:3001` (port 3001 due to host port remapping).

Example:
```bash
curl http://localhost:3001/api/v1/dashboard/overview
curl http://localhost:3001/api/v1/health_establishments?sus_only=true
curl http://localhost:3001/api/v1/neighborhoods/1
```
