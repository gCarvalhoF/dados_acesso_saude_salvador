import type { FilterOptions, Filters, NeighborhoodCollection } from "../../types";
import FilterCheckbox from "../ui/FilterCheckbox";
import FilterRadioGroup from "../ui/FilterRadioGroup";
import FilterSelect from "../ui/FilterSelect";

interface Props {
  filters: Filters;
  filterOptions: FilterOptions;
  onChange: (partial: Partial<Filters>) => void;
  neighborhoods: NeighborhoodCollection | null;
  totalCount: number;
  loading: boolean;
}

export default function FilterPanel({ filters, filterOptions, onChange, neighborhoods, totalCount, loading }: Props) {
  const neighborhoodOptions = [
    { value: "", label: "Todos os bairros" },
    ...(neighborhoods?.features
      .map((f) => f.properties)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map((n) => ({ value: String(n.id), label: n.name })) ?? []),
  ];

  return (
    <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-800">Filtros</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {loading ? "Carregando..." : `${totalCount} estabelecimentos`}
        </p>
      </div>

      <div className="p-4 space-y-5">
        <FilterSelect
          id="type-select"
          label="Tipo de Estabelecimento"
          value={filters.type}
          options={filterOptions.establishment_types}
          onChange={(type) => onChange({ type })}
        />

        <FilterRadioGroup
          name="legal_nature"
          label="Natureza Jurídica"
          value={filters.legal_nature}
          options={filterOptions.legal_natures}
          onChange={(legal_nature) => onChange({ legal_nature })}
        />

        <FilterSelect
          id="management-select"
          label="Tipo de Gestão"
          value={filters.management}
          options={filterOptions.management_types}
          onChange={(management) => onChange({ management })}
        />

        <FilterSelect
          id="equipment-select"
          label="Equipamento"
          value={filters.equipment}
          options={filterOptions.equipment_items}
          onChange={(equipment) => onChange({ equipment })}
        />

        <FilterSelect
          id="service-select"
          label="Serviço Especializado"
          value={filters.service}
          options={filterOptions.specialized_services}
          onChange={(service) => onChange({ service })}
        />

        <FilterCheckbox
          label="Apenas SUS"
          checked={filters.sus_only}
          onChange={(sus_only) => onChange({ sus_only })}
        />

        <FilterSelect
          id="neighborhood-select"
          label="Bairro"
          value={filters.neighborhood_id}
          options={neighborhoodOptions}
          onChange={(neighborhood_id) => onChange({ neighborhood_id })}
        />

        <button
          className="w-full text-sm text-gray-500 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors"
          onClick={() =>
            onChange({
              type: "",
              legal_nature: "",
              management: "",
              sus_only: false,
              neighborhood_id: "",
              equipment: "",
              service: "",
            })
          }
        >
          Limpar filtros
        </button>
      </div>
    </aside>
  );
}
