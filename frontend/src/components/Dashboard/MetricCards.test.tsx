import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MetricCards from "./MetricCards";
import { mockDashboardOverview } from "../../test/fixtures";

describe("MetricCards", () => {
  describe("estado de loading", () => {
    it("exibe skeletons quando loading é true", () => {
      const { container } = render(
        <MetricCards overview={null} loading={true} />
      );

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(6);
    });

    it("exibe skeletons quando overview é null", () => {
      const { container } = render(
        <MetricCards overview={null} loading={false} />
      );

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(6);
    });
  });

  describe("com dados carregados", () => {
    it("renderiza 6 cards de métricas", () => {
      render(<MetricCards overview={mockDashboardOverview} loading={false} />);

      expect(screen.getByText("Estabelecimentos")).toBeInTheDocument();
      expect(screen.getByText("Estab. SUS")).toBeInTheDocument();
      expect(screen.getByText("Equipamentos")).toBeInTheDocument();
      expect(screen.getByText("Equip. SUS")).toBeInTheDocument();
      expect(screen.getByText("Leitos Totais")).toBeInTheDocument();
      expect(screen.getByText("Leitos SUS")).toBeInTheDocument();
    });

    it("exibe o total de estabelecimentos", () => {
      render(<MetricCards overview={mockDashboardOverview} loading={false} />);

      expect(screen.getByText("150")).toBeInTheDocument();
    });

    it("exibe o total de estabelecimentos SUS", () => {
      render(<MetricCards overview={mockDashboardOverview} loading={false} />);

      expect(screen.getByText("120")).toBeInTheDocument();
    });

    it("exibe o total de equipamentos", () => {
      render(<MetricCards overview={mockDashboardOverview} loading={false} />);

      expect(screen.getByText("500")).toBeInTheDocument();
    });

    it("exibe o total de equipamentos SUS", () => {
      render(<MetricCards overview={mockDashboardOverview} loading={false} />);

      expect(screen.getByText("350")).toBeInTheDocument();
    });

    it("exibe o total de leitos", () => {
      render(<MetricCards overview={mockDashboardOverview} loading={false} />);

      // 2000 formatted pt-BR = "2.000"
      expect(screen.getByText("2.000")).toBeInTheDocument();
    });

    it("exibe o total de leitos SUS", () => {
      render(<MetricCards overview={mockDashboardOverview} loading={false} />);

      // 1500 formatted pt-BR = "1.500"
      expect(screen.getByText("1.500")).toBeInTheDocument();
    });

    it("não exibe skeletons quando os dados estão carregados", () => {
      const { container } = render(
        <MetricCards overview={mockDashboardOverview} loading={false} />
      );

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(0);
    });
  });
});
