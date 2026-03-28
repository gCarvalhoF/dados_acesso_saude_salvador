import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterMultiSelect from "./FilterMultiSelect";

const options = [
  { value: "", label: "Todos" },
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Charlie" },
];

function renderComponent(value = "", onChange = vi.fn()) {
  return { onChange, ...render(
    <FilterMultiSelect
      id="test-select"
      label="Test"
      value={value}
      options={options}
      onChange={onChange}
    />
  ) };
}

describe("FilterMultiSelect", () => {
  it("renders label", () => {
    renderComponent();
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("shows placeholder when nothing selected", () => {
    renderComponent();
    expect(screen.getByText("Todos")).toBeInTheDocument();
  });

  it("shows count when items selected", () => {
    renderComponent("a,b");
    expect(screen.getByText("2 selecionados")).toBeInTheDocument();
  });

  it("shows singular count for one item", () => {
    renderComponent("a");
    expect(screen.getByText("1 selecionado")).toBeInTheDocument();
  });

  it("shows tags for selected items", () => {
    renderComponent("a,b");
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("opens dropdown on button click", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText("Test"));

    expect(screen.getByRole("checkbox", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Beta" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Charlie" })).toBeInTheDocument();
  });

  it("does not show catch-all option in dropdown", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText("Test"));

    // "Todos" should be the placeholder button text but not a checkbox option
    expect(screen.queryByRole("checkbox", { name: "Todos" })).not.toBeInTheDocument();
  });

  it("selects an item", async () => {
    const user = userEvent.setup();
    const { onChange } = renderComponent();

    await user.click(screen.getByLabelText("Test"));
    await user.click(screen.getByRole("checkbox", { name: "Alpha" }));

    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("adds to existing selection", async () => {
    const user = userEvent.setup();
    const { onChange } = renderComponent("a");

    await user.click(screen.getByLabelText("Test"));
    await user.click(screen.getByRole("checkbox", { name: "Beta" }));

    expect(onChange).toHaveBeenCalledWith("a,b");
  });

  it("removes item via checkbox", async () => {
    const user = userEvent.setup();
    const { onChange } = renderComponent("a,b");

    await user.click(screen.getByLabelText("Test"));
    await user.click(screen.getByRole("checkbox", { name: "Alpha" }));

    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("removes item via tag button", async () => {
    const user = userEvent.setup();
    const { onChange } = renderComponent("a,b");

    await user.click(screen.getByRole("button", { name: /remover alpha/i }));

    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("returns empty string when last item removed", async () => {
    const user = userEvent.setup();
    const { onChange } = renderComponent("a");

    await user.click(screen.getByRole("button", { name: /remover alpha/i }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("filters options with search", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText("Test"));
    await user.type(screen.getByPlaceholderText("Buscar..."), "alp");

    expect(screen.getByRole("checkbox", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Beta" })).not.toBeInTheDocument();
  });

  it("shows 'Nenhum resultado' when search has no matches", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText("Test"));
    await user.type(screen.getByPlaceholderText("Buscar..."), "xyz");

    expect(screen.getByText("Nenhum resultado")).toBeInTheDocument();
  });

  it("clears all via Limpar button", async () => {
    const user = userEvent.setup();
    const { onChange } = renderComponent("a,b");

    await user.click(screen.getByLabelText("Test"));
    await user.click(screen.getByRole("button", { name: /limpar/i }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("checks already-selected items in dropdown", async () => {
    const user = userEvent.setup();
    renderComponent("a");

    await user.click(screen.getByLabelText("Test"));

    expect(screen.getByRole("checkbox", { name: "Alpha" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Beta" })).not.toBeChecked();
  });
});
