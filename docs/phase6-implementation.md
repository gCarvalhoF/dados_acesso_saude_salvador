# Phase 6 Implementation — IBGE as Census and Neighborhood Data Source

This phase replaces the previous neighborhood/census data sources (Prefeitura de Salvador GeoJSON for boundaries + a custom 2010/2022 census GeoJSON) with the official **IBGE Censo Demográfico 2022** datasets — both for neighborhood boundaries and for demographic data.

---

## Table of Contents

1. [Motivation](#motivation)
2. [New Data Source Layout](#new-data-source-layout)
3. [Schema Migration](#schema-migration)
4. [BaseImporter: IBGE Path Helpers](#baseimporter-ibge-path-helpers)
5. [NeighborhoodImporter Rewrite](#neighborhoodimporter-rewrite)
6. [IbgeCensusImporter](#ibgecensusimporter)
7. [API and Frontend Updates](#api-and-frontend-updates)
8. [CnesImporter: is_active fix](#cnesimporter-is_active-fix)
9. [Model: name uniqueness dropped](#model-name-uniqueness-dropped)
10. [Test Suite](#test-suite)
11. [Open Items](#open-items)

---

## Motivation

The previous pipeline mixed two unrelated sources:

- **Boundaries**: `aux-data/salvador/delimitacao_bairros.geojson` from the Prefeitura, keyed by `nome_bairr`. No IBGE codes, no area, no administrative hierarchy.
- **Census**: `aux-data/salvador/censo/censo_2010_2022_por_bairro.geojson`, a custom merge of 2010 and 2022 IBGE microdata keyed by `NOME_BAIRR` (string match, case-insensitive fallback). Demographic columns were opaque and bundled income brackets that the IBGE 2022 universal questionnaire no longer surfaces.

This created two problems:

1. **No administrative hierarchy** — neighborhoods could not be grouped by district/subdistrict.
2. **Brittle joins** — boundary and census files matched by neighborhood name; any spelling drift silently dropped a neighborhood, and IBGE-allowed name collisions across districts had no way to be resolved.

Phase 6 switches both inputs to IBGE Censo 2022, which provides:
- A single GeoJSON with full administrative codes (region → state → city → district → subdistrict → neighborhood) keyed by `CD_BAIRRO` (IBGE neighborhood code)
- `AREA_KM2` per polygon
- `v0001` (population total) inline with the boundary
- Separate microdata CSVs (V01006–V01411) for detailed demography by sex, age band, and color/race

Joining boundary and census on `CD_BAIRRO` is exact — no string matching.

---

## New Data Source Layout

```
aux-data/
├── cnes-database/                # unchanged
├── salvador/                     # legacy — only used by census_importer.rb (deprecated)
└── ibge/
    ├── data/
    │   ├── geo-data/
    │   │   └── BA_bairros_CD2022.geojson   # boundaries + name + admin codes + area + total pop
    │   └── *.csv                            # microdata (V01006..V01411 columns)
    └── data-dictionary/                     # IBGE column reference
```

The legacy `aux-data/salvador/` tree is still on disk but no importer references it anymore — `CensusImporter` has been deleted along with its rake task (`data:import:census`).

---

## Schema Migration

**File**: `db/migrate/20260422235458_update_neighborhood.rb`

### Removed columns

The previous schema mixed two granularities of demographic data and an income-bracket model that the IBGE 2022 universal questionnaire no longer surfaces at the neighborhood level:

| Removed | Reason |
|---|---|
| `population_0_to_4`, `5_to_14`, `15_to_19`, `20_to_24`, `25_to_49`, `50_to_69`, `above_70` | Replaced with finer-grained IBGE bands (see below) |
| `population_male`, `population_female` | Re-added with `float` type (IBGE microdata are weighted, non-integer) |
| `population_white`, `black`, `asian`, `brown`, `indigenous` | Re-added with `float` type for the same reason |
| `income_avg`, `income_0_2_wages`, `income_2_5_wages`, `income_5_10_wages`, `income_10_20_wages`, `income_above_20_wages`, `income_none` | Not exposed by IBGE 2022 universal sample at neighborhood level |

### Added columns

**Administrative hierarchy (from `BA_bairros_CD2022.geojson` properties):**

| Column | IBGE field |
|---|---|
| `region_ibge_code` / `region_name` | `CD_REGIAO` / `NM_REGIAO` |
| `state_ibge_code` / `state_name` | `CD_UF` / `NM_UF` |
| `city_ibge_code` / `city_name` | `CD_MUN` / `NM_MUN` |
| `district_ibge_code` / `district_name` | `CD_DIST` / `NM_DIST` |
| `subdistrict_ibge_code` / `subdistrict_name` | `CD_SUBDIST` / `NM_SUBDIST` |
| `neighborhood_ibge_code` | `CD_BAIRRO` |
| `area_km2` | `AREA_KM2` |

**Detailed demographic bands (intended source: `IbgeCensusImporter`, microdata columns V01009–V01030):**

```
population_0_to_4, 5_to_9, 10_to_14, 15_to_19, 20_to_24,
25_to_29, 30_to_39, 40_to_49, 50_to_59, 60_to_69, 70_or_more
```

**Color/race × sex breakdown (V01322–V01331):**

```
population_male_white, male_black, male_asian, male_brown, male_indigenous
population_female_white, female_black, female_asian, female_brown, female_indigenous
```

These cross-tabulated columns are intended only for the **neighborhood comparison** view; they are not exposed in `index`/`show` to keep payloads small.

---

## BaseImporter: IBGE Path Helpers

**File**: `app/services/data_import/base_importer.rb`

Two new helpers added next to the existing `salvador_geojson_path`:

```ruby
IBGE_PATH = Rails.root.join("aux-data", "ibge")

def ibge_csv_path(filename)
  IBGE_PATH.join("data", filename)
end

def ibge_geo_data_path(filename)
  IBGE_PATH.join("data", "geo-data", filename)
end
```

Convention: any importer reading IBGE inputs uses these helpers; `salvador_geojson_path` is reserved for legacy assets and will be retired.

---

## NeighborhoodImporter Rewrite

**File**: `app/services/data_import/neighborhood_importer.rb`

### What changed

| Before | After |
|---|---|
| Read `aux-data/salvador/delimitacao_bairros.geojson` | Read `aux-data/ibge/data/geo-data/BA_bairros_CD2022.geojson` |
| Name from `nome_bairr` | Name from `NM_BAIRRO` |
| Only `name` + `geometry` were persisted | Plus 12 administrative attributes, `area_km2`, and `population_total` |

### Mapping table

The IBGE → schema mapping is centralized in a private method to make it easy to add fields:

```ruby
def ibge_neighborhood_data_mapping
  {
    "CD_REGIAO":   :region_ibge_code,
    "NM_REGIAO":   :region_name,
    "CD_UF":       :state_ibge_code,
    "NM_UF":       :state_name,
    "CD_MUN":      :city_ibge_code,
    "NM_MUN":      :city_name,
    "CD_DIST":     :district_ibge_code,
    "NM_DIST":     :district_name,
    "CD_SUBDIST":  :subdistrict_ibge_code,
    "NM_SUBDIST":  :subdistrict_name,
    "CD_BAIRRO":   :neighborhood_ibge_code,
    "NM_BAIRRO":   :name,
    "AREA_KM2":    :area_km2,
    "v0001":       :population_total
  }
end
```

`build_neighborhood_attributes(props)` iterates the GeoJSON `properties` hash, looks up each key in the mapping, and assembles an attributes hash that is `assign_attributes`'d before save. Unknown keys are ignored, so additions to the mapping are the only change required to capture new fields in the future.

### Idempotency

Switched: `Neighborhood.find_or_initialize_by(neighborhood_ibge_code: neighborhood_ibge_code)`. IBGE allows the same `NM_BAIRRO` to repeat across districts/subdistricts (e.g. multiple "Centro"), so the only stable identity is `CD_BAIRRO`. Rows with a blank `CD_BAIRRO` are skipped explicitly.

### Import counts

The previous Prefeitura GeoJSON yielded ~163 neighborhoods. The IBGE 2022 GeoJSON yields **455 neighborhoods** for Salvador (BA), reflecting more granular IBGE delimitations. RSpec confirms this on every run:

```
[DataImport] Imported 455 neighborhoods
```

---

## IbgeCensusImporter

**File**: `app/services/data_import/ibge_census_importer.rb`

Replaces the deleted `CensusImporter`. Reads two IBGE microdata CSVs and joins them to existing neighborhoods on `CD_BAIRRO`:

- `aux-data/ibge/data/agregados_por_bairros_cor_ou_raca_BR.csv` → V01317–V01331 (cor/raça totals + cor/raça × sex)
- `aux-data/ibge/data/agregados_por_bairros_demografia_BR.csv` → V01006–V01041 (population totals + by sex + age bands)

### Flow

```ruby
def call
  import_color_and_race_data    # writes V01317–V01331 → 15 cor/raça columns
  import_demography_data        # writes V01006–V01041 → 14 demography columns
end
```

Both helpers share a single `import_neighborhood_data_from_csv_file(file, mapping)` that:

1. Streams the CSV via `BaseImporter#parse_csv` (handles `;` separator and ISO-8859-1 → UTF-8 conversion).
2. Looks up the neighborhood by `CD_BAIRRO`. If absent (e.g. the row belongs to a Bahia neighborhood outside Salvador, or the boundary import was skipped), the row is silently dropped — `next unless neighborhood`.
3. Applies the column mapping and `update!`s the neighborhood with integer-coerced values (`row[key].to_i`).

### Mapping hashes

| Schema column | IBGE column |
|---|---|
| `population_male` | V01007 |
| `population_female` | V01008 |
| `population_0_to_4` … `population_70_or_more` | V01031–V01041 |
| `population_white` | V01317 |
| `population_black` | V01318 |
| `population_asian` | V01319 |
| `population_brown` | V01320 |
| `population_indigenous` | V01321 |
| `population_male_white` … `population_male_indigenous` | V01322–V01326 |
| `population_female_white` … `population_female_indigenous` | V01327–V01331 |

### Rake task

The legacy `data:import:census` task is gone; the replacement is:

```bash
rails data:import:ibge_census
```

`data:import:all` and `db/seeds.rb` were both updated to call the new importer in the same position (after `NeighborhoodImporter`, before `CnesImporter`). The seed spec (`spec/db/seeds_spec.rb`) was updated correspondingly.

### Why `update!` on existing neighborhoods (not upsert)

IBGE microdata is keyed by `CD_BAIRRO` and has no geometry. The boundary GeoJSON is the source of truth for which neighborhoods exist. A microdata row without a matching neighborhood is a no-op — there is no use case for inserting a geometry-less row from a CSV.

---

## CnesImporter: is_active fix

**File**: `app/services/data_import/cnes_importer.rb`

Previously every imported establishment was set to `is_active: true`, which made every disabled CNES record look active in the UI. Replaced with:

```ruby
is_active: row["CO_MOTIVO_DESAB"]&.blank?
```

`CO_MOTIVO_DESAB` is the CNES disable-reason code: blank means active, any value means deactivated. This restores the semantics of `Neighborhood#establishments_count`, which already filtered on `is_active` (the spec at `spec/models/neighborhood_spec.rb` was already asserting that behavior).

---

## Model: name uniqueness dropped

**File**: `app/models/neighborhood.rb`

```diff
- validates :name, presence: true, uniqueness: true
+ validates :name, presence: true
```

Same reason as the importer change: IBGE permits the same `NM_BAIRRO` to repeat across districts. The migration drops the `unique: true` on the `name` index for the same reason. The model spec was updated to assert that two neighborhoods with the same name but different `neighborhood_ibge_code` are both valid.

---

## API and Frontend Updates

The schema change forced corresponding updates to the API contract and the frontend. None of these are about IBGE *per se* — they are the consequences of dropping income brackets and adding administrative fields.

### Controller — `app/controllers/api/v1/neighborhoods_controller.rb`

`neighborhood_properties` was emitting now-deleted income columns (which would have raised `NoMethodError` at runtime). The serializer now exposes:

```
+ region_ibge_code, region_name
+ state_ibge_code, state_name
+ city_ibge_code, city_name
+ district_ibge_code, district_name
+ subdistrict_ibge_code, subdistrict_name
+ neighborhood_ibge_code
+ area_km2
- income_0_2_wages, income_2_5_wages, income_5_10_wages, income_10_20_wages, income_above_20_wages
```

All three endpoints expose the IBGE codes + `area_km2`. The detailed comparison demographics (age bands, color/race × sex — 23 extra columns) are gated behind an `include_comparison_data:` flag and are emitted only by `GET /api/v1/neighborhoods/compare`. The `index` endpoint stays lean (455 features × small payload), and the comparison view (≤5 neighborhoods) is the only consumer of the cross-tabulated columns.

### Frontend types — `frontend/src/types/index.ts`

`NeighborhoodProperties` updated to mirror the new payload: 12 IBGE string-or-null fields + `area_km2: number | null`, with the 5 income fields removed.

### ComparisonTable — `frontend/src/components/Comparison/ComparisonTable.tsx`

The "Renda (domicílios)" group was dependent on the dropped income columns. It is replaced with four new groups, all populated from the `compare` payload:

- **Localização (IBGE)** — Distrito, Subdistrito, Área (km²)
- **Cor / Raça** — Branca, Preta, Parda, Amarela, Indígena
- **Faixa Etária** — 0–4, 5–9, 10–14, 15–19, 20–24, 25–29, 30–39, 40–49, 50–59, 60–69, 70+
- **Cor × Sexo** — 5 cor/raça × 2 sexos = 10 rows

Only `Distrito`, `Subdistrito`, and `Área` are surfaced from the location group; `Região`, `UF`, and `Município` would be identical for every Salvador neighborhood and would only add noise to the comparison.

The cell-rendering helper was generalized to accept `string | number | null` so administrative names render as plain text while numeric metrics keep their pt-BR formatting and best/worst highlighting. Missing demographic fields render as `—` so the table still works if an upstream payload (e.g. the `index` endpoint, used while the comparison fetch is in flight) is missing the comparison-only columns.

### Filter and comparison neighborhood selectors

`MultiSelect` and `FilterMultiSelect` (the selectors used by `FilterPanel` and `NeighborhoodComparison`) gained an optional `description` field on each option. The neighborhood selectors pass `f.properties.city_name` as the description, rendered as a small gray annotation next to the neighborhood name. Search now matches both label and description, which lets the user search by city name when the dataset spans multiple municipalities.

### Map tooltip — `frontend/src/components/Map/NeighborhoodLayer.tsx`

Hover tooltip now appends the district name and area (km²) when available, keeping the existing metric-value and population lines.

### Test fixtures and factory

- `spec/factories/neighborhoods.rb` — replaced income attributes with the IBGE codes, names, and `area_km2`. Sequence-based `neighborhood_ibge_code` generates a unique 11-digit code per record.
- `frontend/src/test/fixtures.ts` — `mockNeighborhoods` features now carry the full IBGE attribute set. Subdistrict names are deliberately distinct from neighborhood names to avoid `getByText` collisions in `NeighborhoodComparison.test.tsx`.

---

## Test Suite

### Backend — RSpec, 142 examples, 0 failures

New coverage:

- `spec/requests/api/v1/neighborhoods_spec.rb` —
  - Asserts the 12 IBGE administrative keys + `area_km2` appear in the `index` response.
  - Asserts the index payload does **not** leak the comparison-only columns (`population_25_to_29`, `population_male_white`, `population_asian`, …).
  - Asserts the `compare` endpoint exposes the full demographic detail (age bands, color/race × sex).
- `spec/models/neighborhood_spec.rb` — replaced "is invalid with a duplicate name" with "permits duplicate names across different IBGE codes (different districts)" to mirror the new identity rule.
- `spec/db/seeds_spec.rb` — switched from `CensusImporter` to `IbgeCensusImporter` in the order/invocation assertions.
- `spec/factories/neighborhoods.rb` — generates a unique `neighborhood_ibge_code` per record (sequence-based 11-digit code) and the full IBGE administrative attributes.

The neighborhood importer spec runs against the real IBGE GeoJSON and confirms `Imported 455 neighborhoods` on every run.

### Frontend — Vitest, 149 tests, 0 failures

New tests in this phase:

- `frontend/src/components/Filters/FilterPanel.test.tsx` — neighborhood option shows the city name annotation alongside the neighborhood name.
- `frontend/src/components/Comparison/NeighborhoodComparison.test.tsx` —
  - city name is shown next to each neighborhood option in the comparison selector;
  - comparison table renders the new `Cor / Raça`, `Faixa Etária`, and `Cor × Sexo` groups when the `compare` payload is present;
  - missing demographic fields fall back to the `—` placeholder.

Existing tests pick up the new fixture shape automatically.

### Linters

- **RuboCop** — clean on the changed Ruby files.
- **ESLint** — clean.
- **TypeScript (`tsc --noEmit`)** — pre-existing errors only (unrelated to this phase: `global` not declared in some test files; ref typing in `EstablishmentMarkers.tsx`).

---

## Open Items

Resolved during this phase (no longer open):

- ~~Implement `IbgeCensusImporter#call`~~ — shipped.
- ~~Retire `CensusImporter` and `data:import:census`~~ — deleted; `data:import:ibge_census` replaces it.
- ~~Switch `NeighborhoodImporter` upserts to key on `neighborhood_ibge_code`~~ — done.
- ~~Frontend detail demographic groups in `ComparisonTable`~~ — `Cor / Raça`, `Faixa Etária`, and `Cor × Sexo` groups added.

Still open:

1. **Surface population-density derivation** — with `area_km2` and `population_total` we can compute density on the fly; consider whether `demographic_density` should remain a stored column or become a computed property.
2. **Spec for `IbgeCensusImporter`** — the importer is exercised indirectly via the seed spec, but it has no dedicated unit spec mirroring `neighborhood_importer_spec.rb` (e.g. asserting that V01317 lands in `population_white`, that locale-correct value coercion works, that orphan rows are dropped).
3. **Decimal handling in `IbgeCensusImporter`** — values are coerced via `to_i`. IBGE microdata at the universal-questionnaire level appears to be integer-valued, but if a future dataset (e.g. the sample questionnaire) brings weighted decimals, `to_f` + locale-aware comma-handling will be needed.
4. **Remove the legacy `aux-data/salvador/` tree** — no importer references it anymore; it can be deleted in a follow-up cleanup commit.
5. **Index payload shape** — the IBGE administrative codes + `area_km2` now ship on every neighborhood feature in the `index` response. If payload size becomes a concern, gate them behind a query parameter the same way `include_comparison_data:` gates the comparison demographics.
