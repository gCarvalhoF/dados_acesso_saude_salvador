import type { FilterOptions, Filters, NeighborhoodCollection } from "../../types";
import FilterCheckbox from "../ui/FilterCheckbox";
import FilterRadioGroup from "../ui/FilterRadioGroup";
import FilterMultiSelect from "../ui/FilterMultiSelect";

interface Props {
  filters: Filters;
  filterOptions: FilterOptions;
  onChange: (partial: Partial<Filters>) => void;
  neighborhoods: NeighborhoodCollection | null;
  totalCount: number;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterPanel({ filters, filterOptions, onChange, neighborhoods, totalCount, loading, isOpen, onClose }: Props) {
  const neighborhoodOptions = [
    { value: "", label: "Todos os bairros" },
    ...(neighborhoods?.features
      .map((f) => f.properties)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map((n) => ({ value: String(n.id), label: n.name })) ?? []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onClose}
          data-testid="filter-backdrop"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:z-auto
          flex-shrink-0 flex flex-col overflow-y-auto
        `}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">Filtros</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {loading ? "Carregando..." : `${totalCount} estabelecimentos`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Fechar filtros"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-5">
          <FilterMultiSelect
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

          <FilterMultiSelect
            id="management-select"
            label="Tipo de Gestão"
            value={filters.management}
            options={filterOptions.management_types}
            onChange={(management) => onChange({ management })}
          />

          <FilterMultiSelect
            id="equipment-select"
            label="Equipamento"
            value={filters.equipment}
            options={filterOptions.equipment_items}
            onChange={(equipment) => onChange({ equipment })}
          />

          <FilterMultiSelect
            id="service-select"
            label="Serviço Especializado"
            value={filters.service}
            options={filterOptions.specialized_services}
            onChange={(service) => onChange({ service })}
          />

          <FilterMultiSelect
            id="reference-category-select"
            label="Referência Hospitalar"
            value={filters.reference_category}
            options={filterOptions.reference_categories}
            onChange={(reference_category) => onChange({ reference_category })}
          />

          <FilterCheckbox
            label="Apenas SUS"
            checked={filters.sus_only}
            onChange={(sus_only) => onChange({ sus_only })}
          />

          <FilterMultiSelect
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
                type: "01,02,04,05,32",
                legal_nature: "",
                management: "",
                sus_only: false,
                neighborhood_id: "",
                equipment: "",
                service: "",
                reference_category: "",
              })
            }
          >
            Limpar filtros
          </button>
        </div>
      </aside>
    </>
  );
}
