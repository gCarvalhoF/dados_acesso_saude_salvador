# PRD - Dashboard Interativo de Acesso a Saude Publica em Salvador

## 1. Visao Geral

Dashboard com mapa interativo para visualizacao e analise da distribuicao de equipamentos, estabelecimentos e servicos de saude publica em Salvador, Bahia. O sistema cruza dados do CNES (Cadastro Nacional de Estabelecimentos de Saude), Censo IBGE e GeoJSON de bairros para oferecer uma visao espacial do acesso a saude no municipio.

**Stack:** Ruby on Rails 8 (API) + React via react_on_rails + PostgreSQL/PostGIS + Leaflet.js

---

## 2. Objetivos

1. Mapear a distribuicao geografica de equipamentos de saude (mamografos, tomografos, etc.) por estabelecimento e bairro
2. Classificar e diferenciar tipos de estabelecimentos (UBS vs USF, Hospital Geral vs Especializado, Pronto Socorro, etc.)
3. Identificar servicos especializados oferecidos por cada unidade (referencia em infeccao, peconha, cardiologia, etc.)
4. Cruzar dados de equipamentos e servicos com dados sociodemograficos (populacao, renda, raca) por bairro
5. Permitir filtragem por natureza juridica (federal, estadual, municipal) e disponibilidade SUS

---

## 3. Fontes de Dados

### 3.1 Dados ja disponveis (aux-data/)

| Fonte | Arquivo | Uso |
|-------|---------|-----|
| GeoJSON Bairros | `salvador/delimitacao_bairros.geojson` | Poligonos dos bairros no mapa |
| GeoJSON Unidades | `salvador/unidades_de_saude.geojson` | Pontos de unidades de saude |
| Censo IBGE | `salvador/censo/censo_2010_2022_por_bairro.geojson` | Dados demograficos por bairro |
| CNES Estabelecimentos | `cnes-database/tbEstabelecimento202508.csv` | Cadastro de estabelecimentos |
| CNES Equipamentos (relacao) | `cnes-database/rlEstabEquipamento202508.csv` | Vinculo equipamento-estabelecimento |
| CNES Equipamentos (lookup) | `cnes-database/tbEquipamento202508.csv` | Nomes dos equipamentos |
| CNES Tipos Equipamento | `cnes-database/tbTipoEquipamento202508.csv` | Categorias de equipamento |
| CNES Servicos Especializados | `cnes-database/tbServicoEspecializado202508.csv` | Tipos de servico |
| CNES Servico x Estabelecimento | `cnes-database/rlEstabServClass202508.csv` | Vinculo servico-estabelecimento |
| CNES Leitos | `cnes-database/rlEstabComplementar202508.csv` | Leitos hospitalares |
| CNES Tipo Unidade | `cnes-database/tbTipoUnidade202508.csv` | Classificacao do tipo de unidade |
| CNES Natureza Juridica | `cnes-database/tbNaturezaJuridica202508.csv` | Natureza juridica (publico/privado) |
| CNES Municipio | `cnes-database/tbMunicipio202508.csv` | Codigo do municipio de Salvador |

### 3.2 Filtro base para Salvador

- Codigo do municipio de Salvador na tabela `tbMunicipio`
- Naturezas juridicas publicas (administracao publica federal, estadual, municipal) via `tbNaturezaJuridica`
- Estabelecimentos ativos (sem data de desativacao)

---

## 4. Modelagem de Dados (Rails)

### 4.1 Models

```
Neighborhood (bairros)
  - name: string
  - geometry: geometry (MultiPolygon, SRID 4326)
  - population_total: integer
  - population_male: integer
  - population_female: integer
  - population_white: integer
  - population_black: integer
  - population_brown: integer
  - population_indigenous: integer
  - population_asian: integer
  - population_0_to_6: integer
  - population_7_to_14: integer
  - population_15_to_18: integer
  - population_19_to_24: integer
  - population_25_to_49: integer
  - population_50_to_64: integer
  - population_above_65: integer
  - demographic_density: float
  - income_0_2_wages: integer
  - income_2_5_wages: integer
  - income_5_10_wages: integer
  - income_10_20_wages: integer
  - income_above_20_wages: integer

HealthEstablishment (estabelecimentos)
  - cnes_code: string (CO_UNIDADE, unique)
  - name: string
  - fantasy_name: string
  - establishment_type_code: string (CO_TIPO_ESTABELECIMENTO)
  - establishment_type_name: string
  - legal_nature_code: string (CO_NATUREZA_JUR)
  - legal_nature_name: string
  - management_type: string (TP_GESTAO: M/E/D/S)
  - address: string
  - coordinates: geometry (Point, SRID 4326)
  - phone: string
  - is_sus: boolean
  - is_active: boolean
  - neighborhood: references Neighborhood (via spatial join ou campo)

EquipmentType (tipos de equipamento)
  - code: string (CO_TIPO_EQUIPAMENTO)
  - name: string

Equipment (equipamentos - tabela de lookup)
  - code: string (CO_EQUIPAMENTO)
  - equipment_type: references EquipmentType
  - name: string

EstablishmentEquipment (vinculo equipamento-estabelecimento)
  - health_establishment: references HealthEstablishment
  - equipment: references Equipment
  - quantity_existing: integer
  - quantity_in_use: integer
  - available_sus: boolean

SpecializedService (servicos especializados - lookup)
  - code: string (CO_SERVICO_ESPECIALIZADO)
  - name: string

EstablishmentService (vinculo servico-estabelecimento)
  - health_establishment: references HealthEstablishment
  - specialized_service: references SpecializedService
  - classification_code: string
  - service_characteristic: string (proprio/terceirizado/ambos)
  - ambulatorial_sus: boolean
  - hospitalar_sus: boolean

HospitalBed (leitos)
  - health_establishment: references HealthEstablishment
  - bed_code: string
  - bed_type_code: string
  - quantity_existing: integer
  - quantity_sus: integer
```

### 4.2 Associacoes principais

```ruby
Neighborhood has_many :health_establishments (via spatial containment)
HealthEstablishment has_many :establishment_equipments
HealthEstablishment has_many :equipments, through: :establishment_equipments
HealthEstablishment has_many :establishment_services
HealthEstablishment has_many :specialized_services, through: :establishment_services
HealthEstablishment has_many :hospital_beds
```

---

## 5. Arquitetura

### 5.1 Backend (Rails 8 API)

```
app/
  controllers/
    api/
      v1/
        neighborhoods_controller.rb      # GeoJSON dos bairros + dados demograficos
        health_establishments_controller.rb  # Estabelecimentos com filtros
        equipments_controller.rb         # Equipamentos e agregacoes
        services_controller.rb           # Servicos especializados
        dashboard_controller.rb          # Dados agregados para cards/graficos
  models/
    neighborhood.rb
    health_establishment.rb
    equipment.rb
    equipment_type.rb
    establishment_equipment.rb
    specialized_service.rb
    establishment_service.rb
    hospital_bed.rb
  services/
    data_import/
      cnes_importer.rb          # Importa CSVs do CNES para o banco
      census_importer.rb        # Importa GeoJSON do censo
      neighborhood_importer.rb  # Importa delimitacao de bairros
```

### 5.2 API Endpoints

```
GET /api/v1/neighborhoods
  ?include=demographics,equipment_summary
  Retorna GeoJSON dos bairros com dados opcionais

GET /api/v1/health_establishments
  ?type=UBS|USF|HOSPITAL_GERAL|HOSPITAL_ESPECIALIZADO|PRONTO_SOCORRO|...
  ?legal_nature=federal|estadual|municipal
  ?management=M|E|D
  ?service=105|116|132|...  (codigo do servico especializado)
  ?equipment=02|11|12|...   (codigo do equipamento)
  ?sus_only=true
  ?neighborhood_id=123
  Retorna GeoJSON dos estabelecimentos filtrados

GET /api/v1/health_establishments/:id
  Detalhes completos: equipamentos, servicos, leitos

GET /api/v1/equipments/summary
  ?group_by=neighborhood|establishment_type|equipment_type
  Contagens agregadas para graficos

GET /api/v1/dashboard/overview
  Cards resumo: total estabelecimentos, equipamentos, leitos SUS, etc.
```

### 5.3 Frontend (React via react_on_rails)

**Dependencias principais:**
- `react_on_rails` (gem + npm)
- `leaflet` + `react-leaflet` (mapa interativo)
- `recharts` (graficos)
- `tailwindcss` (estilizacao)

**Estrutura de componentes:**

```
app/javascript/
  bundles/
    Dashboard/
      components/
        DashboardPage.tsx          # Layout principal
        Map/
          InteractiveMap.tsx        # Mapa Leaflet centralizado em Salvador
          NeighborhoodLayer.tsx     # Camada coropletica dos bairros
          EstablishmentMarkers.tsx  # Marcadores das unidades de saude
          EstablishmentPopup.tsx    # Popup com detalhes ao clicar
          MapLegend.tsx             # Legenda do mapa
        Filters/
          FilterPanel.tsx           # Painel lateral de filtros
          EstablishmentTypeFilter.tsx
          EquipmentFilter.tsx
          ServiceFilter.tsx
          LegalNatureFilter.tsx
        Charts/
          EquipmentDistributionChart.tsx  # Distribuicao de equipamentos
          EstablishmentTypeChart.tsx      # Tipos de estabelecimento
          NeighborhoodComparisonChart.tsx # Comparativo entre bairros
        Summary/
          OverviewCards.tsx         # Cards com metricas gerais
          SelectedDetail.tsx        # Detalhe do item selecionado
```

---

## 6. Funcionalidades

### 6.1 Mapa Interativo (MVP)

- **Camada de bairros:** poligonos coloridos por metrica selecionavel (populacao, renda, densidade, quantidade de equipamentos per capita)
- **Marcadores de estabelecimentos:** icones diferenciados por tipo:
  - UBS (circulo azul)
  - USF (circulo verde) - identificada pelo servico 101 vinculado
  - Hospital Geral (cruz vermelha)
  - Hospital Especializado (cruz laranja)
  - Pronto Socorro (triangulo vermelho)
  - Pronto Atendimento (triangulo amarelo)
  - Outros (circulo cinza)
- **Popup ao clicar:** nome, tipo, endereco, equipamentos disponiveis, servicos, leitos SUS
- **Cluster de marcadores:** agrupamento automatico em zoom baixo

### 6.2 Painel de Filtros

- Tipo de estabelecimento (multi-select)
- Tipo de equipamento especifico (ex: "Mamografo", "Tomografo")
- Servico especializado (ex: "Cardiologia", "Oncologia", "Urgencia")
- Natureza juridica (federal/estadual/municipal)
- Disponibilidade SUS (sim/nao)
- Bairro especifico

### 6.3 Dashboard de Metricas

**Cards resumo:**
- Total de estabelecimentos publicos ativos
- Total de mamografos / tomografos / ressonancias
- Total de leitos SUS
- Total de equipos odontologicos

**Graficos:**
- Distribuicao de equipamentos de imagem por bairro (bar chart)
- Proporcao de tipos de estabelecimento (pie chart)
- Equipamentos por 10.000 habitantes por bairro (bar chart horizontal)
- Servicos especializados mais oferecidos (bar chart)

### 6.4 Identificacao de Hospitais de Referencia

Logica de classificacao baseada nos servicos vinculados:
- **Hospital de infeccao:** servicos 106 (DST/HIV/AIDS), 111 (Tuberculose)
- **Referencia cardiovascular:** servico 116
- **Referencia oncologica:** servico 132
- **Referencia trauma/ortopedia:** servico 155
- **Hospital de ensino:** via tabela `rlEstabSipac` (LFCES049)

---

## 7. Importacao de Dados

### 7.1 Rake Tasks

```
rails data:import:neighborhoods    # Importa delimitacao_bairros.geojson
rails data:import:census           # Importa censo_2010_2022_por_bairro.geojson
rails data:import:cnes             # Importa todos os CSVs do CNES filtrados por Salvador
rails data:import:all              # Executa todos acima em sequencia
```

### 7.2 Pipeline de importacao CNES

1. Ler `tbMunicipio202508.csv` -> extrair codigo de Salvador
2. Ler `tbNaturezaJuridica202508.csv` -> carregar lookup
3. Ler `tbTipoUnidade202508.csv` -> carregar lookup
4. Ler `tbEquipamento202508.csv` + `tbTipoEquipamento202508.csv` -> carregar lookups
5. Ler `tbServicoEspecializado202508.csv` -> carregar lookup
6. Ler `tbEstabelecimento202508.csv` -> filtrar por municipio de Salvador -> criar registros
7. Ler `rlEstabEquipamento202508.csv` -> filtrar por estabelecimentos de Salvador -> criar vinculos
8. Ler `rlEstabServClass202508.csv` -> filtrar por estabelecimentos de Salvador -> criar vinculos
9. Ler `rlEstabComplementar202508.csv` -> filtrar por estabelecimentos de Salvador -> criar leitos
10. Associar estabelecimentos a bairros via ST_Contains (PostGIS spatial query)

---

## 8. Distincao UBS vs USF

A base do CNES nao diferencia explicitamente UBS de USF pelo tipo de unidade (ambas sao tipo `02` - "Centro de Saude/Unidade Basica"). A distincao e feita por:

1. **Servico vinculado:** se `rlEstabServClass` contem servico `101` ("Estrategia de Saude da Familia") -> **USF**
2. **Equipe vinculada:** se `tbEquipe` contem equipe do tipo ESF vinculada ao estabelecimento -> confirma **USF**
3. **Ausencia de ambos:** -> **UBS tradicional**

Implementar como um metodo no model:
```ruby
class HealthEstablishment < ApplicationRecord
  def usf?
    establishment_type_code == '02' &&
      establishment_services.exists?(specialized_service: { code: '101' })
  end

  def display_type
    return 'USF' if usf?
    ESTABLISHMENT_TYPE_MAP[establishment_type_code] || 'Outro'
  end
end
```

---

## 9. Fases de Implementacao

### Fase 1 - Fundacao (backend + importacao)
- [ ] Criar migrations para todos os models
- [ ] Implementar models com associacoes e scopes
- [ ] Implementar rake tasks de importacao (CNES + GeoJSON + Censo)
- [ ] Seed do banco com dados de Salvador
- [ ] Endpoints da API retornando GeoJSON

### Fase 2 - Frontend base (mapa + filtros)
- [ ] Configurar react_on_rails + Tailwind + Leaflet
- [ ] Mapa interativo com camada de bairros
- [ ] Marcadores de estabelecimentos com popup
- [ ] Painel de filtros basico (tipo, SUS, natureza juridica)

### Fase 3 - Dashboard completo
- [ ] Cards de metricas resumo
- [ ] Graficos de distribuicao (recharts)
- [ ] Filtros avancados (equipamento especifico, servico)
- [ ] Camada coropletica por metrica selecionavel

### Fase 4 - Refinamentos
- [ ] Classificacao de hospitais de referencia
- [ ] Comparativo entre bairros
- [ ] Exportacao de dados filtrados (CSV)
- [ ] Responsividade mobile

---

## 10. Configuracao Tecnica

### Gems adicionais necessarias
```ruby
gem 'react_on_rails', '~> 14.0'
gem 'shakapacker', '~> 8.0'  # bundler JS para react_on_rails
```

### Pacotes npm
```json
{
  "react": "^18",
  "react-dom": "^18",
  "react_on_rails": "^14",
  "leaflet": "^1.9",
  "react-leaflet": "^4",
  "recharts": "^2",
  "tailwindcss": "^3",
  "@types/leaflet": "^1.9"
}
```

### Docker - servicos necessarios
- PostgreSQL 16 + PostGIS 3.5 (ja configurado)
- Node.js 20+ (adicionar ao docker-compose para build do frontend)
