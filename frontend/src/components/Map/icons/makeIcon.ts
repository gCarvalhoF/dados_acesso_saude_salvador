import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import CircleIcon from "./CircleIcon";
import CrossIcon from "./CrossIcon";
import TriangleIcon from "./TriangleIcon";

type Shape = "circle" | "cross" | "triangle";

const SHAPE_COMPONENTS = {
  circle: CircleIcon,
  cross: CrossIcon,
  triangle: TriangleIcon,
};

export function makeIcon(color: string, shape: Shape): L.DivIcon {
  const component = SHAPE_COMPONENTS[shape];
  const html = renderToStaticMarkup(createElement(component, { color }));

  return L.divIcon({
    html,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}
