import type { NeighborhoodProperties } from "../../types";

interface MetricRow {
  label: string;
  key: string;
  getValue: (n: NeighborhoodProperties) => number | null;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
}

const fmt = (v: number) => v.toLocaleString("pt-BR");
const fmtDecimal = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

const METRIC_GROUPS: { title: string; metrics: MetricRow[] }[] = [
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
    title: "Renda (domicílios)",
    metrics: [
      { label: "0-2 salários", key: "income_0_2", getValue: (n) => n.income_0_2_wages, format: fmt },
      { label: "2-5 salários", key: "income_2_5", getValue: (n) => n.income_2_5_wages, format: fmt },
      { label: "5-10 salários", key: "income_5_10", getValue: (n) => n.income_5_10_wages, format: fmt },
      { label: "10-20 salários", key: "income_10_20", getValue: (n) => n.income_10_20_wages, format: fmt },
      { label: ">20 salários", key: "income_above_20", getValue: (n) => n.income_above_20_wages, format: fmt },
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

function getHighlightClass(value: number | null, allValues: (number | null)[], higherIsBetter?: boolean): string {
  if (value === null) return "";
  const numbers = allValues.filter((v): v is number => v !== null);
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
                  {val !== null ? (metric.format ?? fmt)(val) : "—"}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
