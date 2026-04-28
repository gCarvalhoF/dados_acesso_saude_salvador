import { useState, useRef, useEffect } from "react";

interface Option {
  value: number;
  label: string;
  description?: string;
}

interface Props {
  id: string;
  label: string;
  options: Option[];
  selected: number[];
  onChange: (selected: number[]) => void;
  max?: number;
}

export default function MultiSelect({ id, label, options, selected, onChange, max = 5 }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter((o) => {
    const term = search.toLowerCase();
    return (
      o.label.toLowerCase().includes(term) ||
      (o.description?.toLowerCase().includes(term) ?? false)
    );
  });

  function toggle(value: number) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else if (selected.length < max) {
      onChange([...selected, value]);
    }
  }

  function remove(value: number) {
    onChange(selected.filter((v) => v !== value));
  }

  const selectedLabels = selected.map(
    (v) => options.find((o) => o.value === v)?.label ?? String(v)
  );

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
        {label}
      </label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedLabels.map((lbl, i) => (
            <span
              key={selected[i]}
              className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              {lbl}
              <button
                type="button"
                onClick={() => remove(selected[i])}
                className="text-blue-500 hover:text-blue-700 leading-none"
                aria-label={`Remover ${lbl}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        id={id}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left text-sm border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {selected.length === 0
          ? "Selecione bairros..."
          : `${selected.length} selecionado${selected.length > 1 ? "s" : ""}`}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar bairro..."
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label="Buscar bairro"
            />
          </div>
          {selected.length >= max && (
            <p className="text-xs text-amber-600 px-3 py-1">Máximo de {max} bairros</p>
          )}
          {filtered.map((option) => {
            const isSelected = selected.includes(option.value);
            const isDisabled = !isSelected && selected.length >= max;
            return (
              <label
                key={option.value}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 ${
                  isDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggle(option.value)}
                  className="accent-blue-600"
                  aria-label={option.label}
                />
                <span>{option.label}</span>
                {option.description && (
                  <span className="text-xs text-gray-400 font-normal">
                    {option.description}
                  </span>
                )}
              </label>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-gray-400 px-3 py-2">Nenhum bairro encontrado</p>
          )}
        </div>
      )}
    </div>
  );
}
