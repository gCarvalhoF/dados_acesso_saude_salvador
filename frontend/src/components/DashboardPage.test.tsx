import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "./DashboardPage";
import { mockNeighborhoods, mockEstablishments } from "../test/fixtures";

vi.mock("react-leaflet", () => import("../test/mocks/react-leaflet"));
vi.mock("leaflet", () => import("../test/mocks/leaflet"));
vi.mock("leaflet/dist/leaflet.css", () => ({}));

function mockFetchSequence(responses: object[]) {
  let callIndex = 0;
  vi.mocked(fetch).mockImplementation(() => {
    const data = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve(new Response(JSON.stringify(data), { status: 200 }));
  });
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza o título do dashboard", async () => {
    mockFetchSequence([mockNeighborhoods, mockEstablishments]);

    render(<DashboardPage />);

    expect(screen.getByText("Saúde em Salvador")).toBeInTheDocument();
  });

  it("renderiza o painel de filtros", async () => {
    mockFetchSequence([mockNeighborhoods, mockEstablishments]);

    render(<DashboardPage />);

    expect(screen.getByText("Filtros")).toBeInTheDocument();
  });

  it("renderiza o container do mapa", async () => {
    mockFetchSequence([mockNeighborhoods, mockEstablishments]);

    render(<DashboardPage />);

    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });

  it("exibe o spinner 'Carregando...' no header enquanto os dados chegam", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); // pendente

    render(<DashboardPage />);

    // O header tem um <span> específico com animate-pulse; o FilterPanel usa <p>.
    // Usamos o selector para distinguir entre os dois.
    expect(screen.getByText("Carregando...", { selector: "span" })).toBeInTheDocument();
  });

  it("exibe a contagem de estabelecimentos no painel de filtros após carregar", async () => {
    mockFetchSequence([mockNeighborhoods, mockEstablishments]);

    render(<DashboardPage />);

    await waitFor(() =>
      expect(screen.getByText("2 estabelecimentos")).toBeInTheDocument()
    );
  });

  it("exibe os bairros no dropdown após carregar", async () => {
    mockFetchSequence([mockNeighborhoods, mockEstablishments]);

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("Pituba")).toBeInTheDocument());
    expect(screen.getByText("Barra")).toBeInTheDocument();
  });

  describe("sincronização bidirecional de bairro", () => {
    it("exibe badge de bairro no header ao selecionar pelo dropdown", async () => {
      mockFetchSequence([mockNeighborhoods, mockEstablishments, mockEstablishments]);

      render(<DashboardPage />);

      await waitFor(() => screen.getByText("Pituba"));

      await userEvent.selectOptions(screen.getByLabelText(/bairro/i), "1");

      await waitFor(() =>
        expect(screen.getByText("Pituba", { selector: "span" })).toBeInTheDocument()
      );
    });

    it("remove o badge e limpa o filtro ao clicar no botão ×", async () => {
      mockFetchSequence([
        mockNeighborhoods,
        mockEstablishments,
        mockEstablishments,
        mockEstablishments,
      ]);

      render(<DashboardPage />);

      await waitFor(() => screen.getByText("Pituba"));

      await userEvent.selectOptions(screen.getByLabelText(/bairro/i), "1");

      await waitFor(() => screen.getByTitle("Limpar seleção"));

      await userEvent.click(screen.getByTitle("Limpar seleção"));

      await waitFor(() =>
        expect(screen.queryByTitle("Limpar seleção")).not.toBeInTheDocument()
      );
    });

    it("refaz o fetch de estabelecimentos ao mudar o filtro de tipo", async () => {
      mockFetchSequence([mockNeighborhoods, mockEstablishments, mockEstablishments]);

      render(<DashboardPage />);

      await waitFor(() => screen.getByLabelText(/tipo de estabelecimento/i));

      const callsBefore = vi.mocked(fetch).mock.calls.length;

      await userEvent.selectOptions(
        screen.getByLabelText(/tipo de estabelecimento/i),
        "01"
      );

      // Aguarda ao menos uma chamada adicional ao fetch após a mudança de filtro
      await waitFor(() =>
        expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(callsBefore)
      );

      // A última chamada deve conter o filtro de tipo
      const calls = vi.mocked(fetch).mock.calls;
      const lastCall = calls[calls.length - 1][0] as string;
      expect(lastCall).toContain("type=01");
    });
  });
});
