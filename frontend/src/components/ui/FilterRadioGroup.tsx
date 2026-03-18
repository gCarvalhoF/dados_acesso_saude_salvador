interface Option {
  value: string;
  label: string;
}

interface Props {
  name: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

export default function FilterRadioGroup({ name, label, value, options, onChange }: Props) {
  return (
    <div>
      <span className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
        {label}
      </span>
      <div className="space-y-1">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="accent-blue-500"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
