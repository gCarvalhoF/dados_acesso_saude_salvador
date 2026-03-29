import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NeighborhoodComparison from "./NeighborhoodComparison";
import { mockNeighborhoods } from "../../test/fixtures";
import type { NeighborhoodProperties } from "../../types";

vi.mock("../../hooks/useNeighborhoodComparison", () => ({
  useNeighborhoodComparison: vi.fn(),
}));

import { useNeighborhoodComparison } from "../../hooks/useNeighborhoodComparison";

function mockHook(state: { data: NeighborhoodProperties[] | null; loading: boolean; error: string | null }) {
  vi.mocked(useNeighborhoodComparison).mockReturnValue(state);
}

const defaultProps = {
  neighborhoods: mockNeighborhoods,
  selectedIds: [] as number[],
  onSelectedIdsChange: vi.fn(),
};

describe("NeighborhoodComparison", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook({ data: null, loading: false, error: null });
  });

  it("renderiza o botão 'Comparar Bairros'", () => {
    render(<NeighborhoodComparison {...defaultProps} />);
    expect(screen.getByText("Comparar Bairros")).toBeInTheDocument();
  });

  it("inicialmente o conteúdo está colapsado", () => {
    render(<NeighborhoodComparison {...defaultProps} />);
    expect(screen.queryByText("Selecione bairros para comparar")).not.toBeInTheDocument();
  });

  it("expande ao clicar no botão", async () => {
    render(<NeighborhoodComparison {...defaultProps} />);
    await userEvent.click(screen.getByText("Comparar Bairros"));
    expect(screen.getByText("Selecione bairros para comparar")).toBeInTheDocument();
  });

  it("mostra mensagem quando menos de 2 bairros selecionados", async () => {
    render(<NeighborhoodComparison {...defaultProps} />);
    await userEvent.click(screen.getByText("Comparar Bairros"));
    expect(screen.getByText("Selecione pelo menos 2 bairros para comparar.")).toBeInTheDocument();
  });

  it("mostra badge com contagem quando bairros selecionados", () => {
    render(<NeighborhoodComparison {...defaultProps} selectedIds={[1, 2]} />);
    expect(screen.getByText("2 selecionados")).toBeInTheDocument();
  });

  it("exibe o nome da cidade ao lado do bairro nas opções de comparação", async () => {
    render(<NeighborhoodComparison neighborhoods={mockNeighborhoods} />);
    await userEvent.click(screen.getByText("Comparar Bairros"));
    await userEvent.click(screen.getByRole("button", { name: /selecione bairros/i }));

    const pitubaRow = screen.getByRole("checkbox", { name: "Pituba" }).closest("label");
    expect(pitubaRow?.textContent).toContain("Pituba");
    expect(pitubaRow?.textContent).toContain("Salvador");
  });

  it("exibe loading quando dados estão sendo buscados", async () => {
    mockHook({ data: null, loading: true, error: null });
    render(<NeighborhoodComparison {...defaultProps} />);
    await userEvent.click(screen.getByText("Comparar Bairros"));
    expect(screen.getByText("Carregando comparativo...")).toBeInTheDocument();
  });

  it("exibe tabela de comparação quando dados estão disponíveis", async () => {
    const comparisonData = mockNeighborhoods.features.map((f) => f.properties);
    mockHook({ data: comparisonData, loading: false, error: null });
    render(<NeighborhoodComparison {...defaultProps} selectedIds={[1, 2]} />);
    await userEvent.click(screen.getByText("Comparar Bairros"));
    expect(screen.getByTestId("comparison-table")).toBeInTheDocument();
    expect(screen.getByText("População Total")).toBeInTheDocument();
  });

  it("exibe nomes dos bairros como cabeçalhos da tabela", async () => {
    const comparisonData = mockNeighborhoods.features.map((f) => f.properties);
    mockHook({ data: comparisonData, loading: false, error: null });
    render(<NeighborhoodComparison {...defaultProps} selectedIds={[1, 2]} />);
    await userEvent.click(screen.getByText("Comparar Bairros"));
    const table = screen.getByTestId("comparison-table");
    expect(table.innerHTML).toContain("Pituba");
    expect(table.innerHTML).toContain("Barra");
  });

  it("calcula indicadores por 10k habitantes", async () => {
    const comparisonData = mockNeighborhoods.features.map((f) => f.properties);
    mockHook({ data: comparisonData, loading: false, error: null });
    render(<NeighborhoodComparison {...defaultProps} selectedIds={[1, 2]} />);
    await userEvent.click(screen.getByText("Comparar Bairros"));
    const table = screen.getByTestId("comparison-table");
    expect(table).toBeInTheDocument();
    expect(screen.getByText("Equipamentos / 10k hab.")).toBeInTheDocument();
    expect(screen.getByText("Leitos SUS / 10k hab.")).toBeInTheDocument();
  });

  it("renderiza grupos de demografia detalhada (raça, faixa etária, raça × sexo)", async () => {
    const comparisonData = mockNeighborhoods.features.map((f) => f.properties);
    mockHook({ data: comparisonData, loading: false, error: null });
    render(<NeighborhoodComparison neighborhoods={mockNeighborhoods} />);
    await userEvent.click(screen.getByText("Comparar Bairros"));

    expect(screen.getByText("Cor / Raça")).toBeInTheDocument();
    expect(screen.getByText("Amarela")).toBeInTheDocument();
    expect(screen.getByText("Indígena")).toBeInTheDocument();

    expect(screen.getByText("Faixa Etária")).toBeInTheDocument();
    expect(screen.getByText("0–4 anos")).toBeInTheDocument();
    expect(screen.getByText("70+ anos")).toBeInTheDocument();

    expect(screen.getByText("Cor × Sexo")).toBeInTheDocument();
    expect(screen.getByText("Masc. Branca")).toBeInTheDocument();
    expect(screen.getByText("Fem. Indígena")).toBeInTheDocument();
  });

  it("exibe '—' para campos demográficos ausentes (compat com payload do index)", async () => {
    const sparse = mockNeighborhoods.features.map((f) => {
      const copy = { ...f.properties };
      delete copy.population_asian;
      delete copy.population_0_to_4;
      delete copy.population_male_white;
      return copy;
    });
    mockHook({ data: sparse, loading: false, error: null });
    render(<NeighborhoodComparison neighborhoods={mockNeighborhoods} />);
    await userEvent.click(screen.getByText("Comparar Bairros"));

    // Rows still render with em-dash placeholders
    const table = screen.getByTestId("comparison-table");
    expect(table.textContent).toContain("—");
  });
});
