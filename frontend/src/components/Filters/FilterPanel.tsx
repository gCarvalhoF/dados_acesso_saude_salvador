import type { Filters, NeighborhoodCollection } from "../../types";
import { ESTABLISHMENT_TYPES, LEGAL_NATURES, MANAGEMENT_TYPES } from "../../types";

interface Props {
  filters: Filters;
  onChange: (partial: Partial<Filters>) => void;
  neighborhoods: NeighborhoodCollection | null;
  totalCount: number;
  loading: boolean;
}

export default function FilterPanel({ filters, onChange, neighborhoods, totalCount, loading }: Props) {
  return (
    <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-800">Filtros</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {loading ? "Carregando..." : `${totalCount} estabelecimentos`}
        </p>
      </div>

      <div className="p-4 space-y-5">
        {/* Tipo de estabelecimento */}
        <div>
          <label htmlFor="type-select" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
            Tipo de Estabelecimento
          </label>
          <select
            id="type-select"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={filters.type}
            onChange={(e) => onChange({ type: e.target.value })}
          >
            {Object.entries(ESTABLISHMENT_TYPES).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        {/* Natureza Jurídica */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
            Natureza Jurídica
          </label>
          <div className="space-y-1">
            {Object.entries(LEGAL_NATURES).map(([code, label]) => (
              <label key={code} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="legal_nature"
                  value={code}
                  checked={filters.legal_nature === code}
                  onChange={() => onChange({ legal_nature: code })}
                  className="accent-blue-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Gestão */}
        <div>
          <label htmlFor="management-select" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
            Tipo de Gestão
          </label>
          <select
            id="management-select"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={filters.management}
            onChange={(e) => onChange({ management: e.target.value })}
          >
            {Object.entries(MANAGEMENT_TYPES).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        {/* Disponível no SUS */}
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.sus_only}
              onChange={(e) => onChange({ sus_only: e.target.checked })}
              className="w-4 h-4 accent-green-600"
            />
            <span className="font-medium">Apenas SUS</span>
          </label>
        </div>

        {/* Bairro */}
        <div>
          <label htmlFor="neighborhood-select" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
            Bairro
          </label>
          <select
            id="neighborhood-select"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={filters.neighborhood_id}
            onChange={(e) => onChange({ neighborhood_id: e.target.value })}
          >
            <option value="">Todos os bairros</option>
            {neighborhoods?.features
              .map((f) => f.properties)
              .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
              .map((n) => (
                <option key={n.id} value={String(n.id)}>{n.name}</option>
              ))}
          </select>
        </div>

        {/* Limpar filtros */}
        <button
          className="w-full text-sm text-gray-500 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors"
          onClick={() =>
            onChange({
              type: "",
              legal_nature: "",
              management: "",
              sus_only: false,
              neighborhood_id: "",
            })
          }
        >
          Limpar filtros
        </button>
      </div>
    </aside>
  );
}
