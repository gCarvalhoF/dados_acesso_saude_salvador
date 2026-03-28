// Mock de react-leaflet para testes: substitui todos os componentes por divs simples.
// Leaflet depende de APIs do browser (DOM sizing, canvas) indisponíveis no jsdom.

import { vi } from "vitest";
import type { ReactNode } from "react";

export const MapContainer = ({ children }: { children: ReactNode }) => (
  <div data-testid="map-container">{children}</div>
);

export const TileLayer = () => <div data-testid="tile-layer" />;

export const GeoJSON = ({ onEachFeature }: { onEachFeature?: unknown }) => (
  <div data-testid="geojson-layer" data-has-handler={!!onEachFeature} />
);

export const Marker = ({ children }: { children?: ReactNode }) => (
  <div data-testid="marker">{children}</div>
);

export const Popup = ({ children }: { children?: ReactNode }) => (
  <div data-testid="popup">{children}</div>
);

export const Tooltip = ({ children }: { children?: ReactNode }) => (
  <div data-testid="tooltip">{children}</div>
);

export const useMap = vi.fn();
