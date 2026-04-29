import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NeighborhoodComparisonInput from "./NeighborhoodComparisonInput";
import { mockNeighborhoods } from "../../test/fixtures";

const defaultProps = {
  neighborhoods: mockNeighborhoods,
  selectedIds: [] as number[],
  onSelectedIdsChange: vi.fn(),
};

describe("NeighborhoodComparisonInput", () => {
  it("renderiza o multiselect de bairros", () => {
    render(<NeighborhoodComparisonInput {...defaultProps} />);
    expect(screen.getByLabelText(/selecione bairros para comparar/i)).toBeInTheDocument();
  });

  it("mostra texto explicativo sobre filtro automático", () => {
    render(<NeighborhoodComparisonInput {...defaultProps} />);
    expect(
      screen.getByText(/o mapa, gráficos e cards são filtrados automaticamente/i)
    ).toBeInTheDocument();
  });

  it("mostra mensagem quando menos de 2 bairros selecionados", () => {
    render(<NeighborhoodComparisonInput {...defaultProps} selectedIds={[1]} />);
    expect(screen.getByText("Selecione pelo menos 2 bairros para comparar.")).toBeInTheDocument();
  });

  it("não mostra a mensagem quando 2+ bairros selecionados", () => {
    render(<NeighborhoodComparisonInput {...defaultProps} selectedIds={[1, 2]} />);
    expect(
      screen.queryByText("Selecione pelo menos 2 bairros para comparar.")
    ).not.toBeInTheDocument();
  });

  it("exibe o nome da cidade ao lado do bairro nas opções", async () => {
    render(<NeighborhoodComparisonInput {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /selecione bairros/i }));

    const pitubaRow = screen.getByRole("checkbox", { name: "Pituba" }).closest("label");
    expect(pitubaRow?.textContent).toContain("Pituba");
    expect(pitubaRow?.textContent).toContain("Salvador");
  });

  it("propaga mudanças de seleção via onSelectedIdsChange", async () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <NeighborhoodComparisonInput
        {...defaultProps}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /selecione bairros/i }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Pituba" }));

    expect(onSelectedIdsChange).toHaveBeenCalled();
  });
});
