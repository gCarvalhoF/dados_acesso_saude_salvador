# Mapa interativo

# Design de dados

- [Modelagem de dados](https://dbdiagram.io/d/dados_acesso_saude_salvador-67ff0b469cea640381de5f95)
- Tradução das colunas úteis
  - populacao_total (B001)
  - populacao_masculina (B002)
  - populacao_feminina (B003)
  - densidade_demografica (B004)
  - populacao_de_0_a_6_anos (B005)
  - populacao_de_7_a_14_anos (B006)
  - populacao_de_15_a_18_anos (B007)
  - populacao_de_19_a_24_anos (B008)
  - populacao_de_25_a_49_anos (B009)
  - populacao_de_50_a_64_anos (B010)
  - populacao_acima_de_65_anos (B011)
  - populacao_branca (B013)
  - populacao_preta (B014)
  - populacao_amarela (B015)
  - populacao_parda (B016)
  - populacao_indigena (B017)
  - renda_0_2_salarios (B055)
  - renda_2_5_salarios (B056)
  - renda_5_10_salarios (B057)
  - renda_10_20_salarios (B057)
  - renda_acima_de_20_salarios (B057)

# Notes

- Tentar contato com um epidemiologista para entender os dados
- Retomar como foi feito o mapeamento dos dados
- Adicionar dados de sinistro de trânsito
- Explorar site da secretaria de saúde pra verificar os dados lá presentes, pra criar uma justificativa do trabalho
- Dados de equipamentos (ponto de acesso) odontológicos

- Focar no referencial bibliográfico
- Buscar o CIDACS fiocruz
- CIDACS PDD -> Possivel api de dados de saúde

- Unidades federais e estaduais
  - Possível detecção por meio da base de dados do CNES
    - Ao comparar a natureza jurídica de unidades em salvador é possível achar as entidades públicas que regem estabelecimentos de saúde pública
    - `tbNaturezaJuridica202508.csv` para checar as possíveis naturezas da base de dados
    - `tbMunicipio202508.csv` para checar o código do município de Salvador
    - `tbEstabelecimento202508.csv` usando os valores dos arquivos acima é possível filtrar a tabela para estabelecimentos operados pelo poder público em Salvador.

# Action items importantes

- Encontrar o Plano de Saúde Municipal de Salvador
  - é possível achar (tanto municipal quanto estadual) em digisusgmp.saude.gov.br/v1.5/transparencia/downloads
- Encontrar o Plano de Dados Abertos de Salvador

# Pontos de melhoria em aberto

- Dados do município
  - Imunização
    - Doses aplicadas
    - Abrangencia
  - Epidemiologia
    - Dengue
    - Aids
    - Tuberculose


### Novo foco a partir da reunião com Prof Navarro.
Mapear Números de equipamentos, como mamografos, tomografos, etc

Adicionar no mapa tipos de atendimentos nos equipamentos da saúde
  - Hospitais específicos e de referência
  - Hospitais de infecção
  - Hospitais de peçonha
  - Diferenciar uma UBS e USF

Bases para pesquisa:
DataSUS
	Tabwin

IBGE
	Dar uma olhada nos microdados que podem trazer dados de saúde

### Ideia pra ou futuros trabalhos ou DIFERENCIAL

Adicionar uma conexão MCP para que usuários possam explorar os dados do CNES por meio de seus LLM chat preferidos ou AI Agents

Automatizar scraping e importing de dados do CNES para manter os dados atualizados (Pesquisar a frequência que os dados do CNES são atualizados e decidir o intervalo de tempo)

#### Feedbacks

1. Feedbacks sobre filtros ✅
- [x] Aplicar os filtros de bairros no dashboard inteiro ao comparar bairros
- [x] Aplicar os filtros na página inteira (mapa, gráficos e cards no header)
- [x] Adicionar o comportamento de clicar na legenda ou nos gráficos e automaticamente filtrar o mapa

2. Tasks referentes ao backend
Investigar performance
Investigar os pontos que estão nos lugares errado do mapa (uns aparecem na cidade errada, outros no meio do mar)

3. Mudanças de UI/UX
Colocar o botão de comparar bairros na sidebar
Mudar o gráfico de torta pra mostrar somente labels acima de 5%
Revisitar estilo do loading (Talvez um spinner com mais contraste)
Revisitar os textos de limpar os filtros, remover da barra de pesquisa e colocar do lado "de fora" do filtro
Implementar clustering de pontos do leaflet

4. Feedbacks sobre coisas internas ao mapa
Diminuir ou adicionar a habilidade de ligar/desligar os pontos no mapa
Padronizar os símbolos e cores do mapa
Melhorar visualização dos tooltips internos do mapa

# Material de leitura importante

[How to design dashboards](https://code.likeagirl.io/dashboard-design-lessons-i-gained-from-exploring-100-impressive-dashboard-examples-25f31ee43ca3)
