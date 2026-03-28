import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ServiceSummaryItem } from "../../../types";

interface Props {
  data: ServiceSummaryItem[];
}

export default function ServiceSummaryChart({ data }: Props) {
  if (!data.length) return null;

  const top15 = data.slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={top15}
        layout="vertical"
        margin={{ left: 20, right: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis
          type="category"
          dataKey="name"
          width={180}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(value) => [
            Number(value).toLocaleString("pt-BR"),
            "Estabelecimentos",
          ]}
        />
        <Bar
          dataKey="establishments_count"
          fill="#7c3aed"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
