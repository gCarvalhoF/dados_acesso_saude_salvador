# Fase 5 - Filtros Globais, Interatividade nos Graficos e Refinamentos de UX: Decisoes de Implementacao

## Visao Geral

Fase 5 corrige lacunas de UX identificadas nos feedbacks: os filtros nao afetavam os cards de metricas nem os graficos, a comparacao de bairros era independente dos filtros globais, e os graficos eram apenas visualizacao sem possibilidade de interacao para filtrar. Numa segunda iteracao, a fase tambem entrega refinamentos visuais e de navegacao: clustering de marcadores no mapa, threshold de relevancia no grafico de pizza, sidebar collapsivel em modo rail, e separacao da UI de comparacao entre sidebar (seletor) e dashboard (tabela).

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

## Testes (iteracao 1)

- **Backend**: 139 specs (0 falhas). Concern `EstablishmentFiltering` testado indiretamente pelos specs existentes de `health_establishments` e novos cenarios de filtro no `dashboard_spec`.
- **Frontend**: 148 specs (0 falhas). Testes de `useDashboard` atualizados para passar `filters`; testes de `NeighborhoodComparison` atualizados para os novos props; testes de `DashboardPage` refatorados para mock de fetch por URL (mais robusto que mock sequencial).
- **Linters**: RuboCop e ESLint sem erros.

---

## 4. Clustering de Marcadores no Mapa

### Problema

Com muitos estabelecimentos no mesmo bairro os marcadores se sobrepunham, tornando o mapa ilegivel em zoom baixo.

### Solucao

Adicionada dependencia `react-leaflet-cluster` (wrapper de `leaflet.markercluster`). Os marcadores em `EstablishmentMarkers` foram envolvidos em `<MarkerClusterGroup>`:

```tsx
<MarkerClusterGroup chunkedLoading showCoverageOnHover={false} spiderfyOnMaxZoom maxClusterRadius={50}>
  {markers}
</MarkerClusterGroup>
```

`InteractiveMap` importa os estilos CSS do markercluster (`MarkerCluster.css` e `MarkerCluster.Default.css`).

Para os testes, criado mock em `frontend/src/test/mocks/react-leaflet-cluster.tsx` que renderiza um `<div data-testid="marker-cluster-group">` passando os filhos diretamente, evitando dependencia do DOM do Leaflet nos testes unitarios.

---

## 5. Grafico de Pizza com Threshold de 5%

### Problema

O grafico de pizza de tipos de estabelecimento exibia fatias muito pequenas com labels ilegíveis, poluindo a visualizacao com dados pouco relevantes.

### Solucao

Substituida a logica de "top 9 + outros" por um filtro baseado em percentual minimo:

```tsx
const total = data.reduce((sum, d) => sum + d.count, 0);
const above = sorted.filter((d) => total > 0 && d.count / total >= 0.05);
const below = sorted.filter((d) => total > 0 && d.count / total < 0.05);
const othersTotal = below.reduce((sum, d) => sum + d.count, 0);
const chartData =
  total > 0 && othersTotal / total >= 0.05
    ? [...above, { code: "outros", name: "Outros", count: othersTotal }]
    : above;
```

Fatias que representam menos de 5% do total sao excluidas do grafico inteiramente (nao apenas dos labels). Se o agregado dos excluidos for >= 5%, eles aparecem como uma unica fatia "Outros"; caso contrario sao descartados. O componente retorna `null` se nao sobrar nenhuma fatia.

---

## 6. Sidebar Collapsivel em Modo Rail

### Problema

A sidebar ocupava espaco fixo mesmo quando o usuario nao precisava dos filtros, reduzindo a area util do mapa e dos graficos.

### Solucao

A sidebar agora opera em dois modos controlados por `sidebarCollapsed: boolean` em `DashboardPage`:

| Estado | Largura | Conteudo |
|--------|---------|---------|
| Expandida | `w-72` (288 px) | Icone + label nos botoes, conteudo dos paineis |
| Recolhida (rail) | `w-14` (56 px) | Somente icones, sem labels, sem conteudo aberto |

O botao de colapso usa `aria-label="Expandir painel lateral"` / `"Recolher painel lateral"` e `aria-pressed` para acessibilidade. No modo rail os botoes internos recebem `aria-label` e `title` para leitores de tela.

A funcao `handleFiltersToggle` em `DashboardPage` expande automaticamente a sidebar se ela estiver recolhida quando o usuario clicar em Filtros, evitando o estado incoerente de filtros abertos num rail estreito.

**Estado default**: sidebar recolhida (`sidebarCollapsed = true`) e filtros fechados (`filtersExpanded = false`), priorizando a area de visualizacao ao carregar a pagina.

---

## 7. Dois Botoes de Navegacao na Sidebar

### Problema

A sidebar tinha apenas os filtros. O botao "Comparar Bairros" ficava no topo do dashboard, fora do padrão de navegacao.

### Solucao

Dois botoes toggle na sidebar, com icones SVG inline:

- **Filtros** (`FilterIcon` — funil) — expande/recolhe o painel de filtros abaixo
- **Comparar Bairros** (`CompareIcon` — setas) — abre/fecha a UI de comparacao

Os filtros sao renderizados entre os dois botoes, empurrando "Comparar Bairros" para baixo quando expandidos, mantendo a hierarquia visual de acoes.

O icone da bandeira de Salvador foi adicionado ao header, a esquerda do titulo "Saude em Salvador", como identidade visual da aplicacao.

---

## 8. Separacao da UI de Comparacao

### Problema

O componente `NeighborhoodComparison` combinava seletor de bairros e tabela de comparacao num unico bloco, ocupando espaco no dashboard mesmo quando o usuario nao estava comparando bairros.

### Solucao

O componente foi dividido em tres pecas com responsabilidades distintas:

| Componente | Local | Responsabilidade |
|-----------|-------|-----------------|
| `NeighborhoodComparisonTrigger` | Sidebar | Botao toggle com badge de contagem |
| `NeighborhoodComparisonInput` | Sidebar (abaixo do trigger quando aberto) | Multiselect de bairros + texto de ajuda |
| `NeighborhoodComparisonResult` | Dashboard (area principal) | Cabecalho + loading + `ComparisonTable` |

`NeighborhoodComparisonResult` retorna `null` quando menos de 2 bairros estao selecionados e oculta a tabela durante o loading mesmo que `data` ainda exista do estado anterior, evitando flash de dados desatualizados.

O estado `comparisonOpen` em `DashboardPage` controla se o seletor aparece na sidebar; `comparisonIds` sincroniza com `filters.neighborhood_id` como antes (secao 2).

Os componentes antigos `NeighborhoodComparison` e `NeighborhoodComparisonPanel` foram removidos.

---

## Arquitetura Atualizada

```
DashboardPage
  ├── filters (state) ──────────────────────────────────────┐
  ├── comparisonIds (state) ──────► neighborhood_id          │
  ├── sidebarCollapsed (state, default: true)                │
  ├── filtersExpanded  (state, default: false)               │
  ├── comparisonOpen   (state)                               │
  │                                                          │
  ├── useEstablishments(filters) ──► /health_establishments?{params}
  ├── useDashboard(filters) ──────► /dashboard/overview?{params}
  │                                  /dashboard/equipment_by_neighborhood?{params}
  │                                  /dashboard/service_summary?{params}
  │
  ├── FilterPanel (sidebar)
  │     ├── [Filtros button] → filtersExpanded toggle
  │     ├── {filtersExpanded} filtros + contagem + Redefinir
  │     ├── NeighborhoodComparisonTrigger → comparisonOpen toggle
  │     └── {comparisonOpen} NeighborhoodComparisonInput
  │
  └── main
        ├── MetricCards
        ├── {comparisonOpen && ids>=2} NeighborhoodComparisonResult
        ├── InteractiveMap
        │     └── EstablishmentMarkers → MarkerClusterGroup
        └── ChartsPanel
              └── EstablishmentTypeChart (fatias >= 5%)
```

---

## Testes (iteracao 2)

- **Frontend**: 181 specs (0 falhas).
  - `NeighborhoodComparisonResult.test.tsx` — novo; cobre loading, tabela, demograficos, fallback `—`, e supressao da tabela durante re-fetch.
  - `NeighborhoodComparisonInput.test.tsx` — novo; cobre renderizacao do multiselect, mensagem de minimo 2 bairros, nome da cidade nas opcoes, e propagacao de mudancas.
  - `DashboardPage.test.tsx` — testes de painel de filtros e botao Comparar atualizados para usar `getByRole("button", { name: ... })` (aria-label) dado que a sidebar agora inicia recolhida; testes de interacao com filtros passaram a usar helper `expandFilters` que expande sidebar e filtros antes de interagir.
  - `FilterPanel.test.tsx` — props `comparisonIds`, `onComparisonIdsChange`, `collapsed`, `onCollapseToggle`, `filtersExpanded`, `onFiltersToggle` adicionados ao helper `renderPanel`.
- **Linters**: ESLint sem erros.
