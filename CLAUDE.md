## CRITICAL WORKFLOW - ALWAYS FOLLOW THIS!

**Research → Plan → Implement**
 
NEVER JUMP STRAIGHT TO CODING! Always follow this sequence:

1. **Research**: Explore the codebase, understand existing patterns
2. **Plan**: Create a detailed implementation plan and verify it with the user, NEVER START IMPLEMENTATION WITHOUT GETTING APPROVAL FOR THE PLAN FIRST
3. **Implement**: Execute the plan with validation checkpoints, ALWAYS ADDING PROGRAMATIC TESTS WHENEVER POSSIBLE, AIM FOR 100% COVERAGE and write tests that will guarantee that things break whenever things face a major change
4. **Test**: Execute all unit tests and linters, both back and front end, to make sure nothing is broken. Do this after each iteration is complete
5. **Update documentation**: Update all documentations (PRD, README, files under docs/) according to the changes made. PREVIOUS DOCS FILES AREN'T TO BE UPDATED, THEY SHOULD BE IMMUTABLE. IF THERE'S NOT A NEW PHASE, CREATE A NEW FILE ITERATING THE NUMBERS, CHECK WITH USER WHAT THIS PHASE IS ABOUT.

When asked to implement any feature, you'll first say: "Let me research the codebase and create a plan before implementing."

---


# Dashboard Interativo de Acesso à Saúde em Salvador

Geospatial health access dashboard built with Rails 8 + React 18 + PostGIS. Visualizes CNES health facility data overlaid on Salvador neighborhood boundaries with interactive maps and charts.

## Architecture

| Layer | Tech |
|---|---|
| Backend | Ruby 3.4.6, Rails 8.0.1 API-mode |
| Database | PostgreSQL 16 + PostGIS 3.5 (spatial queries) |
| Frontend | React 18, TypeScript 5.7, Vite 6 |
| Styling | Tailwind CSS 3 |
| Maps | Leaflet 1.9.4 + react-leaflet |
| Charts | Recharts 3 |
| Backend tests | RSpec + FactoryBot |
| Frontend tests | Vitest 2 + @testing-library/react |

## Running the project

```bash
# Start everything (API on :3001, frontend on :5173, DB on :5433)
docker compose up

# First-time setup
make create_db
make migrate
docker compose exec web bundle exec rails data:import:all
```

### Local frontend dev (faster iteration)

```bash
cd frontend && npm install && npm run dev
# Proxies /api to http://localhost:3001
```

## Testing

```bash
# Backend (RSpec)
docker compose exec web bundle exec rspec
docker compose exec web bundle exec rspec spec/path/to/file_spec.rb

# Frontend (Vitest)
docker compose run --rm --no-deps frontend sh -c "npm install && npm test"
cd frontend && npm run test:watch   # watch mode locally
```

## Linting

```bash
# Backend
docker compose exec web bundle exec rubocop

# Frontend
docker compose run --rm --no-deps frontend sh -c "npm install && npm run lint"
```

## Key Makefile commands

```bash
make bash        # shell into Rails container
make console     # Rails console
make routes      # list API routes
make migrate     # run pending migrations
make rollback    # undo last migration
make seed        # run db/seeds.rb (data import)
```

## API endpoints

```
GET /api/v1/neighborhoods                        # GeoJSON FeatureCollection
GET /api/v1/neighborhoods/:id                    # GeoJSON Feature + equipment stats
GET /api/v1/health_establishments                # GeoJSON, supports filters:
    ?type=&legal_nature=&management=&sus_only=true&neighborhood_id=&service=&equipment=&reference_category=
GET /api/v1/health_establishments/:id            # full detail (equipments, services, beds)
GET /api/v1/filter_options                       # available filter values
GET /api/v1/neighborhoods/compare?ids=1,2,3      # compare up to 5 neighborhoods side-by-side
GET /api/v1/dashboard/overview                   # aggregate KPIs
GET /api/v1/dashboard/equipment_by_neighborhood  # top neighborhoods by equipment count
GET /api/v1/dashboard/service_summary            # top 20 services by establishment count
```

## Project structure highlights

```
app/models/           # HealthEstablishment, Neighborhood, EquipmentItem, etc.
app/controllers/api/v1/
app/services/data_import/  # CnesImporter, NeighborhoodImporter, CensusImporter
db/migrate/
spec/

frontend/src/
  components/
    Map/              # Leaflet map, choropleth layer, markers, popups
    Filters/          # FilterPanel (responsive drawer on mobile) with all filters
    Dashboard/        # MetricCards + ChartsPanel (4 Recharts charts)
    Comparison/       # NeighborhoodComparison + ComparisonTable (side-by-side neighborhood metrics)
    ui/               # FilterSelect, FilterRadioGroup, FilterCheckbox, MultiSelect
  hooks/              # useDashboard, useEstablishments, useNeighborhoods, useFilterOptions, useNeighborhoodComparison
  types/index.ts      # All TypeScript interfaces + filter constants
  test/               # setup.ts, fixtures.ts, mocks/ (leaflet, react-leaflet)
```

## Data sources

- **CNES (Aug 2025)** — National health facility registry (15+ CSVs, filtered to Salvador)
- **IBGE Censo 2022** — Neighborhood demographics (population, age, income)
- **Prefeitura Salvador** — Neighborhood boundary GeoJSON (PostGIS geometries)

## CI/CD

GitHub Actions runs on PRs and pushes to `main`:
- `scan_ruby` — Brakeman security scan
- `lint` — RuboCop
- `test` — RSpec suite
- `lint_frontend` — ESLint
- `test_frontend` — Vitest

All jobs run via Docker Compose for parity with local development.

## Docs

- `docs/PRD.md` — Product requirements and data model
- `docs/phase1-implementation.md` — Backend architecture decisions
- `docs/phase2-implementation.md` — Frontend architecture decisions
- `docs/phase3-implementation.md` — Charts/metrics implementation
