# Fase 5 - Filtros Globais e Interatividade nos Graficos: Decisoes de Implementacao

## Visao Geral

Fase 5 corrige tres lacunas de UX identificadas nos feedbacks: os filtros nao afetavam os cards de metricas nem os graficos, a comparacao de bairros era independente dos filtros globais, e os graficos eram apenas visualizacao sem possibilidade de interacao para filtrar.

---

## 1. Filtros Aplicados em toda a Pagina

### Problema

O hook `useDashboard()` nao recebia filtros — todos os tres endpoints do dashboard (`overview`, `equipment_by_neighborhood`, `service_summary`) sempre retornavam dados globais independentemente dos filtros selecionados. Os cards de metricas e graficos mostravam sempre o total de Salvador, enquanto o mapa ja respondia aos filtros.

### Solucao Backend

Criado concern `EstablishmentFiltering` (`app/controllers/concerns/establishment_filtering.rb`) com dois metodos privados:

- `apply_establishment_filters(scope)` — aplica os 8 filtros da API a qualquer scope de `HealthEstablishment`
- `split_param(key)` — utilidade para separar parametros multi-valor por virgula

O concern e incluido em `HealthEstablishmentsController` (substituindo o codigo duplicado) e em `DashboardController` (novo). Os tres endpoints do dashboard agora aceitam os mesmos parametros de filtro que o endpoint de estabelecimentos.

**Mudancas no `DashboardController`:**

- `overview`: agora aplica filtros ao scope base antes de computar totais, contagens por tipo, resumo de equipamentos e leitos
- `equipment_by_neighborhood`: filtra os estabelecimentos antes de agregar equipamentos por bairro
- `service_summary`: usa subquery de IDs filtrados para contar servicos apenas nos estabelecimentos correspondentes
- `neighborhoods` (dentro do overview) permanece global — mostra o total de bairros do municipio independente dos filtros, pois e informacao estrutural

### Solucao Frontend

`useDashboard(filters: Filters)` agora recebe os filtros e os inclui como query string nos tres endpoints. O array de dependencias do `useEffect` lista todos os campos de filtro individualmente (igual ao `useEstablishments`), garantindo re-fetch ao mudar qualquer filtro.

Em `DashboardPage`, `useDashboard(filters)` substitui `useDashboard()`, passando o mesmo estado `filters` ja utilizado pelo mapa.

---

## 2. Comparacao de Bairros Sincronizada com Filtros

### Problema

O componente `NeighborhoodComparison` gerenciava seu proprio estado `selectedIds` internamente, sem conexao com o filtro global `neighborhood_id`. Comparar bairros nao afetava o mapa nem os cards.

### Solucao

O estado `selectedIds` foi elevado para `DashboardPage` como `comparisonIds: number[]`. O componente `NeighborhoodComparison` agora recebe dois props:

- `selectedIds: number[]` — bairros selecionados na comparacao
- `onSelectedIdsChange: (ids: number[]) => void` — callback ao mudar selecao

**Sincronizacao (unidirecional — comparacao → filtros):**

Quando o usuario seleciona bairros na comparacao, `handleComparisonIdsChange` em `DashboardPage`:
1. Atualiza `comparisonIds`
2. Atualiza `filters.neighborhood_id` com os IDs separados por virgula
3. Atualiza `selectedNeighborhoodName` para exibir no badge do header

O botao × no header agora chama `handleClearNeighborhood` que limpa tanto o filtro quanto o `comparisonIds`, mantendo consistencia.

A direcao inversa (filtro → comparacao) nao foi implementada para evitar feedback loop: clicar no mapa para selecionar um bairro unico nao precisaria automaticamente abrir a comparacao para aquele bairro.

**Badge de contagem:** O componente exibe `N selecionados` no botao quando ha 2+ bairros selecionados na comparacao.

---

## 3. Click nos Graficos para Filtrar

### Solucao

Quatro graficos receberam props opcionais de callback e comportamento de click:

| Grafico | Prop | Filtro aplicado |
|---------|------|----------------|
| `EstablishmentTypeChart` | `onTypeClick?: (code: string) => void` | `type` |
| `EquipmentByNeighborhoodChart` | `onNeighborhoodClick?: (name: string) => void` | `neighborhood_id` |
| `EquipmentPer10kChart` | `onNeighborhoodClick?: (name: string) => void` | `neighborhood_id` |
| `ServiceSummaryChart` | `onServiceClick?: (code: string) => void` | `service` |

`ChartsPanel` recebe `onFilterChange?: (partial: Partial<Filters>) => void` e:
1. Constroi um `Map<string, string>` de nome de bairro para ID (usando o prop `neighborhoods` ja existente)
2. Implementa `handleNeighborhoodClick(name)` que resolve o ID antes de chamar `onFilterChange`
3. Passa os callbacks para os graficos apenas quando `onFilterChange` esta definido

Os graficos exibem uma dica textual ("Clique em X para filtrar") e aplicam `cursor: pointer` nas barras/setores somente quando o callback esta presente, tornando a interatividade opcional e retrocompativel.

**Recharts onClick:**
- `<Pie onClick={(entry) => ...}>` — recebe o item de dados do setor clicado
- `<Bar onClick={(entry) => ...}>` — recebe o item de dados da barra clicada
- O clique em "Outros" (agregado) no pie chart e ignorado pois nao ha codigo de tipo correspondente

---

## Arquitetura

### Novo Concern

```
app/controllers/concerns/establishment_filtering.rb
```

Extraido de `HealthEstablishmentsController`, incluso em ambos os controllers. Centraliza a logica de filtros evitando duplicacao.

### Fluxo de Dados Atualizado

```
DashboardPage
  ├── filters (state) ──────────────────────────────────┐
  ├── comparisonIds (state) ──────► neighborhood_id      │
  │                                                       │
  ├── useEstablishments(filters) ──► /health_establishments?{params}
  ├── useDashboard(filters) ──────► /dashboard/overview?{params}
  │                                  /dashboard/equipment_by_neighborhood?{params}
  │                                  /dashboard/service_summary?{params}
  │
  ├── NeighborhoodComparison
  │     selectedIds={comparisonIds}
  │     onSelectedIdsChange → atualiza filtros + comparisonIds
  │
  └── ChartsPanel
        onFilterChange → atualiza filtros
        ├── EstablishmentTypeChart (onClick → type filter)
        ├── EquipmentByNeighborhoodChart (onClick → neighborhood_id filter)
        ├── EquipmentPer10kChart (onClick → neighborhood_id filter)
        └── ServiceSummaryChart (onClick → service filter)
```

---

## Testes

- **Backend**: 139 specs (0 falhas). Concern `EstablishmentFiltering` testado indiretamente pelos specs existentes de `health_establishments` e novos cenarios de filtro no `dashboard_spec`.
- **Frontend**: 148 specs (0 falhas). Testes de `useDashboard` atualizados para passar `filters`; testes de `NeighborhoodComparison` atualizados para os novos props; testes de `DashboardPage` refatorados para mock de fetch por URL (mais robusto que mock sequencial).
- **Linters**: RuboCop e ESLint sem erros.
