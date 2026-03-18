import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MapLegend from "./MapLegend";

describe("MapLegend", () => {
  it("renderiza a seção 'Marcadores'", () => {
    render(<MapLegend />);
    expect(screen.getByText("Marcadores")).toBeInTheDocument();
  });

  it("renderiza a seção de coroplético", () => {
    render(<MapLegend />);
    expect(screen.getByText("Estab. por bairro")).toBeInTheDocument();
  });

  it("exibe todos os tipos de marcador esperados", () => {
    render(<MapLegend />);

    expect(screen.getByText("USF")).toBeInTheDocument();
    expect(screen.getByText("UBS / Centro de Saúde")).toBeInTheDocument();
    expect(screen.getByText("Hospital Geral")).toBeInTheDocument();
    expect(screen.getByText("Hospital Especializado")).toBeInTheDocument();
    expect(screen.getByText("Pronto Socorro")).toBeInTheDocument();
    expect(screen.getByText("Pronto Atendimento")).toBeInTheDocument();
    expect(screen.getByText("Policlínica")).toBeInTheDocument();
    expect(screen.getByText("Outros")).toBeInTheDocument();
  });

  it("exibe todas as faixas do coroplético", () => {
    render(<MapLegend />);

    expect(screen.getByText("0 estab.")).toBeInTheDocument();
    expect(screen.getByText("1–2")).toBeInTheDocument();
    expect(screen.getByText("3–7")).toBeInTheDocument();
    expect(screen.getByText("8–14")).toBeInTheDocument();
    expect(screen.getByText("15+")).toBeInTheDocument();
  });
});
