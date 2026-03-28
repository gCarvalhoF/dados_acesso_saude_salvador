import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { EquipmentByNeighborhood } from "../../../types";

interface Props {
  data: EquipmentByNeighborhood[];
}

export default function EquipmentByNeighborhoodChart({ data }: Props) {
  if (!data.length) return null;

  const top15 = data.slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={top15} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis
          type="category"
          dataKey="neighborhood"
          width={140}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(value) => [
            Number(value).toLocaleString("pt-BR"),
            "Equipamentos",
          ]}
        />
        <Bar dataKey="total_equipments" fill="#2378b5" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
