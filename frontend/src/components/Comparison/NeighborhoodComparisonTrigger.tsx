import type { ReactNode } from "react";

interface Props {
  open: boolean;
  selectedCount: number;
  onToggle: () => void;
  collapsed?: boolean;
  icon?: ReactNode;
}

export default function NeighborhoodComparisonTrigger({
  open,
  selectedCount,
  onToggle,
  collapsed = false,
  icon,
}: Props) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors ${
        collapsed ? "justify-center p-2" : "px-3 py-2"
      }`}
      aria-expanded={open}
      aria-controls="neighborhood-comparison-panel"
      aria-label={collapsed ? "Comparar Bairros" : undefined}
      title={collapsed ? "Comparar Bairros" : undefined}
    >
      {icon}
      {!collapsed && (
        <>
          <span className="flex-1 text-left">Comparar Bairros</span>
          {selectedCount >= 2 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {selectedCount} selecionados
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </>
      )}
    </button>
  );
}
