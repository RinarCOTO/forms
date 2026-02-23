"use client";

export const LAND_CLASSIFICATIONS = [
  { id: "residential",  label: "Residential" },
  { id: "agricultural", label: "Agricultural" },
  { id: "commercial",   label: "Commercial" },
  { id: "industrial",   label: "Industrial" },
  { id: "mineral",      label: "Mineral" },
  { id: "timberland",   label: "Timberland" },
  { id: "special",      label: "Special" },
] as const;

export type LandClassificationId = (typeof LAND_CLASSIFICATIONS)[number]["id"];

export const LAND_SUB_CLASSIFICATIONS: Partial<Record<LandClassificationId, string[]>> = {
  agricultural: [
    "Riceland Irrigated",
    "Riceland Unirrigated",
    "Cornland",
    "Coconut Land",
    "Sugarland",
    "Orchard",
    "Abaca Land",
    "Pasture / Grazing Land",
    "Fishpond / Inland Fishery",
    "Salt Beds",
    "Nipa Swamp",
    "Bamboo Land",
  ],
};

interface LandSubClassificationFormProps {
  classification: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export function LandSubClassificationForm({
  classification,
  label = "Sub-Classification",
  value,
  onChange,
}: LandSubClassificationFormProps) {
  const options = LAND_SUB_CLASSIFICATIONS[classification as LandClassificationId] ?? [];
  const disabled = !classification;

  return (
    <div className="rpfaas-fill-field space-y-1">
      <label className="rpfaas-fill-label">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="rpfaas-fill-input appearance-none w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select sub-classification</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <svg
          className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

interface LandClassificationFormProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export function LandClassificationForm({ label = "Classification", value, onChange }: LandClassificationFormProps) {
  return (
    <div className="rpfaas-fill-field space-y-1">
      <label className="rpfaas-fill-label">{label}</label>
      <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rpfaas-fill-input appearance-none w-full"
      >
        <option value="">Select classification</option>
        {LAND_CLASSIFICATIONS.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.label}
          </option>
        ))}
      </select>
      <svg
        className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
      </svg>
      </div>
    </div>
  );
}
