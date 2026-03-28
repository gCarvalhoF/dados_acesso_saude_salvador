# Fase 4 - Refinamentos: Decisoes de Implementacao

## Visao Geral

Fase 4 adiciona tres funcionalidades ao dashboard: classificacao de hospitais de referencia, comparativo entre bairros e responsividade mobile.

## 1. Classificacao de Hospitais de Referencia

### Logica de classificacao

Estabelecimentos sao classificados em 5 categorias de referencia baseadas nos servicos vinculados e habilitacoes SIPAC:

| Categoria | Criterio |
|-----------|----------|
| Hospital de Infeccao | Servicos 106 (DST/HIV/AIDS) **E** 111 (Tuberculose) — ambos necessarios |
| Referencia Cardiovascular | Servico 116 (Cardiologia) |
| Referencia Oncologica | Servico 132 (Oncologia) |
| Referencia Trauma/Ortopedia | Servico 155 (Trauma) |
| Hospital de Ensino | Habilitacao SIPAC codigo 0506 (campo `is_teaching_hospital`) |

### Decisoes

- **`REFERENCE_CATEGORIES` como constante no model**: Centraliza a logica de classificacao. Cada categoria define `service_codes`, `match` (`:all` ou `:any`) ou `column` para consulta por flag booleano.
- **`is_teaching_hospital` como coluna boolean**: A classificacao de Hospital de Ensino vem da tabela `rlEstabSipac` (habilitacao 0506), que nao e um servico especializado. Uma coluna booleana e mais simples e performante que importar toda a tabela SIPAC.
- **Importacao no CnesImporter**: O step `import_teaching_hospitals` roda apos importar estabelecimentos, lendo `rlEstabSipac202508.csv` e filtrando por Salvador + codigo 0506.
- **`reference_categories` no index e show**: Incluido em todas as respostas da API (nao so no detalhe) para permitir badges nos marcadores e filtragem sem request adicional.
- **Scope `by_reference_category`**: Para `hospital_infeccao` usa `HAVING COUNT(DISTINCT) = 2` para exigir ambos servicos. Para categorias simples usa `joins + where`. Para `hospital_ensino` usa `where(is_teaching_hospital: true)`.

## 2. Comparativo entre Bairros

### Endpoint `GET /api/v1/neighborhoods/compare?ids=1,2,3`

- Aceita ate 5 IDs (deduplicados), minimo 2
- Retorna propriedades dos bairros sem geometria (leve)
- Inclui `equipment_count` precomputado via query agregada
- Retorna 422 se menos de 2 IDs

### Frontend

- **MultiSelect**: Componente generico com dropdown, checkboxes, busca textual, chips para selecionados, limite maximo configuravel
- **ComparisonTable**: Tabela com bairros como colunas e metricas como linhas. Metricas agrupadas em: Demografia, Renda, Saude, Indicadores derivados (por 10k hab.). Destaque verde/vermelho para melhor/pior valor por linha.
- **NeighborhoodComparison**: Secao colapsavel entre MetricCards e mapa. Toggle "Comparar Bairros" expande o seletor + tabela.

### Decisoes

- **Secao colapsavel vs modal**: Secao inline segue o padrao de scroll vertical do layout existente. Comeca colapsada para nao poluir a visao inicial.
- **Metricas derivadas client-side**: Equipamentos/10k e Leitos/10k sao calculados no frontend a partir dos dados ja disponveis, evitando endpoint extra.
- **Maximo de 5 bairros**: Limita complexidade visual da tabela. Enforced tanto no backend (`.first(5)`) quanto no frontend (desabilita checkboxes).

## 3. Responsividade Mobile

### Breakpoints

| Viewport | Comportamento |
|----------|--------------|
| < 768px (mobile) | FilterPanel como drawer overlay, mapa 300px, header com botao de filtro |
| >= 768px (tablet/desktop) | FilterPanel como sidebar fixa, mapa 500px |

### Decisoes

- **FilterPanel como drawer**: No mobile, o painel de filtros e posicionado como overlay fixo (`fixed inset-y-0 left-0 z-40`) com backdrop semi-transparente. Transicao CSS `translate-x` para slide-in/out suave.
- **Props `isOpen`/`onClose`**: O FilterPanel recebe estado do DashboardPage. No desktop (`md:`), classes Tailwind forçam posicao estatica e visibilidade, ignorando o estado `isOpen`.
- **Botao filtro no header**: Icone de filtro (funnel SVG) visivel apenas no mobile (`md:hidden`).
- **MetricCards e ChartsPanel**: Ja usavam classes responsivas (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6`), sem mudancas necessarias.
- **Choropleth selector**: Adicionado `flex-wrap` para evitar overflow em telas estreitas.

## Testes

- **Backend**: 134 specs (0 falhas), incluindo model specs para `reference_categories` e `by_reference_category`, request specs para filtro e compare endpoint
- **Frontend**: 123 specs (0 falhas), incluindo testes para MultiSelect, ComparisonTable, NeighborhoodComparison, badges de referencia, drawer mobile
- **Linters**: RuboCop e ESLint sem erros

## Novos Endpoints

```
GET /api/v1/neighborhoods/compare?ids=1,2,3   # Comparativo entre bairros (max 5)
```

## Novos Filtros

```
GET /api/v1/health_establishments?reference_category=referencia_cardiovascular
GET /api/v1/filter_options  → inclui reference_categories
```
