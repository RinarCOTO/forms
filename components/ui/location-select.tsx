"use client";

import { memo } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { LocationOption } from "@/hooks/useLocationSelect";

interface LocationSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: LocationOption[];
  disabled?: boolean;
  placeholder: string;
  loading?: boolean;
}

export const LocationSelect = memo(({
  label, value, onChange, options, disabled, placeholder, loading
}: LocationSelectProps) => (
  <div className="space-y-1">
    <Label className="rpfaas-fill-label-sub">{label}</Label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rpfaas-fill-input appearance-none"
        disabled={disabled || loading}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>{opt.name}</option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
            </svg>
        }
      </span>
    </div>
  </div>
));

LocationSelect.displayName = "LocationSelect";
