import { useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { EstablishmentCollection } from "../../types";
import EstablishmentPopup from "./EstablishmentPopup";

interface Props {
  data: EstablishmentCollection;
}

// Icones SVG por tipo de estabelecimento
function makeIcon(color: string, shape: "circle" | "cross" | "triangle"): L.DivIcon {
  let svgContent = "";
  if (shape === "circle") {
    svgContent = `<circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>`;
  } else if (shape === "cross") {
    svgContent = `
      <rect x="10" y="4" width="4" height="16" fill="${color}" rx="1"/>
      <rect x="4" y="10" width="16" height="4" fill="${color}" rx="1"/>
    `;
  } else {
    svgContent = `<polygon points="12,3 22,21 2,21" fill="${color}" stroke="white" stroke-width="2"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">${svgContent}</svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

const ICONS: Record<string, L.DivIcon> = {
  USF: makeIcon("#16a34a", "circle"),
  "Centro de Saude/Unidade Basica": makeIcon("#2563eb", "circle"),
  "Hospital Geral": makeIcon("#dc2626", "cross"),
  "Hospital Especializado": makeIcon("#ea580c", "cross"),
  "Pronto Socorro Geral": makeIcon("#b91c1c", "triangle"),
  "Pronto Atendimento": makeIcon("#ca8a04", "triangle"),
  Policlinica: makeIcon("#7c3aed", "circle"),
  "Centro de Atencao Psicossocial": makeIcon("#0891b2", "circle"),
  default: makeIcon("#6b7280", "circle"),
};

function getIcon(displayType: string): L.DivIcon {
  return ICONS[displayType] ?? ICONS.default;
}

function HoverMarker({ feature }: { feature: NonNullable<Props["data"]["features"][number]> }) {
  const markerRef = useRef<L.Marker>(null);
  const [lng, lat] = feature.geometry!.coordinates;
  const props = feature.properties;

  return (
    <Marker
      ref={markerRef}
      position={[lat, lng]}
      icon={getIcon(props.display_type)}
      eventHandlers={{
        mouseover: () => markerRef.current?.openPopup(),
        mouseout: () => markerRef.current?.closePopup(),
      }}
    >
      <Popup maxWidth={320} minWidth={200}>
        <EstablishmentPopup id={props.id} />
      </Popup>
    </Marker>
  );
}

export default function EstablishmentMarkers({ data }: Props) {
  const validFeatures = data.features.filter((f) => f.geometry !== null);

  return (
    <>
      {validFeatures.map((feature) => (
        <HoverMarker key={feature.properties.id} feature={feature} />
      ))}
    </>
  );
}
