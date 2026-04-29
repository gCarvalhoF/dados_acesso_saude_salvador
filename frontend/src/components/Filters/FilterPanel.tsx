import type { FilterOptions, Filters, NeighborhoodCollection } from "../../types";
import FilterCheckbox from "../ui/FilterCheckbox";
import FilterRadioGroup from "../ui/FilterRadioGroup";
import FilterMultiSelect from "../ui/FilterMultiSelect";
import NeighborhoodComparisonTrigger from "../Comparison/NeighborhoodComparisonTrigger";
import NeighborhoodComparisonInput from "../Comparison/NeighborhoodComparisonInput";
import Spinner from "../ui/Spinner";

interface Props {
  filters: Filters;
  filterOptions: FilterOptions;
  onChange: (partial: Partial<Filters>) => void;
  neighborhoods: NeighborhoodCollection | null;
  totalCount: number;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
  filtersExpanded: boolean;
  onFiltersToggle: () => void;
  comparisonOpen: boolean;
  comparisonIds: number[];
  onComparisonIdsChange: (ids: number[]) => void;
  onComparisonToggle: () => void;
}

function FilterIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}

function CompareIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
      />
    </svg>
  );
}

function ChevronIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function FilterPanel({
  filters,
  filterOptions,
  onChange,
  neighborhoods,
  totalCount,
  loading,
  isOpen,
  onClose,
  collapsed,
  onCollapseToggle,
  filtersExpanded,
  onFiltersToggle,
  comparisonOpen,
  comparisonIds,
  onComparisonIdsChange,
  onComparisonToggle,
}: Props) {
  const comparisonCount = comparisonIds.length;
  const neighborhoodOptions = [
    { value: "", label: "Todos os bairros" },
    ...(neighborhoods?.features
      .map((f) => f.properties)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map((n) => ({
        value: String(n.id),
        label: n.name,
        description: n.city_name ?? undefined,
      })) ?? []),
  ];

  const showLabels = !collapsed;

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
        data-testid="sidebar"
        data-collapsed={collapsed}
        className={`
          fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200
          transform transition-all duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:z-auto
          flex-shrink-0 flex flex-col overflow-y-auto
          ${collapsed ? "w-14" : "w-72"}
        `}
      >
        <div className="p-2 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={onCollapseToggle}
            className="hidden md:inline-flex p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
            aria-label={collapsed ? "Expandir painel lateral" : "Recolher painel lateral"}
            aria-pressed={collapsed}
            title={collapsed ? "Expandir" : "Recolher"}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-gray-600 text-xl leading-none ml-auto"
            aria-label="Fechar painel lateral"
          >
            ×
          </button>
        </div>

        <div className="p-2 space-y-2">
          <button
            onClick={onFiltersToggle}
            className={`w-full flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors ${
              collapsed ? "justify-center p-2" : "px-3 py-2"
            }`}
            aria-expanded={filtersExpanded && !collapsed}
            aria-controls="filters-section"
            aria-label={collapsed ? "Filtros" : undefined}
            title={collapsed ? "Filtros" : undefined}
          >
            <FilterIcon />
            {showLabels && (
              <>
                <span className="flex-1 text-left">Filtros</span>
                <ChevronIcon
                  className={`w-4 h-4 transition-transform ${filtersExpanded ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>

          {showLabels && filtersExpanded && (
            <div id="filters-section" className="px-1 pt-2 space-y-5">
              <p className="text-xs text-gray-500 flex items-center gap-1.5" aria-live="polite">
                {loading ? (
                  <>
                    <Spinner className="w-3 h-3" />
                    <span>Carregando...</span>
                  </>
                ) : (
                  `${totalCount} estabelecimentos`
                )}
              </p>

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
                Redefinir Filtros
              </button>
            </div>
          )}

          <NeighborhoodComparisonTrigger
            open={comparisonOpen}
            selectedCount={comparisonCount}
            onToggle={onComparisonToggle}
            collapsed={collapsed}
            icon={<CompareIcon />}
          />

          {comparisonOpen && !collapsed && (
            <NeighborhoodComparisonInput
              neighborhoods={neighborhoods}
              selectedIds={comparisonIds}
              onSelectedIdsChange={onComparisonIdsChange}
            />
          )}
        </div>
      </aside>
    </>
  );
}
