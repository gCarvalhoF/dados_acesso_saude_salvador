import { markerColors, choroplethColors } from "../../styles/theme";

export default function MapLegend() {
  const markerTypes = [
    { color: markerColors.usf,                  label: "USF" },
    { color: markerColors.ubs,                  label: "UBS / Centro de Saúde" },
    { color: markerColors.hospitalGeral,         label: "Hospital Geral" },
    { color: markerColors.hospitalEspecializado, label: "Hospital Especializado" },
    { color: markerColors.prontoSocorro,         label: "Pronto Socorro" },
    { color: markerColors.prontoAtendimento,     label: "Pronto Atendimento" },
    { color: markerColors.policlinica,           label: "Policlínica" },
    { color: markerColors.default,              label: "Outros" },
  ];

  const choropleth = [
    { color: choroplethColors[0], label: "0 estab." },
    { color: choroplethColors[1], label: "1–2" },
    { color: choroplethColors[2], label: "3–7" },
    { color: choroplethColors[3], label: "8–14" },
    { color: choroplethColors[4], label: "15+" },
  ];

  return (
    <div className="absolute bottom-6 right-2 z-[400] bg-white rounded-lg shadow-md p-3 text-xs max-w-[180px]">
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

      <p className="font-bold text-gray-700 mb-2">Estab. por bairro</p>
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
  );
}
