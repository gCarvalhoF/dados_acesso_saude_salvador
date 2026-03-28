import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterPanel from "./FilterPanel";
import { mockNeighborhoods } from "../../test/fixtures";
import { ESTABLISHMENT_TYPES, LEGAL_NATURES, MANAGEMENT_TYPES } from "../../types";
import type { FilterOptions, Filters } from "../../types";

const defaultFilters: Filters = {
  type: "",
  legal_nature: "",
  management: "",
  sus_only: false,
  neighborhood_id: "",
  equipment: "",
  service: "",
  reference_category: "",
};

const defaultFilterOptions: FilterOptions = {
  establishment_types: Object.entries(ESTABLISHMENT_TYPES).map(([value, label]) => ({ value, label })),
  legal_natures: Object.entries(LEGAL_NATURES).map(([value, label]) => ({ value, label })),
  management_types: Object.entries(MANAGEMENT_TYPES).map(([value, label]) => ({ value, label })),
  equipment_items: [
    { value: "", label: "Todos os equipamentos" },
    { value: "02", label: "Mamografo" },
  ],
  specialized_services: [
    { value: "", label: "Todos os serviços" },
    { value: "116", label: "Cardiologia" },
  ],
  reference_categories: [
    { value: "", label: "Todas as referências" },
    { value: "referencia_cardiovascular", label: "Referência Cardiovascular" },
  ],
};

function renderPanel(overrides: Partial<Filters> = {}, onChange = vi.fn(), onClose = vi.fn()) {
  return render(
    <FilterPanel
      filters={{ ...defaultFilters, ...overrides }}
      filterOptions={defaultFilterOptions}
      onChange={onChange}
      neighborhoods={mockNeighborhoods}
      totalCount={42}
      loading={false}
      isOpen={true}
      onClose={onClose}
    />
  );
}

describe("FilterPanel", () => {
  describe("renderização inicial", () => {
    it("exibe o título 'Filtros'", () => {
      renderPanel();
      expect(screen.getByText("Filtros")).toBeInTheDocument();
    });

    it("exibe a contagem de estabelecimentos", () => {
      renderPanel();
      expect(screen.getByText("42 estabelecimentos")).toBeInTheDocument();
    });

    it("exibe 'Carregando...' quando loading é true", () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          filterOptions={defaultFilterOptions}
          onChange={vi.fn()}
          neighborhoods={null}
          totalCount={0}
          loading={true}
          isOpen={true}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText("Carregando...")).toBeInTheDocument();
    });

    it("renderiza o multiselect de tipo de estabelecimento", () => {
      renderPanel();
      expect(screen.getByLabelText(/tipo de estabelecimento/i)).toBeInTheDocument();
    });

    it("renderiza os radio buttons de natureza jurídica", () => {
      renderPanel();
      expect(screen.getByLabelText("Todas")).toBeInTheDocument();
      expect(screen.getByLabelText("Pública")).toBeInTheDocument();
      expect(screen.getByLabelText("Privada")).toBeInTheDocument();
      expect(screen.getByLabelText("Sem Fins Lucrativos")).toBeInTheDocument();
    });

    it("renderiza o checkbox 'Apenas SUS'", () => {
      renderPanel();
      expect(screen.getByLabelText(/apenas sus/i)).toBeInTheDocument();
    });

    it("renderiza o multiselect de bairro", () => {
      renderPanel();
      expect(screen.getByLabelText(/bairro/i)).toBeInTheDocument();
    });

    it("renderiza o multiselect de equipamento", () => {
      renderPanel();
      expect(screen.getByLabelText(/equipamento/i)).toBeInTheDocument();
    });

    it("renderiza o multiselect de serviço especializado", () => {
      renderPanel();
      expect(screen.getByLabelText(/serviço especializado/i)).toBeInTheDocument();
    });

    it("renderiza o multiselect de referência hospitalar", () => {
      renderPanel();
      expect(screen.getByLabelText(/referência hospitalar/i)).toBeInTheDocument();
    });

    it("renderiza o botão 'Redefinir Filtros'", () => {
      renderPanel();
      expect(screen.getByRole("button", { name: /redefinir filtros/i })).toBeInTheDocument();
    });
  });

  describe("interações com multiselect", () => {
    it("chama onChange com o tipo selecionado ao clicar na opção", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({}, onChange);

      // Open the type multiselect dropdown
      await user.click(screen.getByLabelText(/tipo de estabelecimento/i));
      // Click a checkbox option
      await user.click(screen.getByRole("checkbox", { name: "Hospital Geral" }));

      expect(onChange).toHaveBeenCalledWith({ type: "01" });
    });

    it("chama onChange com múltiplos tipos selecionados", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({ type: "01" }, onChange);

      await user.click(screen.getByLabelText(/tipo de estabelecimento/i));
      // Select a second type
      await user.click(screen.getByRole("checkbox", { name: "Policlinica" }));

      expect(onChange).toHaveBeenCalledWith({ type: "01,04" });
    });

    it("chama onChange com legal_nature ao selecionar radio 'Pública'", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await user.click(screen.getByLabelText("Pública"));

      expect(onChange).toHaveBeenCalledWith({ legal_nature: "publica" });
    });

    it("chama onChange com management ao clicar na opção de gestão", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await user.click(screen.getByLabelText(/tipo de gestão/i));
      await user.click(screen.getByRole("checkbox", { name: "Municipal" }));

      expect(onChange).toHaveBeenCalledWith({ management: "M" });
    });

    it("chama onChange com equipment ao clicar na opção de equipamento", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await user.click(screen.getByLabelText(/equipamento/i));
      await user.click(screen.getByRole("checkbox", { name: "Mamografo" }));

      expect(onChange).toHaveBeenCalledWith({ equipment: "02" });
    });

    it("chama onChange com service ao clicar na opção de serviço", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await user.click(screen.getByLabelText(/serviço especializado/i));
      await user.click(screen.getByRole("checkbox", { name: "Cardiologia" }));

      expect(onChange).toHaveBeenCalledWith({ service: "116" });
    });

    it("chama onChange com reference_category ao clicar na opção de referência", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await user.click(screen.getByLabelText(/referência hospitalar/i));
      await user.click(screen.getByRole("checkbox", { name: "Referência Cardiovascular" }));

      expect(onChange).toHaveBeenCalledWith({ reference_category: "referencia_cardiovascular" });
    });

    it("chama onChange com neighborhood_id ao clicar na opção de bairro", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await user.click(screen.getByLabelText(/bairro/i));
      await user.click(screen.getByRole("checkbox", { name: "Pituba" }));

      expect(onChange).toHaveBeenCalledWith({ neighborhood_id: "1" });
    });

    it("chama onChange com sus_only: true ao marcar o checkbox", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await user.click(screen.getByLabelText(/apenas sus/i));

      expect(onChange).toHaveBeenCalledWith({ sus_only: true });
    });

    it("chama onChange com sus_only: false ao desmarcar o checkbox", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({ sus_only: true }, onChange);

      await user.click(screen.getByLabelText(/apenas sus/i));

      expect(onChange).toHaveBeenCalledWith({ sus_only: false });
    });

    it("remove seleção ao clicar no botão remover da tag", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({ type: "01,04" }, onChange);

      // Click the remove button on the "Hospital Geral" tag
      const removeBtn = screen.getByRole("button", { name: /remover hospital geral/i });
      await user.click(removeBtn);

      expect(onChange).toHaveBeenCalledWith({ type: "04" });
    });

    it("chama onChange com todos os campos resetados ao clicar em 'Redefinir Filtros'", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderPanel({ type: "02", sus_only: true }, onChange);

      await user.click(screen.getByRole("button", { name: /Redefinir filtros/i }));

      expect(onChange).toHaveBeenCalledWith({
        type: "01,02,04,05,32",
        legal_nature: "",
        management: "",
        sus_only: false,
        neighborhood_id: "",
        equipment: "",
        service: "",
        reference_category: "",
      });
    });
  });

  describe("estado dos controles", () => {
    it("o checkbox SUS reflete o valor do filtro", () => {
      renderPanel({ sus_only: true });
      expect(screen.getByLabelText(/apenas sus/i)).toBeChecked();
    });

    it("o radio 'Privada' fica marcado quando legal_nature='privada'", () => {
      renderPanel({ legal_nature: "privada" });
      expect(screen.getByLabelText("Privada")).toBeChecked();
    });

    it("o radio 'Todas' fica marcado com filtro vazio", () => {
      renderPanel({ legal_nature: "" });
      expect(screen.getByLabelText("Todas")).toBeChecked();
    });

    it("mostra tags para valores selecionados no multiselect de tipo", () => {
      renderPanel({ type: "01" });
      expect(screen.getByText("Hospital Geral")).toBeInTheDocument();
    });

    it("mostra placeholder quando nenhum tipo está selecionado", () => {
      renderPanel({ type: "" });
      expect(screen.getByText("Todos os tipos")).toBeInTheDocument();
    });

    it("mostra contagem de selecionados no botão do multiselect", () => {
      renderPanel({ type: "01,02" });
      expect(screen.getByText("2 selecionados")).toBeInTheDocument();
    });
  });
});
