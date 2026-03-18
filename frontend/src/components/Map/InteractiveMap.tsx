import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import type { EstablishmentCollection, Filters, NeighborhoodCollection } from "../../types";
import NeighborhoodLayer from "./NeighborhoodLayer";
import EstablishmentMarkers from "./EstablishmentMarkers";
import MapLegend from "./MapLegend";

// Centro de Salvador
const SALVADOR_CENTER: [number, number] = [-12.97, -38.51];
const INITIAL_ZOOM = 12;

interface Props {
  neighborhoods: NeighborhoodCollection | null;
  establishments: EstablishmentCollection | null;
  selectedNeighborhood: number | null;
  onNeighborhoodSelect: (id: number | null, name: string) => void;
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
}

export default function InteractiveMap({
  neighborhoods,
  establishments,
  selectedNeighborhood,
  onNeighborhoodSelect,
}: Props) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={SALVADOR_CENTER}
        zoom={INITIAL_ZOOM}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {neighborhoods && (
          <NeighborhoodLayer
            data={neighborhoods}
            selectedId={selectedNeighborhood}
            onSelect={onNeighborhoodSelect}
          />
        )}

        {establishments && <EstablishmentMarkers data={establishments} />}
      </MapContainer>

      <MapLegend />
    </div>
  );
}
