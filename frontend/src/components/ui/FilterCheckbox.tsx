interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function FilterCheckbox({ label, checked, onChange }: Props) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-green-600"
        />
        <span className="font-medium">{label}</span>
      </label>
    </div>
  );
}
