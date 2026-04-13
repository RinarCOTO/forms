"use client";

import { Suspense } from "react";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

// ─── Static mockup — no state/API wiring yet ────────────────────────────────
// Visit /machinery/fill/step-2 to preview the layout.

const MACHINERY_KINDS = [
  // Agricultural
  { group: "Agricultural Machinery", value: "agricultural" },
  // Residential
  { group: "Residential Machinery", value: "residential" },
  // Commercial & Industrial
  { group: "Commercial and Industrial Machinery", value: "commercial_industrial" },
  // Special Classes
  { group: "Special Classes – Hospital (15%)", value: "special_hospital" },
  { group: "Special Classes – Local Water District (10%)", value: "special_water_district" },
  { group: "Special Classes – GOCC / Power Generation (10%)", value: "special_gocc" },
  { group: "Special Classes – Pollution Control / Environmental", value: "special_pollution_control" },
];

const YEAR_OPTIONS = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - i);

function MachineryItemCard({ index }: { index: number }) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Row 1 — Kind of Machinery */}
      <div className="space-y-1">
        <Label className="rpfaas-fill-label">Kind of Machinery</Label>
        <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
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
          <Input className="rpfaas-fill-input" placeholder="e.g. Cummins C150D5" />
        </div>
        <div className="space-y-1">
          <Label className="rpfaas-fill-label">Capacity / HP</Label>
          <Input className="rpfaas-fill-input" placeholder="e.g. 150 KVA / 120 HP" />
        </div>
        <div className="space-y-1">
          <Label className="rpfaas-fill-label">Date Acquired</Label>
          <Input className="rpfaas-fill-input" type="date" />
        </div>
      </div>

      {/* Row 3 — Condition | Economic Life (Estimated) | Economic Life (Remaining) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="rpfaas-fill-label">Condition when Acquired</Label>
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
            <option value="">Select condition</option>
            <option value="new">New</option>
            <option value="2nd_hand">2nd Hand</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="rpfaas-fill-label">Economic Life — Estimated</Label>
          <div className="flex items-center rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
            <Input className="rpfaas-fill-input border-0 focus-visible:ring-0 shadow-none" type="number" placeholder="0" />
            <span className="px-2 text-xs text-muted-foreground bg-muted border-l border-input h-9 flex items-center">yrs</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="rpfaas-fill-label">Economic Life — Remaining</Label>
          <div className="flex items-center rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
            <Input className="rpfaas-fill-input border-0 focus-visible:ring-0 shadow-none" type="number" placeholder="0" />
            <span className="px-2 text-xs text-muted-foreground bg-muted border-l border-input h-9 flex items-center">yrs</span>
          </div>
        </div>
      </div>

      {/* Row 4 — Year Installed | Year of Initial Operation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="rpfaas-fill-label">Year Installed</Label>
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
            <option value="">Select year</option>
            {YEAR_OPTIONS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="rpfaas-fill-label">Year of Initial Operation</Label>
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
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
          <Input className="rpfaas-fill-input" type="number" placeholder="0.00" />
        </div>
        <div className="space-y-1">
          <Label className="rpfaas-fill-label">Conversion Factor</Label>
          <div className="h-9 rounded-md border border-input bg-muted/40 px-3 flex items-center text-xs text-muted-foreground">—</div>
        </div>
        <div className="space-y-1">
          <Label className="rpfaas-fill-label">RCN</Label>
          <Input className="rpfaas-fill-input" type="number" placeholder="0.00" />
        </div>
      </div>

      {/* Row 2 — No. of Years Used | Rate of Depreciation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-1">
          <Label className="rpfaas-fill-label">No. of Years Used</Label>
          <div className="flex items-center rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
            <Input className="rpfaas-fill-input border-0 focus-visible:ring-0 shadow-none" type="number" placeholder="0" />
            <span className="px-2 text-xs text-muted-foreground bg-muted border-l border-input h-9 flex items-center">yrs</span>
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
          <Input className="rpfaas-fill-input" type="number" placeholder="0.00" />
        </div>
      </div>
    </div>
  );
}

function MachineryStep2Content() {
  return (
    <FormFillLayout
      breadcrumbParent={{ label: "Machinery", href: "#" }}
      pageTitle="Step 2: Property Appraisal"
      sidePanel={null}
    >
      <header className="rpfaas-fill-header mb-6">
        <h1 className="rpfaas-fill-title">Fill-up Form: RPFAAS - Machinery</h1>
        <p className="text-sm text-muted-foreground">Enter machinery appraisal details below.</p>
      </header>

      <form className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">
        <FormSection title="Property Appraisal">
          <div className="space-y-4">
            <MachineryItemCard index={0} />
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-4">
            <Plus className="h-4 w-4 mr-1" /> Add Machinery Item
          </Button>
        </FormSection>
      </form>
    </FormFillLayout>
  );
}

export default function MachineryStep2Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <MachineryStep2Content />
    </Suspense>
  );
}
