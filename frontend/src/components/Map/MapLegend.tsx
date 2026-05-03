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

type Shape = "circle" | "cross" | "triangle";

function MarkerShape({ color, shape }: { color: string; shape: Shape }) {
  if (shape === "cross") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
        <rect x="5.5" y="1.5" width="3" height="11" fill="white" rx="0.75" />
        <rect x="1.5" y="5.5" width="11" height="3" fill="white" rx="0.75" />
        <rect x="6" y="2" width="2" height="10" fill={color} rx="0.5" />
        <rect x="2" y="6" width="10" height="2" fill={color} rx="0.5" />
      </svg>
    );
  }
  if (shape === "triangle") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
        <polygon points="7,1.5 12.5,12.5 1.5,12.5" fill={color} stroke="white" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
      <circle cx="7" cy="7" r="5.5" fill={color} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export default function MapLegend({ metric, neighborhoods }: Props) {
  const markerTypes: { color: string; label: string; shape: Shape }[] = [
    { color: markerColors.usf,                   label: "USF",                    shape: "circle"   },
    { color: markerColors.ubs,                   label: "UBS / Centro de Saúde",  shape: "circle"   },
    { color: markerColors.hospitalGeral,         label: "Hospital Geral",         shape: "cross"    },
    { color: markerColors.hospitalEspecializado, label: "Hospital Especializado", shape: "cross"    },
    { color: markerColors.prontoSocorro,         label: "Pronto Socorro",         shape: "triangle" },
    { color: markerColors.prontoAtendimento,     label: "Pronto Atendimento",     shape: "triangle" },
    { color: markerColors.policlinica,           label: "Policlínica",            shape: "circle"   },
    { color: markerColors.caps,                  label: "CAPS",                   shape: "circle"   },
    { color: markerColors.default,               label: "Outros",                 shape: "circle"   },
  ];

  const bins = useMemo(
    () => computeBinsForLegend(neighborhoods, metric),
    [neighborhoods, metric]
  );
  const choropleth = useMemo(() => formatBinLabels(bins, metric), [bins, metric]);

  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-md text-xs max-w-[200px]">
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
          {markerTypes.map(({ color, label, shape }) => (
            <li key={label} className="flex items-center gap-1.5">
              <MarkerShape color={color} shape={shape} />
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
