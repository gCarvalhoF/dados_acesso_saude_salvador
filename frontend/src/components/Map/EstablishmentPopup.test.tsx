import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import EstablishmentPopup from "./EstablishmentPopup";
import { mockEstablishmentDetail } from "../../test/fixtures";

// Moca o hook em vez de fetch: isola o componente de qualquer camada de rede.
vi.mock("../../hooks/useEstablishments", () => ({
  useEstablishmentDetail: vi.fn(),
}));

import { useEstablishmentDetail } from "../../hooks/useEstablishments";

function mockHook(state: { data: typeof mockEstablishmentDetail | null; loading: boolean }) {
  vi.mocked(useEstablishmentDetail).mockReturnValue(state);
}

describe("EstablishmentPopup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe 'Carregando...' enquanto o fetch está pendente", () => {
    mockHook({ data: null, loading: true });

    render(<EstablishmentPopup id={10} />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("exibe mensagem de erro quando não há dados e não está carregando", () => {
    mockHook({ data: null, loading: false });

    render(<EstablishmentPopup id={10} />);

    expect(screen.getByText("Erro ao carregar dados.")).toBeInTheDocument();
  });

  it("exibe o nome do estabelecimento após carregamento", () => {
    mockHook({ data: mockEstablishmentDetail, loading: false });

    render(<EstablishmentPopup id={10} />);

    // fantasy_name e name podem ser iguais; selecionamos o <h3> (título principal)
    expect(screen.getByText("UBS Pituba", { selector: "h3" })).toBeInTheDocument();
  });

  it("exibe o badge do tipo de estabelecimento", () => {
    mockHook({ data: mockEstablishmentDetail, loading: false });

    render(<EstablishmentPopup id={10} />);

    expect(screen.getByText("Centro de Saude/Unidade Basica")).toBeInTheDocument();
  });

  it("exibe o badge SUS quando is_sus é true", () => {
    mockHook({ data: mockEstablishmentDetail, loading: false });

    render(<EstablishmentPopup id={10} />);

    expect(screen.getByText("SUS")).toBeInTheDocument();
  });

  it("não exibe o badge SUS quando is_sus é false", () => {
    mockHook({ data: { ...mockEstablishmentDetail, is_sus: false }, loading: false });

    render(<EstablishmentPopup id={10} />);

    expect(screen.queryByText("SUS")).not.toBeInTheDocument();
  });

  it("exibe os equipamentos", () => {
    mockHook({ data: mockEstablishmentDetail, loading: false });

    render(<EstablishmentPopup id={10} />);

    expect(screen.getByText(/mamografo/i)).toBeInTheDocument();
    expect(screen.getByText(/tomografo/i)).toBeInTheDocument();
  });

  it("exibe os serviços especializados", () => {
    mockHook({ data: mockEstablishmentDetail, loading: false });

    render(<EstablishmentPopup id={10} />);

    expect(screen.getByText("Cardiologia")).toBeInTheDocument();
  });

  it("não exibe a seção de leitos quando total é zero", () => {
    mockHook({ data: mockEstablishmentDetail, loading: false });

    render(<EstablishmentPopup id={10} />);

    expect(screen.queryByText("Leitos")).not.toBeInTheDocument();
  });

  it("exibe a seção de leitos quando há leitos existentes", () => {
    mockHook({
      data: { ...mockEstablishmentDetail, beds: { total_existing: 30, total_sus: 20 } },
      loading: false,
    });

    render(<EstablishmentPopup id={10} />);

    expect(screen.getByText("Leitos")).toBeInTheDocument();
    expect(screen.getByText("Existentes: 30")).toBeInTheDocument();
    expect(screen.getByText("SUS: 20")).toBeInTheDocument();
  });

  it("exibe indicador de overflow quando há mais de 5 equipamentos", () => {
    const manyEquipments = Array.from({ length: 7 }, (_, i) => ({
      code: String(i),
      name: `Equipamento ${i}`,
      quantity_existing: 1,
      quantity_in_use: 1,
      available_sus: true,
    }));

    mockHook({ data: { ...mockEstablishmentDetail, equipments: manyEquipments }, loading: false });

    render(<EstablishmentPopup id={10} />);

    expect(screen.getByText("+2 mais...")).toBeInTheDocument();
  });

  it("passa o id correto para o hook", () => {
    mockHook({ data: null, loading: true });

    render(<EstablishmentPopup id={42} />);

    expect(useEstablishmentDetail).toHaveBeenCalledWith(42);
  });
});
