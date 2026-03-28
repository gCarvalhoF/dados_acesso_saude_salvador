import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type {
  EquipmentByNeighborhood,
  NeighborhoodCollection,
} from "../../../types";

interface Props {
  equipmentData: EquipmentByNeighborhood[];
  neighborhoods: NeighborhoodCollection | null;
}

export default function EquipmentPer10kChart({
  equipmentData,
  neighborhoods,
}: Props) {
  if (!equipmentData.length || !neighborhoods) return null;

  const popMap = new Map<string, number>();
  for (const f of neighborhoods.features) {
    if (f.properties.population_total && f.properties.population_total > 0) {
      popMap.set(f.properties.name, f.properties.population_total);
    }
  }

  const computed = equipmentData
    .filter((d) => popMap.has(d.neighborhood))
    .map((d) => ({
      neighborhood: d.neighborhood,
      per_10k: Number(
        ((d.total_equipments / popMap.get(d.neighborhood)!) * 10000).toFixed(1)
      ),
    }))
    .sort((a, b) => b.per_10k - a.per_10k)
    .slice(0, 10);

  if (!computed.length) return null;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={computed}
        layout="vertical"
        margin={{ left: 20, right: 20 }}
      >
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
            "por 10 mil hab.",
          ]}
        />
        <Bar dataKey="per_10k" fill="#16a34a" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
