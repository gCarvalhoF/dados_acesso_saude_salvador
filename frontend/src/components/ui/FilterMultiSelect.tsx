import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface Props {
  id: string;
  label: string;
  value: string; // comma-separated selected values
  options: Option[]; // first option with value="" is the catch-all / placeholder
  onChange: (value: string) => void; // returns comma-separated or ""
}

export default function FilterMultiSelect({ id, label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = value ? value.split(",") : [];

  // The option with value="" is treated as the placeholder / "all" option
  const placeholder = options.find((o) => o.value === "")?.label ?? "Selecione...";
  const selectableOptions = options.filter((o) => o.value !== "");

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = selectableOptions.filter((o) => {
    const term = search.toLowerCase();
    return (
      o.label.toLowerCase().includes(term) ||
      (o.description?.toLowerCase().includes(term) ?? false)
    );
  });

  function toggle(val: string) {
    if (selected.includes(val)) {
      const next = selected.filter((v) => v !== val);
      onChange(next.join(","));
    } else {
      onChange([...selected, val].join(","));
    }
  }

  function remove(val: string) {
    const next = selected.filter((v) => v !== val);
    onChange(next.join(","));
  }

  function clearAll() {
    onChange("");
    setOpen(false);
  }

  const selectedLabels = selected.map(
    (v) => selectableOptions.find((o) => o.value === v)?.label ?? v
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-baseline justify-between mb-1">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-gray-600 uppercase tracking-wide"
        >
          {label}
        </label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-normal normal-case"
          >
            Limpar
          </button>
        )}
      </div>

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
          ? placeholder
          : `${selected.length} selecionado${selected.length > 1 ? "s" : ""}`}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label={`Buscar ${label.toLowerCase()}`}
            />
          </div>
          {filtered.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
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
            <p className="text-xs text-gray-400 px-3 py-2">Nenhum resultado</p>
          )}
        </div>
      )}
    </div>
  );
}
