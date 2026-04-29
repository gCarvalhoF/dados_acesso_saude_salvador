import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NeighborhoodComparisonTrigger from "./NeighborhoodComparisonTrigger";

describe("NeighborhoodComparisonTrigger", () => {
  it("renderiza o texto 'Comparar Bairros'", () => {
    render(<NeighborhoodComparisonTrigger open={false} selectedCount={0} onToggle={vi.fn()} />);
    expect(screen.getByText("Comparar Bairros")).toBeInTheDocument();
  });

  it("não exibe badge quando menos de 2 bairros selecionados", () => {
    render(<NeighborhoodComparisonTrigger open={false} selectedCount={1} onToggle={vi.fn()} />);
    expect(screen.queryByText(/selecionados/i)).not.toBeInTheDocument();
  });

  it("exibe badge com contagem quando 2+ bairros selecionados", () => {
    render(<NeighborhoodComparisonTrigger open={false} selectedCount={3} onToggle={vi.fn()} />);
    expect(screen.getByText("3 selecionados")).toBeInTheDocument();
  });

  it("chama onToggle ao clicar", async () => {
    const onToggle = vi.fn();
    render(<NeighborhoodComparisonTrigger open={false} selectedCount={0} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("expõe o estado expandido via aria-expanded", () => {
    const { rerender } = render(
      <NeighborhoodComparisonTrigger open={false} selectedCount={0} onToggle={vi.fn()} />
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");

    rerender(<NeighborhoodComparisonTrigger open={true} selectedCount={0} onToggle={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });
});
