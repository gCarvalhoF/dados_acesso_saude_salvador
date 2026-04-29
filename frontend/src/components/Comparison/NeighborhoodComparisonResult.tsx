import { useNeighborhoodComparison } from "../../hooks/useNeighborhoodComparison";
import ComparisonTable from "./ComparisonTable";
import Spinner from "../ui/Spinner";

interface Props {
  selectedIds: number[];
}

export default function NeighborhoodComparisonResult({ selectedIds }: Props) {
  const { data, loading } = useNeighborhoodComparison(selectedIds);

  if (selectedIds.length < 2) return null;

  return (
    <section
      data-testid="neighborhood-comparison-result"
      className="bg-white rounded-lg shadow-sm border border-gray-100"
    >
      <header className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Comparativo de Bairros</h2>
      </header>

      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4">
            <Spinner className="w-4 h-4" />
            <span>Carregando comparativo...</span>
          </div>
        )}

        {!loading && data && data.length >= 2 && <ComparisonTable neighborhoods={data} />}
      </div>
    </section>
  );
}
