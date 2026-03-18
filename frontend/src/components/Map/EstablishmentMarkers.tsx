import { useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import type { EstablishmentCollection } from "../../types";
import EstablishmentPopup from "./EstablishmentPopup";
import { makeIcon } from "./icons/makeIcon";
import { markerColors } from "../../styles/theme";

interface Props {
  data: EstablishmentCollection;
}

const ICONS: Record<string, ReturnType<typeof makeIcon>> = {
  USF:                               makeIcon(markerColors.usf,                   "circle"),
  "Centro de Saude/Unidade Basica":  makeIcon(markerColors.ubs,                   "circle"),
  "Hospital Geral":                  makeIcon(markerColors.hospitalGeral,          "cross"),
  "Hospital Especializado":          makeIcon(markerColors.hospitalEspecializado,  "cross"),
  "Pronto Socorro Geral":            makeIcon(markerColors.prontoSocorro,          "triangle"),
  "Pronto Atendimento":              makeIcon(markerColors.prontoAtendimento,      "triangle"),
  Policlinica:                       makeIcon(markerColors.policlinica,            "circle"),
  "Centro de Atencao Psicossocial":  makeIcon(markerColors.caps,                  "circle"),
  default:                           makeIcon(markerColors.default,               "circle"),
};

function getIcon(displayType: string) {
  return ICONS[displayType] ?? ICONS.default;
}

function HoverMarker({ feature }: { feature: NonNullable<Props["data"]["features"][number]> }) {
  const markerRef = useRef<import("leaflet").Marker>(null);
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
