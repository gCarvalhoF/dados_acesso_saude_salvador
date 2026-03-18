export default function MapLegend() {
  const markerTypes = [
    { color: "#16a34a", label: "USF", shape: "circle" },
    { color: "#2563eb", label: "UBS / Centro de Saúde", shape: "circle" },
    { color: "#dc2626", label: "Hospital Geral", shape: "cross" },
    { color: "#ea580c", label: "Hospital Especializado", shape: "cross" },
    { color: "#b91c1c", label: "Pronto Socorro", shape: "triangle" },
    { color: "#ca8a04", label: "Pronto Atendimento", shape: "triangle" },
    { color: "#7c3aed", label: "Policlínica", shape: "circle" },
    { color: "#6b7280", label: "Outros", shape: "circle" },
  ];

  const choropleth = [
    { color: "#f0f0f0", label: "0 estab." },
    { color: "#c6e9f5", label: "1–2" },
    { color: "#5ab4d6", label: "3–7" },
    { color: "#2378b5", label: "8–14" },
    { color: "#08306b", label: "15+" },
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
