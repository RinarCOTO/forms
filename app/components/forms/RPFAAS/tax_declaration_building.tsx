"use client";

import "@/app/components/forms/RPFAAS/faas_table_forms.css";
import "@/app/components/forms/RPFAAS/components/taxDec.css";
import { TaxDecFooter } from "@/app/components/forms/RPFAAS/components";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuildingTaxDecFormData {
  // Identification
  transaction_code?: string;
  td_no?: string;
  arp_no?: string;
  pin?: string;
  oct_tct_cloa_no?: string;
  // Owner
  owner_name?: string;
  owner_address?: string;
  admin_care_of?: string;
  admin_address?: string;
  // Location
  property_address?: string;
  location_municipality?: string;
  location_barangay?: string;
  location_province?: string;
  // Building info
  type_of_building?: string;
  structure_type?: string;
  total_floor_area?: string | number;
  // Assessment
  market_value?: string | number;
  actual_use?: string;
  assessment_level?: string | number;
  assessed_value?: string | number;
  amount_in_words?: string;
  effectivity_of_assessment?: string;
  tax_status?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: string | number | undefined | null): string {
  if (val == null || val === "") return "";
  return String(val);
}

function fmtNumber(val: string | number | undefined | null): string {
  if (val == null || val === "") return "";
  const raw = String(val).replace(/,/g, "");
  const n = Number(raw);
  if (!Number.isFinite(n)) return String(val);
  const decimals = raw.includes(".") ? raw.split(".")[1]?.length ?? 0 : 0;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: Math.max(decimals, 0),
  });
}

function fmtAssessmentLevel(val: string | number | undefined | null): string {
  if (val == null || val === "") return "";
  const text = String(val);
  return text.includes("%") ? text : `${text}%`;
}

function fmtDate(val: string | undefined): string {
  if (!val) return "";
  const date = new Date(val.includes("T") ? val : `${val}T00:00:00`);
  if (Number.isNaN(date.getTime())) return val;
  const month = date.getMonth() + 1;
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaxDeclarationBuilding({
  data = {},
  datedDate,
  approvedDate,
}: {
  data?: BuildingTaxDecFormData;
  datedDate?: string;
  approvedDate?: string;
}) {
  const isTaxable = data.tax_status === "taxable";
  const isExempt  = data.tax_status === "exempt";

  return (
    <div className="rpfaas-print space-y-3 tax-dec-body" style={{ backgroundColor: "white" }}>
      <h1 className="text-lg font-bold text-center uppercase mb-1 tax-dec-title">
        Tax Declaration of Real Property
      </h1>
      <hr className="border-black border-t" />

      {/* TD No / PIN / Owner / Address */}
      <div className="space-y-1">
        <div className="grid grid-cols-2">
          <div className="flex gap-2">
            <div className="w-52 shrink-0">TD No:</div>
            <div className="border-b border-black flex-1 font-bold font-mono">{fmt(data.td_no || data.arp_no)}</div>
          </div>
          <div className="flex gap-2 justify-end">
            <div>Property Identification No:</div>
            <div className="border-b border-black w-40 font-bold">{fmt(data.pin)}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-52 shrink-0">OWNER:</div>
          <div className="border-b border-black flex-1 font-bold uppercase">{fmt(data.owner_name)}</div>
        </div>
        <div className="flex gap-2">
          <div className="w-52 shrink-0">Address:</div>
          <div className="border-b border-black flex-1 font-bold">{fmt(data.owner_address)}</div>
        </div>
        <div className="flex gap-2">
          <div className="w-52 shrink-0">Administrator / Beneficial User:</div>
          <div className="border-b border-black flex-1 font-bold uppercase">{fmt(data.admin_care_of)}</div>
        </div>
        <div className="flex gap-2">
          <div className="w-52 shrink-0">Address:</div>
          <div className="border-b border-black flex-1">{fmt(data.admin_address)}</div>
        </div>
      </div>

      {/* Location of Property */}
      <section className="space-y-1">
        <div className="font-bold italic">Location of Property</div>
        <div className="grid grid-cols-4 text-center gap-3">
          <div>
            <div className="border-b border-black w-40 print:w-30 mx-auto font-bold">
              {data.property_address ? fmt(data.property_address) : <span style={{ color: "white" }}>N/A</span>}
            </div>
            <div>No / Street / Sitio</div>
          </div>
          <div>
            <div className="border-b border-black w-40 print:w-30 mx-auto font-bold">{fmt(data.location_barangay)}</div>
            <div>Barangay</div>
          </div>
          <div>
            <div className="border-b border-black w-40 print:w-30 mx-auto font-bold">{fmt(data.location_municipality)}</div>
            <div>Municipality</div>
          </div>
          <div>
            <div className="border-b border-black w-40 print:w-30 mx-auto font-bold">
              {fmt(data.location_province) || "Mountain Province"}
            </div>
            <div>Province</div>
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="flex gap-2">
            <div className="w-36 shrink-0">OCT / TCT / CLOA No:</div>
            <div className="border-b border-black flex-1 font-bold">{fmt(data.oct_tct_cloa_no)}</div>
          </div>
          <div className="flex gap-2">
            <div className="w-36 shrink-0">Dated:</div>
            <div className="border-b border-black flex-1 font-bold">{fmtDate(datedDate)}</div>
          </div>
        </div>
      </section>

      {/* Appraisal Table */}
      <section className="space-y-1">
        <div className="grid grid-cols-2 mt-6 gap-3">
          <div className="flex gap-2">
            <div className="font-bold">KIND OF PROPERTY:</div>
            <div className="border-b border-black flex-1 text-center">Building</div>
          </div>
          <div className="flex gap-2">
            <div className="font-bold">ACTUAL USE:</div>
            <div className="border-b border-black flex-1 capitalize text-center">{fmt(data.actual_use)}</div>
          </div>
        </div>

        <div className="grid grid-cols-5 text-center mt-4 print:py-1" style={{ borderTop: "1.5px solid black", borderBottom: "1.5px solid black" }}>
          <div>TYPE OF BUILDING</div>
          <div>FLOOR AREA</div>
          <div>MARKET VALUE</div>
          <div>ASSESSMENT LEVEL</div>
          <div>ASSESSED VALUE</div>
        </div>
        <div className="grid grid-cols-5 gap-3 text-center">
          <div className="border-b border-black w-full mx-auto capitalize">{fmt(data.type_of_building)}</div>
          <div className="border-b border-black w-full mx-auto">{fmtNumber(data.total_floor_area)}</div>
          <div className="border-b border-black w-full mx-auto">{fmtNumber(data.market_value)}</div>
          <div className="border-b border-black w-full mx-auto">
            {fmtAssessmentLevel(data.assessment_level)}
          </div>
          <div className="border-b border-black w-full mx-auto font-bold">{data.assessed_value ? `Php ${fmtNumber(data.assessed_value)}` : ""}</div>
        </div>
        <div className="grid grid-cols-5 gap-3 text-center">
          <div className="border-b border-black w-full mx-auto capitalize">{fmt(data.structure_type)}</div>
          <div className="border-b border-black w-full mx-auto"></div>
          <div className="border-b border-black w-full mx-auto"></div>
          <div className="border-b border-black w-full mx-auto"></div>
          <div className="border-b border-black w-full mx-auto"></div>
        </div>
        <div className="grid grid-cols-5 gap-3 text-center">
          <div className="border-b border-black w-full mx-auto"></div>
          <div className="border-b border-black w-full mx-auto"></div>
          <div className="border-b border-black w-full mx-auto"></div>
          <div className="border-b border-black w-full mx-auto"></div>
          <div className="border-b border-black w-full mx-auto"></div>
        </div>
        <div className="grid grid-cols-5 gap-3 text-center font-semibold">
          <div className="border-b border-black w-full mx-auto">Total</div>
          <div className="border-b border-black w-full mx-auto font-bold">{fmtNumber(data.total_floor_area)}</div>
          <div className="border-b border-black w-full mx-auto font-bold">{fmtNumber(data.market_value)}</div>
          <div className="border-b border-black w-full mx-auto font-bold">{fmtAssessmentLevel(data.assessment_level)}</div>
          <div className="border-b border-black w-full mx-auto font-bold">{data.assessed_value ? `Php ${fmtNumber(data.assessed_value)}` : ""}</div>
        </div>
      </section>

      <TaxDecFooter
        taxable={isTaxable}
        exempt={isExempt}
        effectivityOfAssessment={data.effectivity_of_assessment}
        amountInWords={data.amount_in_words}
        approvedDate={approvedDate}
      />

      {/* Previous Assessment */}
      <div className="space-y-1">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex gap-2">
            <div>Prev. TD No:</div>
            <div className="border-b border-black flex-1"></div>
          </div>
          <div className="flex gap-2">
            <div>Owner:</div>
            <div className="border-b border-black flex-1"></div>
          </div>
          <div className="flex gap-2">
            <div className="shrink-0 w-28">Assessed Value:</div>
            <div className="border-b border-black flex-1 text-center">{fmtNumber(data.assessed_value)}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div></div>
          <div></div>
          <div className="flex gap-2">
            <div className="shrink-0 w-28">Market Value:</div>
            <div className="border-b border-black flex-1 text-center">{fmtNumber(data.market_value)}</div>
          </div>
        </div>
      </div>

      {/* Memoranda */}
      <section className="space-y-2">
        <div className="italic">Memoranda:</div>
        <div className="flex gap-2">
          <div className="font-bold shrink-0">RE-ASSESSMENT —</div>
          <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
        </div>
        <div className="flex gap-2 mt-24 print:mt-2">
          <div className="font-bold shrink-0 tax-dec-note">NOTE:</div>
          <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
        </div>
      </section>
    </div>
  );
}
