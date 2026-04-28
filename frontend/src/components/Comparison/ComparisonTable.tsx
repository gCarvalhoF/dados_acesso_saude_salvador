import type { NeighborhoodProperties } from "../../types";

type CellValue = number | string | null;

interface MetricRow {
  label: string;
  key: string;
  getValue: (n: NeighborhoodProperties) => CellValue;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
}

const fmt = (v: number) => v.toLocaleString("pt-BR");
const fmtDecimal = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const fmtArea = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

const METRIC_GROUPS: { title: string; metrics: MetricRow[] }[] = [
  {
    title: "Localização (IBGE)",
    metrics: [
      { label: "Distrito", key: "district_name", getValue: (n) => n.district_name },
      { label: "Subdistrito", key: "subdistrict_name", getValue: (n) => n.subdistrict_name },
      { label: "Área (km²)", key: "area_km2", getValue: (n) => n.area_km2, format: fmtArea },
    ],
  },
  {
    title: "Demografia",
    metrics: [
      { label: "População Total", key: "population_total", getValue: (n) => n.population_total, format: fmt },
      { label: "Pop. Masculina", key: "population_male", getValue: (n) => n.population_male, format: fmt },
      { label: "Pop. Feminina", key: "population_female", getValue: (n) => n.population_female, format: fmt },
      { label: "Densidade Demográfica", key: "demographic_density", getValue: (n) => n.demographic_density, format: fmtDecimal },
    ],
  },
  {
    title: "Cor / Raça",
    metrics: [
      { label: "Branca", key: "population_white", getValue: (n) => n.population_white, format: fmt },
      { label: "Preta", key: "population_black", getValue: (n) => n.population_black, format: fmt },
      { label: "Parda", key: "population_brown", getValue: (n) => n.population_brown, format: fmt },
      { label: "Amarela", key: "population_asian", getValue: (n) => n.population_asian ?? null, format: fmt },
      { label: "Indígena", key: "population_indigenous", getValue: (n) => n.population_indigenous ?? null, format: fmt },
    ],
  },
  {
    title: "Faixa Etária",
    metrics: [
      { label: "0–4 anos", key: "population_0_to_4", getValue: (n) => n.population_0_to_4 ?? null, format: fmt },
      { label: "5–9 anos", key: "population_5_to_9", getValue: (n) => n.population_5_to_9 ?? null, format: fmt },
      { label: "10–14 anos", key: "population_10_to_14", getValue: (n) => n.population_10_to_14 ?? null, format: fmt },
      { label: "15–19 anos", key: "population_15_to_19", getValue: (n) => n.population_15_to_19 ?? null, format: fmt },
      { label: "20–24 anos", key: "population_20_to_24", getValue: (n) => n.population_20_to_24 ?? null, format: fmt },
      { label: "25–29 anos", key: "population_25_to_29", getValue: (n) => n.population_25_to_29 ?? null, format: fmt },
      { label: "30–39 anos", key: "population_30_to_39", getValue: (n) => n.population_30_to_39 ?? null, format: fmt },
      { label: "40–49 anos", key: "population_40_to_49", getValue: (n) => n.population_40_to_49 ?? null, format: fmt },
      { label: "50–59 anos", key: "population_50_to_59", getValue: (n) => n.population_50_to_59 ?? null, format: fmt },
      { label: "60–69 anos", key: "population_60_to_69", getValue: (n) => n.population_60_to_69 ?? null, format: fmt },
      { label: "70+ anos", key: "population_70_or_more", getValue: (n) => n.population_70_or_more ?? null, format: fmt },
    ],
  },
  {
    title: "Cor × Sexo",
    metrics: [
      { label: "Masc. Branca", key: "population_male_white", getValue: (n) => n.population_male_white ?? null, format: fmt },
      { label: "Masc. Preta", key: "population_male_black", getValue: (n) => n.population_male_black ?? null, format: fmt },
      { label: "Masc. Parda", key: "population_male_brown", getValue: (n) => n.population_male_brown ?? null, format: fmt },
      { label: "Masc. Amarela", key: "population_male_asian", getValue: (n) => n.population_male_asian ?? null, format: fmt },
      { label: "Masc. Indígena", key: "population_male_indigenous", getValue: (n) => n.population_male_indigenous ?? null, format: fmt },
      { label: "Fem. Branca", key: "population_female_white", getValue: (n) => n.population_female_white ?? null, format: fmt },
      { label: "Fem. Preta", key: "population_female_black", getValue: (n) => n.population_female_black ?? null, format: fmt },
      { label: "Fem. Parda", key: "population_female_brown", getValue: (n) => n.population_female_brown ?? null, format: fmt },
      { label: "Fem. Amarela", key: "population_female_asian", getValue: (n) => n.population_female_asian ?? null, format: fmt },
      { label: "Fem. Indígena", key: "population_female_indigenous", getValue: (n) => n.population_female_indigenous ?? null, format: fmt },
    ],
  },
  {
    title: "Saúde",
    metrics: [
      { label: "Estabelecimentos", key: "establishments_count", getValue: (n) => n.establishments_count, format: fmt, higherIsBetter: true },
      { label: "Equipamentos", key: "equipment_count", getValue: (n) => n.equipment_count, format: fmt, higherIsBetter: true },
      { label: "Leitos SUS", key: "sus_beds_count", getValue: (n) => n.sus_beds_count, format: fmt, higherIsBetter: true },
    ],
  },
  {
    title: "Indicadores (por 10 mil hab.)",
    metrics: [
      {
        label: "Equipamentos / 10k hab.",
        key: "equip_per_10k",
        getValue: (n) => (n.population_total && n.population_total > 0 ? (n.equipment_count / n.population_total) * 10000 : null),
        format: fmtDecimal,
        higherIsBetter: true,
      },
      {
        label: "Leitos SUS / 10k hab.",
        key: "beds_per_10k",
        getValue: (n) => (n.population_total && n.population_total > 0 ? (n.sus_beds_count / n.population_total) * 10000 : null),
        format: fmtDecimal,
        higherIsBetter: true,
      },
    ],
  },
];

function getHighlightClass(value: CellValue, allValues: CellValue[], higherIsBetter?: boolean): string {
  if (typeof value !== "number") return "";
  const numbers = allValues.filter((v): v is number => typeof v === "number");
  if (numbers.length < 2) return "";

  const max = Math.max(...numbers);
  const min = Math.min(...numbers);
  if (max === min) return "";

  if (higherIsBetter) {
    if (value === max) return "bg-green-50 text-green-800 font-semibold";
    if (value === min) return "bg-red-50 text-red-800";
  }
  return "";
}

function renderCell(value: CellValue, format?: (v: number) => string): string {
  if (value === null || value === "") return "—";
  if (typeof value === "number") return (format ?? fmt)(value);
  return value;
}

interface Props {
  neighborhoods: NeighborhoodProperties[];
}

export default function ComparisonTable({ neighborhoods }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse" data-testid="comparison-table">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-2 px-3 text-gray-500 font-medium min-w-[180px]">Métrica</th>
            {neighborhoods.map((n) => (
              <th key={n.id} className="text-right py-2 px-3 font-bold text-gray-800 min-w-[120px]">
                {n.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRIC_GROUPS.map((group) => (
            <GroupRows key={group.title} group={group} neighborhoods={neighborhoods} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({ group, neighborhoods }: { group: typeof METRIC_GROUPS[number]; neighborhoods: NeighborhoodProperties[] }) {
  return (
    <>
      <tr>
        <td
          colSpan={neighborhoods.length + 1}
          className="pt-3 pb-1 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50"
        >
          {group.title}
        </td>
      </tr>
      {group.metrics.map((metric) => {
        const values = neighborhoods.map((n) => metric.getValue(n));
        return (
          <tr key={metric.key} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-1.5 px-3 text-gray-600">{metric.label}</td>
            {neighborhoods.map((n, i) => {
              const val = values[i];
              const cls = getHighlightClass(val, values, metric.higherIsBetter);
              return (
                <td key={n.id} className={`py-1.5 px-3 text-right tabular-nums ${cls}`}>
                  {renderCell(val, metric.format)}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
