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
};

function renderPanel(overrides: Partial<Filters> = {}, onChange = vi.fn()) {
  return render(
    <FilterPanel
      filters={{ ...defaultFilters, ...overrides }}
      filterOptions={defaultFilterOptions}
      onChange={onChange}
      neighborhoods={mockNeighborhoods}
      totalCount={42}
      loading={false}
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
        />
      );
      expect(screen.getByText("Carregando...")).toBeInTheDocument();
    });

    it("renderiza o select de tipo de estabelecimento", () => {
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

    it("renderiza o select de bairro com opções carregadas", () => {
      renderPanel();
      expect(screen.getByText("Pituba")).toBeInTheDocument();
      expect(screen.getByText("Barra")).toBeInTheDocument();
    });

    it("renderiza o select de equipamento", () => {
      renderPanel();
      expect(screen.getByLabelText(/equipamento/i)).toBeInTheDocument();
    });

    it("renderiza o select de serviço especializado", () => {
      renderPanel();
      expect(screen.getByLabelText(/serviço especializado/i)).toBeInTheDocument();
    });

    it("renderiza o botão 'Limpar filtros'", () => {
      renderPanel();
      expect(screen.getByRole("button", { name: /limpar filtros/i })).toBeInTheDocument();
    });
  });

  describe("interações", () => {
    it("chama onChange com o tipo selecionado ao mudar o select de tipo", async () => {
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await userEvent.selectOptions(
        screen.getByLabelText(/tipo de estabelecimento/i),
        "01"
      );

      expect(onChange).toHaveBeenCalledWith({ type: "01" });
    });

    it("chama onChange com legal_nature ao selecionar radio 'Pública'", async () => {
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await userEvent.click(screen.getByLabelText("Pública"));

      expect(onChange).toHaveBeenCalledWith({ legal_nature: "publica" });
    });

    it("chama onChange com legal_nature ao selecionar radio 'Privada'", async () => {
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await userEvent.click(screen.getByLabelText("Privada"));

      expect(onChange).toHaveBeenCalledWith({ legal_nature: "privada" });
    });

    it("chama onChange com equipment ao selecionar equipamento", async () => {
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await userEvent.selectOptions(
        screen.getByLabelText(/equipamento/i),
        "02"
      );

      expect(onChange).toHaveBeenCalledWith({ equipment: "02" });
    });

    it("chama onChange com service ao selecionar serviço especializado", async () => {
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await userEvent.selectOptions(
        screen.getByLabelText(/serviço especializado/i),
        "116"
      );

      expect(onChange).toHaveBeenCalledWith({ service: "116" });
    });

    it("chama onChange com sus_only: true ao marcar o checkbox", async () => {
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await userEvent.click(screen.getByLabelText(/apenas sus/i));

      expect(onChange).toHaveBeenCalledWith({ sus_only: true });
    });

    it("chama onChange com sus_only: false ao desmarcar o checkbox", async () => {
      const onChange = vi.fn();
      renderPanel({ sus_only: true }, onChange);

      await userEvent.click(screen.getByLabelText(/apenas sus/i));

      expect(onChange).toHaveBeenCalledWith({ sus_only: false });
    });

    it("chama onChange com neighborhood_id ao selecionar bairro", async () => {
      const onChange = vi.fn();
      renderPanel({}, onChange);

      await userEvent.selectOptions(
        screen.getByLabelText(/bairro/i),
        "1"
      );

      expect(onChange).toHaveBeenCalledWith({ neighborhood_id: "1" });
    });

    it("chama onChange com todos os campos resetados ao clicar em 'Limpar filtros'", async () => {
      const onChange = vi.fn();
      renderPanel({ type: "02", sus_only: true }, onChange);

      await userEvent.click(screen.getByRole("button", { name: /limpar filtros/i }));

      expect(onChange).toHaveBeenCalledWith({
        type: "",
        legal_nature: "",
        management: "",
        sus_only: false,
        neighborhood_id: "",
        equipment: "",
        service: "",
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

    it("a lista de bairros é ordenada alfabeticamente", () => {
      renderPanel();
      const neighborhoodSelect = screen.getByLabelText(/bairro/i);
      const options = Array.from(neighborhoodSelect.querySelectorAll("option"))
        .map((o) => o.textContent)
        .filter((t) => t !== "Todos os bairros");
      expect(options).toEqual(["Barra", "Pituba"]);
    });
  });
});
