import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Etiket + giriş alanı + (varsa) hata mesajı. */
export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className={`field${error ? " has-error" : ""}`}>
      <span>{label}</span>
      {children}
      {hint && !error && <small className="hint">{hint}</small>}
      {error && <small className="error">{error}</small>}
    </label>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  // Tür yalnızca value'dan çıkarılır; böylece seçenekler ve onChange ona uymak zorunda.
  options: { value: NoInfer<T>; label: string }[];
  onChange(value: NoInfer<T>): void;
}

/** Az sayıda seçenek için açılır liste yerine yan yana düğmeler (telefonda daha kolay). */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            className={option.value === value ? "selected" : undefined}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
