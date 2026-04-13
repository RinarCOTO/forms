import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MachineryItemData {
  kind_of_machinery: string;
  brand_model: string;
  capacity_hp: string;
  date_acquired: string;
  condition: string;
  economic_life_estimated: string;
  economic_life_remaining: string;
  year_installed: string;
  year_of_initial_operation: string;
  original_cost: string;
  rcn: string;
  years_used: string;
  depreciated_value: string;
}

export function createEmptyItem(): MachineryItemData {
  return {
    kind_of_machinery: "",
    brand_model: "",
    capacity_hp: "",
    date_acquired: "",
    condition: "",
    economic_life_estimated: "",
    economic_life_remaining: "",
    year_installed: "",
    year_of_initial_operation: "",
    original_cost: "",
    rcn: "",
    years_used: "",
    depreciated_value: "",
  };
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MACHINERY_KINDS = [
  { group: "Agricultural Machinery", value: "agricultural" },
  { group: "Residential Machinery", value: "residential" },
  { group: "Commercial and Industrial Machinery", value: "commercial_industrial" },
  { group: "Special Classes – Hospital (15%)", value: "special_hospital" },
  { group: "Special Classes – Local Water District (10%)", value: "special_water_district" },
  { group: "Special Classes – GOCC / Power Generation (10%)", value: "special_gocc" },
  { group: "Special Classes – Pollution Control / Environmental", value: "special_pollution_control" },
];

const YEAR_OPTIONS = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - i);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MachineryItemCardProps {
  index: number;
  onRemove: () => void;
  item: MachineryItemData;
  onChange: (field: keyof MachineryItemData, value: string) => void;
}

export function MachineryItemCard({ index, onRemove, item, onChange }: MachineryItemCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(prev => !prev)}>
        <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
        <div className="flex items-center gap-1">
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* Row 1 — Kind of Machinery */}
          <div className="space-y-1">
            <Label className="rpfaas-fill-label">Kind of Machinery</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={item.kind_of_machinery}
              onChange={(e) => onChange("kind_of_machinery", e.target.value)}
            >
              <option value="">Select kind of machinery</option>
              {MACHINERY_KINDS.map(k => (
                <option key={k.value} value={k.value}>{k.group}</option>
              ))}
            </select>
          </div>

          {/* Row 2 — Brand & Model | Capacity/HP | Date Acquired */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Brand &amp; Model</Label>
              <Input
                className="rpfaas-fill-input"
                placeholder="e.g. Cummins C150D5"
                value={item.brand_model}
                onChange={(e) => onChange("brand_model", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Capacity / HP</Label>
              <Input
                className="rpfaas-fill-input"
                placeholder="e.g. 150 KVA / 120 HP"
                value={item.capacity_hp}
                onChange={(e) => onChange("capacity_hp", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Date Acquired</Label>
              <Input
                className="rpfaas-fill-input"
                type="date"
                value={item.date_acquired}
                onChange={(e) => onChange("date_acquired", e.target.value)}
              />
            </div>
          </div>

          {/* Row 3 — Condition | Economic Life (Estimated) | Economic Life (Remaining) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Condition when Acquired</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={item.condition}
                onChange={(e) => onChange("condition", e.target.value)}
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="2nd_hand">2nd Hand</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Economic Life — Estimated</Label>
              <div className="flex items-center rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                <Input
                  className="rpfaas-fill-input border-0! rounded-none! focus-visible:ring-0 shadow-none"
                  type="number"
                  placeholder="0"
                  value={item.economic_life_estimated}
                  onChange={(e) => onChange("economic_life_estimated", e.target.value)}
                />
                <span className="px-2 text-xs text-muted-foreground border-l border-input h-9 flex items-center">yrs</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Economic Life — Remaining</Label>
              <div className="flex items-center rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                <Input
                  className="rpfaas-fill-input border-0! rounded-none! focus-visible:ring-0 shadow-none"
                  type="number"
                  placeholder="0"
                  value={item.economic_life_remaining}
                  onChange={(e) => onChange("economic_life_remaining", e.target.value)}
                />
                <span className="px-2 text-xs text-muted-foreground border-l border-input h-9 flex items-center">yrs</span>
              </div>
            </div>
          </div>

          {/* Row 4 — Year Installed | Year of Initial Operation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Year Installed</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={item.year_installed}
                onChange={(e) => onChange("year_installed", e.target.value)}
              >
                <option value="">Select year</option>
                {YEAR_OPTIONS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Year of Initial Operation</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={item.year_of_initial_operation}
                onChange={(e) => onChange("year_of_initial_operation", e.target.value)}
              >
                <option value="">Select year</option>
                {YEAR_OPTIONS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t my-4" />

          {/* Depreciation */}
          <p className="text-sm font-semibold text-foreground mb-3">Depreciation</p>

          {/* Row 1 — Original Cost | Conversion Factor | RCN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Original Cost</Label>
              <Input
                className="rpfaas-fill-input"
                type="number"
                placeholder="0.00"
                value={item.original_cost}
                onChange={(e) => onChange("original_cost", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Conversion Factor</Label>
              <div className="h-9 rounded-md border border-input bg-muted/40 px-3 flex items-center text-xs text-muted-foreground">—</div>
            </div>
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">RCN</Label>
              <Input
                className="rpfaas-fill-input"
                type="number"
                placeholder="0.00"
                value={item.rcn}
                onChange={(e) => onChange("rcn", e.target.value)}
              />
            </div>
          </div>

          {/* Row 2 — No. of Years Used | Rate of Depreciation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">No. of Years Used</Label>
              <div className="flex items-center rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                <Input
                  className="rpfaas-fill-input border-0! rounded-none! focus-visible:ring-0 shadow-none"
                  type="number"
                  placeholder="0"
                  value={item.years_used}
                  onChange={(e) => onChange("years_used", e.target.value)}
                />
                <span className="px-2 text-xs text-muted-foreground border-l border-input h-9 flex items-center">yrs</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Rate of Depreciation</Label>
              <div className="h-9 rounded-md border border-input bg-muted/40 px-3 flex items-center text-xs text-muted-foreground">—</div>
            </div>
          </div>

          {/* Row 3 — Total Depreciation (% | Value) | Depreciated Value */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Total Dep'n — %</Label>
              <div className="h-9 rounded-md border border-input bg-muted/40 px-3 flex items-center text-xs text-muted-foreground">—</div>
            </div>
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Total Dep'n — Value</Label>
              <div className="h-9 rounded-md border border-input bg-muted/40 px-3 flex items-center text-xs text-muted-foreground">—</div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="rpfaas-fill-label">Depreciated Value</Label>
              <Input
                className="rpfaas-fill-input"
                type="number"
                placeholder="0.00"
                value={item.depreciated_value}
                onChange={(e) => onChange("depreciated_value", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
