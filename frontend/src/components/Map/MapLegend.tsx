import { useMemo, useState } from "react";
import { markerColors } from "../../styles/theme";
import type { ChoroplethMetric, NeighborhoodCollection } from "../../types";
import { METRIC_LABELS, formatBinLabels } from "./NeighborhoodLayer";

interface Props {
  metric: ChoroplethMetric;
  neighborhoods: NeighborhoodCollection | null;
}

function computeBinsForLegend(
  neighborhoods: NeighborhoodCollection | null,
  metric: ChoroplethMetric
): number[] {
  if (!neighborhoods) return [1, 2, 3, 4];
  const values = neighborhoods.features
    .map((f) => (f.properties[metric] as number) ?? 0)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  if (values.length === 0) return [1, 2, 3, 4];
  const percentile = (p: number) => {
    const idx = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, idx)];
  };
  const bins = [percentile(20), percentile(40), percentile(60), percentile(80)];
  const unique = [bins[0]];
  for (let i = 1; i < bins.length; i++) {
    if (bins[i] > unique[unique.length - 1]) {
      unique.push(bins[i]);
    } else {
      unique.push(unique[unique.length - 1] + 1);
    }
  }
  return unique;
}

export default function MapLegend({ metric, neighborhoods }: Props) {
  const markerTypes = [
    { color: markerColors.usf, label: "USF" },
    { color: markerColors.ubs, label: "UBS / Centro de Saúde" },
    { color: markerColors.hospitalGeral, label: "Hospital Geral" },
    { color: markerColors.hospitalEspecializado, label: "Hospital Especializado" },
    { color: markerColors.prontoSocorro, label: "Pronto Socorro" },
    { color: markerColors.prontoAtendimento, label: "Pronto Atendimento" },
    { color: markerColors.policlinica, label: "Policlínica" },
    { color: markerColors.default, label: "Outros" },
  ];

  const bins = useMemo(
    () => computeBinsForLegend(neighborhoods, metric),
    [neighborhoods, metric]
  );
  const choropleth = useMemo(() => formatBinLabels(bins, metric), [bins, metric]);

  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="absolute bottom-2 right-2 z-[400] bg-white rounded-lg shadow-md text-xs max-w-[200px]">
      <button
        type="button"
        className="md:hidden w-full flex items-center justify-between p-2 font-bold text-gray-700"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-label="Alternar legenda"
      >
        <span>Legenda</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`${collapsed ? "max-md:hidden" : "block"} p-3`}>
        <p className="font-bold text-gray-700 mb-2">Marcadores</p>
        <ul className="space-y-1 mb-3">
          {markerTypes.map(({ color, label }) => (
            <li key={label} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-600">{label}</span>
            </li>
          ))}
        </ul>

        <p className="font-bold text-gray-700 mb-2">
          {METRIC_LABELS[metric]} por bairro
        </p>
        <ul className="space-y-1">
          {choropleth.map(({ color, label }) => (
            <li key={label} className="flex items-center gap-1.5">
              <span
                className="inline-block w-4 h-3 flex-shrink-0 border border-gray-300"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-600">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
