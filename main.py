import json


def get_bairros(path_to_geojson: str, bairr_key_lower: bool = True) -> list:
    bairros = []

    with open(path_to_geojson) as f:
        bairros_gj = json.load(f)

    for feature in bairros_gj["features"]:
        if bairr_key_lower:
            bairros.append(feature["properties"]["nome_bairr"])
            continue

        bairros.append(feature["properties"]["NOME_BAIRR"])

    return bairros


path_to_file_unidade_de_saude = "data/salvador/unidades_de_saude.geojson"
bairros_unidade_de_saude = get_bairros(path_to_file_unidade_de_saude)

deduped_bairros_unidade_de_saude = list(set(bairros_unidade_de_saude))

path_to_file_censo = "data/salvador/censo/censo_2010_2022_por_bairro.geojson"
bairros_censo = get_bairros(path_to_file_censo, False)

path_to_file_delimitacao = "data/salvador/delimitacao_bairros.geojson"
bairros_delimitacao = get_bairros(path_to_file_delimitacao)

intersection_censo_unidade_saude = [
    x for x in bairros_censo if x in deduped_bairros_unidade_de_saude
]

print(
    f"{len(intersection_censo_unidade_saude)} bairros possuem pelo menos uma unidade de saúde"
)
print(
    f"{len(bairros_censo)} foram registrados até o censo de 2022 segundo o site da prefeitura"
)
print(f"{len(bairros_delimitacao)} bairros foram delimitados pela prefeitura")
