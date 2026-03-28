import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MultiSelect from "./MultiSelect";

const options = [
  { value: 1, label: "Pituba" },
  { value: 2, label: "Barra" },
  { value: 3, label: "Brotas" },
  { value: 4, label: "Itaigara" },
  { value: 5, label: "Ondina" },
  { value: 6, label: "Rio Vermelho" },
];

function renderMultiSelect(overrides: { selected?: number[]; max?: number; onChange?: (s: number[]) => void } = {}) {
  const onChange = overrides.onChange ?? vi.fn();
  return {
    onChange,
    ...render(
      <MultiSelect
        id="test-multi"
        label="Bairros"
        options={options}
        selected={overrides.selected ?? []}
        onChange={onChange}
        max={overrides.max ?? 5}
      />
    ),
  };
}

describe("MultiSelect", () => {
  it("renderiza o label", () => {
    renderMultiSelect();
    expect(screen.getByText("Bairros")).toBeInTheDocument();
  });

  it("exibe placeholder quando nenhum item selecionado", () => {
    renderMultiSelect();
    expect(screen.getByText("Selecione bairros...")).toBeInTheDocument();
  });

  it("exibe contagem de selecionados", () => {
    renderMultiSelect({ selected: [1, 2] });
    expect(screen.getByText("2 selecionados")).toBeInTheDocument();
  });

  it("exibe chips para itens selecionados", () => {
    renderMultiSelect({ selected: [1, 2] });
    expect(screen.getByText("Pituba")).toBeInTheDocument();
    expect(screen.getByText("Barra")).toBeInTheDocument();
  });

  it("abre dropdown ao clicar no botão", async () => {
    renderMultiSelect();
    await userEvent.click(screen.getByText("Selecione bairros..."));
    expect(screen.getByLabelText("Buscar bairro")).toBeInTheDocument();
  });

  it("chama onChange ao selecionar item", async () => {
    const { onChange } = renderMultiSelect();
    await userEvent.click(screen.getByText("Selecione bairros..."));
    await userEvent.click(screen.getByText("Pituba"));
    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it("chama onChange ao desselecionar item via checkbox", async () => {
    const { onChange } = renderMultiSelect({ selected: [1, 2] });
    await userEvent.click(screen.getByText("2 selecionados"));
    // Click the checkbox for Pituba (inside the dropdown), not the chip
    const checkboxes = screen.getAllByRole("checkbox");
    const pituba = checkboxes.find((cb) => (cb as HTMLInputElement).checked && cb.closest("label")?.textContent?.includes("Pituba"));
    await userEvent.click(pituba!);
    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("remove item ao clicar no × do chip", async () => {
    const { onChange } = renderMultiSelect({ selected: [1, 2] });
    await userEvent.click(screen.getByLabelText("Remover Pituba"));
    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("filtra opções pela busca", async () => {
    renderMultiSelect();
    await userEvent.click(screen.getByText("Selecione bairros..."));
    await userEvent.type(screen.getByLabelText("Buscar bairro"), "pit");
    expect(screen.getByText("Pituba")).toBeInTheDocument();
    expect(screen.queryByText("Barra")).not.toBeInTheDocument();
  });

  it("exibe aviso quando atingiu o máximo", async () => {
    renderMultiSelect({ selected: [1, 2, 3], max: 3 });
    await userEvent.click(screen.getByText("3 selecionados"));
    expect(screen.getByText("Máximo de 3 bairros")).toBeInTheDocument();
  });

  it("desabilita checkboxes não selecionados quando atingiu o máximo", async () => {
    renderMultiSelect({ selected: [1, 2, 3], max: 3 });
    await userEvent.click(screen.getByText("3 selecionados"));
    const checkboxes = screen.getAllByRole("checkbox");
    const unchecked = checkboxes.filter((cb) => !(cb as HTMLInputElement).checked);
    unchecked.forEach((cb) => expect(cb).toBeDisabled());
  });
});
