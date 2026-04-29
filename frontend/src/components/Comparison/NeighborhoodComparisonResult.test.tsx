import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import NeighborhoodComparisonResult from "./NeighborhoodComparisonResult";
import { mockNeighborhoods } from "../../test/fixtures";
import type { NeighborhoodProperties } from "../../types";

vi.mock("../../hooks/useNeighborhoodComparison", () => ({
  useNeighborhoodComparison: vi.fn(),
}));

import { useNeighborhoodComparison } from "../../hooks/useNeighborhoodComparison";

function mockHook(state: { data: NeighborhoodProperties[] | null; loading: boolean; error: string | null }) {
  vi.mocked(useNeighborhoodComparison).mockReturnValue(state);
}

describe("NeighborhoodComparisonResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook({ data: null, loading: false, error: null });
  });

  it("não renderiza nada quando menos de 2 bairros selecionados", () => {
    const { container } = render(<NeighborhoodComparisonResult selectedIds={[1]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza o cabeçalho 'Comparativo de Bairros' quando 2+ ids selecionados", () => {
    render(<NeighborhoodComparisonResult selectedIds={[1, 2]} />);
    expect(screen.getByRole("heading", { name: "Comparativo de Bairros" })).toBeInTheDocument();
  });

  it("exibe loading quando dados estão sendo buscados", () => {
    mockHook({ data: null, loading: true, error: null });
    render(<NeighborhoodComparisonResult selectedIds={[1, 2]} />);
    expect(screen.getByText("Carregando comparativo...")).toBeInTheDocument();
  });

  it("renderiza a tabela de comparação quando dados estão disponíveis", () => {
    const comparisonData = mockNeighborhoods.features.map((f) => f.properties);
    mockHook({ data: comparisonData, loading: false, error: null });
    render(<NeighborhoodComparisonResult selectedIds={[1, 2]} />);
    expect(screen.getByTestId("comparison-table")).toBeInTheDocument();
    expect(screen.getByText("População Total")).toBeInTheDocument();
  });

  it("exibe nomes dos bairros na tabela", () => {
    const comparisonData = mockNeighborhoods.features.map((f) => f.properties);
    mockHook({ data: comparisonData, loading: false, error: null });
    render(<NeighborhoodComparisonResult selectedIds={[1, 2]} />);
    const table = screen.getByTestId("comparison-table");
    expect(table.innerHTML).toContain("Pituba");
    expect(table.innerHTML).toContain("Barra");
  });

  it("calcula indicadores por 10k habitantes", () => {
    const comparisonData = mockNeighborhoods.features.map((f) => f.properties);
    mockHook({ data: comparisonData, loading: false, error: null });
    render(<NeighborhoodComparisonResult selectedIds={[1, 2]} />);
    expect(screen.getByText("Equipamentos / 10k hab.")).toBeInTheDocument();
    expect(screen.getByText("Leitos SUS / 10k hab.")).toBeInTheDocument();
  });

  it("renderiza grupos de demografia detalhada", () => {
    const comparisonData = mockNeighborhoods.features.map((f) => f.properties);
    mockHook({ data: comparisonData, loading: false, error: null });
    render(<NeighborhoodComparisonResult selectedIds={[1, 2]} />);

    expect(screen.getByText("Cor / Raça")).toBeInTheDocument();
    expect(screen.getByText("Faixa Etária")).toBeInTheDocument();
    expect(screen.getByText("Cor × Sexo")).toBeInTheDocument();
  });

  it("exibe '—' para campos demográficos ausentes", () => {
    const sparse = mockNeighborhoods.features.map((f) => {
      const copy = { ...f.properties };
      delete copy.population_asian;
      delete copy.population_0_to_4;
      delete copy.population_male_white;
      return copy;
    });
    mockHook({ data: sparse, loading: false, error: null });
    render(<NeighborhoodComparisonResult selectedIds={[1, 2]} />);
    const table = screen.getByTestId("comparison-table");
    expect(table.textContent).toContain("—");
  });

  it("não exibe a tabela durante o loading mesmo se data ainda existir do estado anterior", () => {
    const comparisonData = mockNeighborhoods.features.map((f) => f.properties);
    mockHook({ data: comparisonData, loading: true, error: null });
    render(<NeighborhoodComparisonResult selectedIds={[1, 2]} />);
    expect(screen.getByText("Carregando comparativo...")).toBeInTheDocument();
    expect(screen.queryByTestId("comparison-table")).not.toBeInTheDocument();
  });
});
