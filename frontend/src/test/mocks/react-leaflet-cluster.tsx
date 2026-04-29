// Mock de react-leaflet-cluster para testes: o plugin depende de APIs do Leaflet
// indisponíveis no jsdom. O mock apenas renderiza os filhos.

import type { ReactNode } from "react";

export default function MarkerClusterGroup({ children }: { children?: ReactNode }) {
  return <div data-testid="marker-cluster-group">{children}</div>;
}
