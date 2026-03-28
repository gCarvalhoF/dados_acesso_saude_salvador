import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { code: string; name: string; count: number }[];
}

const COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#ea580c", "#7c3aed",
  "#ca8a04", "#0891b2", "#b91c1c", "#6b7280", "#d946ef",
];

export default function EstablishmentTypeChart({ data }: Props) {
  if (!data.length) return null;

  const sorted = [...data].sort((a, b) => b.count - a.count);
  const top9 = sorted.slice(0, 9);
  const rest = sorted.slice(9);
  const chartData =
    rest.length > 0
      ? [...top9, { code: "outros", name: "Outros", count: rest.reduce((sum, d) => sum + d.count, 0) }]
      : top9;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${(name ?? "").length > 20 ? (name ?? "").slice(0, 20) + "…" : name} (${((percent ?? 0) * 100).toFixed(0)}%)`
          }
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => Number(value).toLocaleString("pt-BR")} />
      </PieChart>
    </ResponsiveContainer>
  );
}
