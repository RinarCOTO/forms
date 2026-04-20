import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MachineryItemData {
  kind_of_machinery: string;   // specific type under the selected actual use
  brand_model: string;
  capacity_hp: string;
  date_acquired: string;
  condition: string;
  economic_life_estimated: string;
  economic_life_remaining: string;
  year_installed: string;
  year_of_initial_operation: string;
  original_cost: string;
  conversion_factor: string;   // (FC2/FC1) × PI — manual entry per machine
  rcn: string;                 // auto-computed: original_cost × conversion_factor
  rate_of_depreciation: string; // % per year, default 5%, max 5% (Sec. 225 LGC)
  years_used: string;
  depreciated_value: string;   // auto-computed: RCN × (1 − total_depn_pct / 100)
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
    conversion_factor: "",
    rcn: "",
    rate_of_depreciation: "5",
    years_used: "",
    depreciated_value: "",
  };
}

// ---------------------------------------------------------------------------
// Actual Use options (use code → label + assessment level)
// ---------------------------------------------------------------------------

export const ACTUAL_USE_OPTIONS = [
  { code: "AA",    label: "Agricultural",                                     assessmentLevel: 40 },
  { code: "AR",    label: "Residential",                                      assessmentLevel: 50 },
  { code: "AC",    label: "Commercial",                                       assessmentLevel: 80 },
  { code: "AI",    label: "Industrial",                                       assessmentLevel: 80 },
  { code: "ASC",   label: "Special – Cultural",                               assessmentLevel: 15 },
  { code: "ASS",   label: "Special – Scientific",                             assessmentLevel: 15 },
  { code: "ASH",   label: "Special – Hospital",                               assessmentLevel: 15 },
  { code: "ASLWD", label: "Special – Local Water Districts",                  assessmentLevel: 10 },
  { code: "SG",    label: "Special – GOCCs / Power Generation & Transmission", assessmentLevel: 10 },
] as const;

export type ActualUseCode = typeof ACTUAL_USE_OPTIONS[number]["code"];

// ---------------------------------------------------------------------------
// Kind of Machinery by Actual Use
// ---------------------------------------------------------------------------

export const MACHINERY_KINDS_BY_USE: Record<string, string[]> = {
  AA: [
    "Irrigation Pumps and Systems",
    "Farm Tractors",
    "Threshers / Harvesters / Reapers",
    "Rice Mills / Corn Mills",
    "Livestock Feeding / Watering Equipment",
    "Poultry Equipment",
    "Greenhouse Climate Control Equipment",
    "Fishpond Aerators and Pumps",
  ],
  AR: [
    "Air Conditioning Units (permanently installed)",
    "Water Pumps and Tanks",
    "Residential Elevators",
    "Household Generator Sets",
    "Built-in Appliances (permanently attached)",
  ],
  AC: [
    "Transfer Pumps and Underground Tanks",
    "Car Lifts",
    "Elevators / Escalators",
    "Water Pumps and Tanks",
    "Office Equipment (permanently attached)",
    "Golf Course Maintenance Equipment",
    "HVAC / PA / Security Systems",
    "Restaurant Kitchen Equipment (permanently installed)",
  ],
  AI: [
    "Generator Sets",
    "Rail-Tracks",
    "Transmission Lines / Transmission Towers",
    "Cell Sites",
    "Submerged Pipelines",
    "Reservoirs / Dams",
    "Tailing Ponds",
    "Piers and Wharves",
    "Manufacturing Equipment",
    "Mining Equipment / Processing Plants",
    "Logging Equipment",
    "Boilers / Compressors / Turbines / Conveyors",
  ],
  ASC: [
    "Cultural Facility Equipment",
  ],
  ASS: [
    "Scientific Research Equipment",
  ],
  ASH: [
    "Hospital Medical Equipment",
    "Laboratory Equipment",
  ],
  ASLWD: [
    "Water Supply Equipment",
    "Water Treatment Equipment",
    "Distribution Pumps and Systems",
  ],
  SG: [
    "Power Generation Equipment",
    "Electric Transmission Equipment",
    "Substation Equipment",
  ],
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const YEAR_OPTIONS = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - i);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeDepreciation(item: MachineryItemData) {
  const oc = parseFloat(item.original_cost) || 0;
  const cf = parseFloat(item.conversion_factor) || 1;
  const rcn = oc * cf;

  const rate = Math.min(parseFloat(item.rate_of_depreciation) || 5, 5);
  const years = parseFloat(item.years_used) || 0;
  const totalDepnPct = Math.min(years * rate, 80);
  const totalDepnValue = rcn * (totalDepnPct / 100);
  const depreciatedValue = rcn - totalDepnValue;

  return { rcn, rate, totalDepnPct, totalDepnValue, depreciatedValue };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MachineryItemCardProps {
  index: number;
  onRemove: () => void;
  item: MachineryItemData;
  onChange: (field: keyof MachineryItemData, value: string) => void;
  actualUse: string; // form-level actual use code from step-1
}

export function MachineryItemCard({ index, onRemove, item, onChange, actualUse }: MachineryItemCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [ocFocused, setOcFocused] = useState(false);

  const { rcn, rate, totalDepnPct, totalDepnValue, depreciatedValue } = computeDepreciation(item);
  const kindOptions = MACHINERY_KINDS_BY_USE[actualUse] ?? [];

  // Sync computed rcn back to parent so it gets saved
  useEffect(() => {
    const oc = parseFloat(item.original_cost) || 0;
    const cf = parseFloat(item.conversion_factor) || 1;
    const computed = oc > 0 ? String(Math.round(oc * cf * 100) / 100) : "";
    if (computed !== item.rcn) onChange("rcn", computed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.original_cost, item.conversion_factor]);

  // Sync computed depreciated_value back to parent so it gets saved
  useEffect(() => {
    const oc = parseFloat(item.original_cost) || 0;
    const cf = parseFloat(item.conversion_factor) || 1;
    const rcnVal = oc * cf;
    const r = Math.min(parseFloat(item.rate_of_depreciation) || 5, 5);
    const years = parseFloat(item.years_used) || 0;
    const totalPct = Math.min(years * r, 80);
    const dv = rcnVal > 0 ? String(Math.round(rcnVal * (1 - totalPct / 100) * 100) / 100) : "";
    if (dv !== item.depreciated_value) onChange("depreciated_value", dv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.original_cost, item.conversion_factor, item.rate_of_depreciation, item.years_used]);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-primary/8 border-b border-primary/20 cursor-pointer select-none"
        onClick={() => setIsOpen(prev => !prev)}
      >
        <span className="text-sm font-semibold text-foreground">Item #{index + 1}</span>
        <div className="flex items-center gap-1">
          <ChevronDown className={`h-4 w-4 text-primary/60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">

          {/* Kind of Machinery | Brand & Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Kind of Machinery</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                value={item.kind_of_machinery}
                disabled={!actualUse}
                onChange={(e) => onChange("kind_of_machinery", e.target.value)}
              >
                <option value="">
                  {actualUse ? "Select kind of machinery" : "Set actual use in Step 1 first"}
                </option>
                {kindOptions.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Brand &amp; Model</Label>
              <Input
                className="rpfaas-fill-input"
                placeholder="e.g. Cummins C150D5"
                value={item.brand_model}
                onChange={(e) => onChange("brand_model", e.target.value)}
              />
            </div>
          </div>

          {/* Capacity/HP | Date Acquired | Condition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Condition when Acquired</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm"
                value={item.condition}
                onChange={(e) => onChange("condition", e.target.value)}
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="2nd_hand">2nd Hand</option>
              </select>
            </div>
          </div>

          {/* Economic Life Est | Economic Life Rem | Year Installed | Year Init Op */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Eco. Life — Est.</Label>
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
              <Label className="rpfaas-fill-label">Eco. Life — Rem.</Label>
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
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Year Installed</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm"
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
              <Label className="rpfaas-fill-label">Year of Initial Op.</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm"
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

          {/* ── Depreciation ── */}
          <div className="rounded-md border border-primary/20 bg-primary/5 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Depreciation</p>

            {/* Original Cost | Conversion Factor | RCN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">Original Cost</Label>
                <Input
                  className="rpfaas-fill-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="0.00"
                  value={ocFocused
                    ? item.original_cost
                    : item.original_cost
                      ? parseFloat(item.original_cost).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : ""}
                  onFocus={() => setOcFocused(true)}
                  onBlur={() => setOcFocused(false)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    if (raw === "" || /^\d*\.?\d*$/.test(raw)) onChange("original_cost", raw);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">Conversion Factor</Label>
                <Input
                  className="rpfaas-fill-input"
                  type="number"
                  step="0.0001"
                  placeholder="1.0000"
                  value={item.conversion_factor}
                  onChange={(e) => onChange("conversion_factor", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">RCN</Label>
                <div className="h-9 rounded-md border border-input bg-card px-3 flex items-center text-sm">
                  {rcn > 0 ? `₱${fmt(rcn)}` : <span className="text-muted-foreground text-xs">—</span>}
                </div>
              </div>
            </div>

            {/* Rate | Years Used | Total Dep% | Total Dep Value */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">Rate of Depreciation</Label>
                <div className="flex items-center rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                  <Input
                    className="rpfaas-fill-input border-0! rounded-none! focus-visible:ring-0 shadow-none"
                    type="number"
                    step="0.5"
                    min="0"
                    max="5"
                    placeholder="5"
                    value={item.rate_of_depreciation}
                    onChange={(e) => {
                      const v = Math.min(parseFloat(e.target.value) || 0, 5);
                      onChange("rate_of_depreciation", String(v));
                    }}
                  />
                  <span className="px-2 text-xs text-muted-foreground border-l border-input h-9 flex items-center">%/yr</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">Years Used</Label>
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
                <Label className="rpfaas-fill-label">Total Dep&apos;n %</Label>
                <div className="h-9 rounded-md border border-input bg-card px-3 flex items-center text-sm">
                  {rcn > 0 && item.years_used
                    ? <>{fmt(totalDepnPct)}%{totalDepnPct >= 80 && <span className="ml-2 text-xs text-amber-600 font-medium">cap</span>}</>
                    : <span className="text-muted-foreground text-xs">—</span>
                  }
                </div>
              </div>
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">Total Dep&apos;n Value</Label>
                <div className="h-9 rounded-md border border-input bg-card px-3 flex items-center text-sm">
                  {totalDepnValue > 0 ? `₱${fmt(totalDepnValue)}` : <span className="text-muted-foreground text-xs">—</span>}
                </div>
              </div>
            </div>

            {/* Depreciated Value — full width, highlighted */}
            <div className="space-y-1">
              <Label className="rpfaas-fill-label">Depreciated Value</Label>
              <div className="h-10 rounded-md border border-primary/30 bg-primary/10 px-3 flex items-center text-sm font-semibold text-foreground">
                {depreciatedValue > 0 ? `₱${fmt(depreciatedValue)}` : <span className="text-muted-foreground text-xs font-normal">—</span>}
              </div>
            </div>

            {rate < 5 && item.rate_of_depreciation !== "" && (
              <p className="text-xs text-muted-foreground">
                Using {rate}%/yr (LGU-set rate). Default is 5%/yr per Sec. 225 LGC.
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
