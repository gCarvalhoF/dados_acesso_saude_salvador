# Dashboard Interativo de Acesso à Saúde em Salvador

Dashboard com mapa interativo para visualização e análise da distribuição de equipamentos, estabelecimentos e serviços de saúde pública em Salvador, Bahia. O sistema cruza dados do CNES (Cadastro Nacional de Estabelecimentos de Saúde), Censo IBGE e GeoJSON de bairros para oferecer uma visão espacial do acesso à saúde no município.

---

## Stack

- **Backend:** Ruby on Rails 8 (API-only)
- **Banco de dados:** PostgreSQL 16 + PostGIS 3.5
- **Frontend (planejado):** React + Leaflet.js + Recharts
- **Infraestrutura:** Docker Compose

---

## Pré-requisitos

- Docker e Docker Compose
- Ruby 3.2.2 (caso queira rodar localmente sem Docker)

---

## Configuração e execução

```bash
# Subir os containers (banco + servidor Rails)
docker compose up

# A API ficará disponível em http://localhost:3001
```

### Banco de dados

```bash
# Criar e migrar o banco
make create_db
make migrate

# Importar dados (CNES + GeoJSON de bairros + Censo)
docker exec -it dados_acesso_saude_salvador-web-1 bundle exec rails data:import:all
```

---

## Comandos úteis (Makefile)

```bash
make bash        # Abre shell no container da aplicação
make console     # Rails console
make routes      # Lista todas as rotas
make migrate     # Executa migrations pendentes
make rollback    # Desfaz a última migration
make seed        # Executa db/seeds.rb
make drop        # Dropa o banco
make create_db   # Cria o banco
```

---

## API Endpoints

### Bairros
```
GET /api/v1/neighborhoods
  Retorna GeoJSON (FeatureCollection) com bairros e dados demográficos

GET /api/v1/neighborhoods/:id
  Detalhes de um bairro, incluindo contagem de equipamentos
```

### Estabelecimentos de Saúde
```
GET /api/v1/health_establishments
  Retorna GeoJSON (FeatureCollection) com filtros opcionais:
    ?type=<código_tipo>
    ?legal_nature=<código_natureza>
    ?management=M|E|D|S
    ?sus_only=true
    ?neighborhood_id=<id>
    ?service=<código_serviço>
    ?equipment=<código_equipamento>

GET /api/v1/health_establishments/:id
  Detalhes completos: equipamentos, serviços especializados e leitos
```

### Dashboard
```
GET /api/v1/dashboard/overview
  Totais gerais: estabelecimentos, equipamentos, leitos SUS, bairros

GET /api/v1/dashboard/equipment_by_neighborhood
  Total de equipamentos por bairro (ordenado por volume)

GET /api/v1/dashboard/service_summary
  Top 20 serviços especializados por número de estabelecimentos
```

---

## Fontes de Dados

| Fonte | Dados |
|-------|-------|
| CNES (DataSUS) | Estabelecimentos, equipamentos, serviços, leitos (agosto/2025) |
| IBGE Censo 2022 | Dados demográficos por bairro |
| Prefeitura de Salvador | GeoJSON de delimitação de bairros e unidades de saúde |

---

## Modelagem de Dados

```
Neighborhood            → bairros com geometria (MultiPolygon) e dados do censo
HealthEstablishment     → estabelecimentos (UBS, USF, hospitais, etc.)
EquipmentType           → categorias de equipamentos médicos
EquipmentItem           → equipamentos individuais (mamógrafo, tomógrafo, etc.)
EstablishmentEquipment  → vínculo equipamento ↔ estabelecimento (quantidades)
SpecializedService      → serviços especializados (cardiologia, oncologia, etc.)
EstablishmentService    → vínculo serviço ↔ estabelecimento
HospitalBed             → leitos hospitalares por estabelecimento
```

---

## Variáveis de Ambiente

Configuradas automaticamente pelo `docker-compose.yml` no ambiente de desenvolvimento:

| Variável | Valor padrão |
|----------|-------------|
| `POSTGRES_HOST` | `db` |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_USERNAME` | `postgres` |
| `POSTGRES_PASSWORD` | `password` |
| `RAILS_ENV` | `development` |
