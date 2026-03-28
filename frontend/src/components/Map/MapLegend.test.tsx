import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MapLegend from "./MapLegend";
import { mockNeighborhoods } from "../../test/fixtures";

describe("MapLegend", () => {
  it("renderiza a seção 'Marcadores'", () => {
    render(<MapLegend metric="establishments_count" neighborhoods={mockNeighborhoods} />);
    expect(screen.getByText("Marcadores")).toBeInTheDocument();
  });

  it("renderiza a seção de coroplético com o nome da métrica", () => {
    render(<MapLegend metric="establishments_count" neighborhoods={mockNeighborhoods} />);
    expect(screen.getByText("Estabelecimentos por bairro")).toBeInTheDocument();
  });

  it("atualiza o título da legenda ao mudar a métrica", () => {
    render(<MapLegend metric="equipment_count" neighborhoods={mockNeighborhoods} />);
    expect(screen.getByText("Equipamentos por bairro")).toBeInTheDocument();
  });

  it("exibe todos os tipos de marcador esperados", () => {
    render(<MapLegend metric="establishments_count" neighborhoods={mockNeighborhoods} />);

    expect(screen.getByText("USF")).toBeInTheDocument();
    expect(screen.getByText("UBS / Centro de Saúde")).toBeInTheDocument();
    expect(screen.getByText("Hospital Geral")).toBeInTheDocument();
    expect(screen.getByText("Hospital Especializado")).toBeInTheDocument();
    expect(screen.getByText("Pronto Socorro")).toBeInTheDocument();
    expect(screen.getByText("Pronto Atendimento")).toBeInTheDocument();
    expect(screen.getByText("Policlínica")).toBeInTheDocument();
    expect(screen.getByText("Outros")).toBeInTheDocument();
  });

  it("exibe faixas do coroplético", () => {
    render(<MapLegend metric="establishments_count" neighborhoods={mockNeighborhoods} />);

    // Dynamic bins so we just check that "0" label is present
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renderiza botão de alternar legenda para mobile", () => {
    render(<MapLegend metric="establishments_count" neighborhoods={mockNeighborhoods} />);
    expect(screen.getByLabelText("Alternar legenda")).toBeInTheDocument();
  });

  it("alterna aria-expanded ao clicar no botão de legenda", async () => {
    render(<MapLegend metric="establishments_count" neighborhoods={mockNeighborhoods} />);
    const toggle = screen.getByLabelText("Alternar legenda");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
