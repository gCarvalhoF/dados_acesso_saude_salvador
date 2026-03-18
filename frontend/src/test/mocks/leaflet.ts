// Mock mínimo do Leaflet para testes em jsdom.
import { vi } from "vitest";

const divIcon = vi.fn(() => ({}));

export default { divIcon };
export { divIcon };
