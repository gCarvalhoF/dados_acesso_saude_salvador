import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChartsPanel from "./ChartsPanel";
import {
  mockDashboardOverview,
  mockEquipmentByNeighborhood,
  mockServiceSummary,
  mockNeighborhoods,
} from "../../test/fixtures";

// recharts ResponsiveContainer needs dimensions; stub it out
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  };
});

describe("ChartsPanel", () => {
  describe("estado de loading", () => {
    it("exibe placeholders animados quando loading é true", () => {
      const { container } = render(
        <ChartsPanel
          overview={null}
          equipmentByNeighborhood={[]}
          serviceSummary={[]}
          neighborhoods={null}
          loading={true}
        />
      );

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(4);
    });

    it("não exibe títulos de gráficos quando loading", () => {
      render(
        <ChartsPanel
          overview={null}
          equipmentByNeighborhood={[]}
          serviceSummary={[]}
          neighborhoods={null}
          loading={true}
        />
      );

      expect(screen.queryByText("Tipos de Estabelecimento")).not.toBeInTheDocument();
    });
  });

  describe("com dados carregados", () => {
    function renderWithData() {
      return render(
        <ChartsPanel
          overview={mockDashboardOverview}
          equipmentByNeighborhood={mockEquipmentByNeighborhood}
          serviceSummary={mockServiceSummary}
          neighborhoods={mockNeighborhoods}
          loading={false}
        />
      );
    }

    it("renderiza o título 'Tipos de Estabelecimento'", () => {
      renderWithData();
      expect(screen.getByText("Tipos de Estabelecimento")).toBeInTheDocument();
    });

    it("renderiza o título 'Equipamentos por Bairro (Top 15)'", () => {
      renderWithData();
      expect(screen.getByText("Equipamentos por Bairro (Top 15)")).toBeInTheDocument();
    });

    it("renderiza o título 'Equipamentos por 10 mil Habitantes (Top 15)'", () => {
      renderWithData();
      expect(screen.getByText("Equipamentos por 10 mil Habitantes (Top 15)")).toBeInTheDocument();
    });

    it("renderiza o título 'Serviços Especializados Mais Oferecidos (Top 15)'", () => {
      renderWithData();
      expect(
        screen.getByText("Serviços Especializados Mais Oferecidos (Top 15)")
      ).toBeInTheDocument();
    });

    it("não exibe placeholders quando os dados estão carregados", () => {
      const { container } = renderWithData();
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(0);
    });

    it("monta sem erros com dados vazios", () => {
      render(
        <ChartsPanel
          overview={mockDashboardOverview}
          equipmentByNeighborhood={[]}
          serviceSummary={[]}
          neighborhoods={mockNeighborhoods}
          loading={false}
        />
      );

      expect(screen.getByText("Tipos de Estabelecimento")).toBeInTheDocument();
    });
  });
});
