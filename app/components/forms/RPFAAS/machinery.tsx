"use client";

import "@/app/components/forms/RPFAAS/faas_table_forms.css";
import FaasFooter from "./faas-footer";
import { SectionHeader } from "./components/SectionHeader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MachineryItem {
  kind_of_machinery?: string;
  brand_model?: string;
  capacity_hp?: string;
  date_acquired?: string;
  condition?: string;
  economic_life_estimated?: string | number;
  economic_life_remaining?: string | number;
  year_installed?: string | number;
  year_of_initial_operation?: string | number;
  original_cost?: string | number;
  rcn?: string | number;
  years_used?: string | number;
  depreciated_value?: string | number;
}

export interface MachineryFormData {
  // Step 1 — identification
  transaction_code?: string;
  arp_no?: string;
  oct_tct_cloa_no?: string;
  pin?: string;
  survey_no?: string;
  lot_no?: string;
  blk?: string | number;
  previous_td_no?: string;
  previous_owner?: string;
  previous_av?: string | number;
  previous_mv?: string | number;
  previous_area?: string | number;
  // Step 1 — owner
  owner_name?: string;
  admin_care_of?: string;
  owner_address?: string;
  admin_address?: string;
  // Step 1 — property location
  property_address?: string;
  location_province?: string;
  location_municipality?: string;
  location_barangay?: string;
  // Step 1 — land / building reference
  land_owner?: string;
  land_pin?: string;
  land_arp_no?: string;
  land_area?: string | number;
  building_owner?: string;
  building_pin?: string;
  building_td_arp_no?: string;
  // Step 2 — appraisal items
  appraisal_items?: MachineryItem[];
  // Step 4 — assessment
  kind_of_machinery?: string;
  market_value?: string | number;
  assessment_level?: string | number;
  assessed_value?: string | number;
  amount_in_words?: string;
  tax_status?: string;
  effectivity_of_assessment?: string | number;
  appraised_by?: string;
  municipal_reviewer_id?: string;
  provincial_reviewer_id?: string;
  memoranda?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const KIND_LABELS: Record<string, string> = {
  agricultural:              "Agricultural",
  residential:               "Residential",
  commercial_industrial:     "Commercial / Industrial",
  special_hospital:          "Special – Hospital",
  special_water_district:    "Special – Water District",
  special_gocc:              "Special – GOCC",
  special_pollution_control: "Special – Pollution Control",
};

const formatCurrency = (val: string | number | undefined | null): string => {
  const n = parseFloat(String(val ?? ""));
  if (isNaN(n)) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmt = (val: string | number | undefined | null): string =>
  val !== undefined && val !== null && val !== "" ? String(val) : "";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MachineryForm({ data }: { data?: MachineryFormData }) {
  if (!data) return null;

  const items: MachineryItem[] = data.appraisal_items ?? [];

  return (
    <div
      className="rpfaas-print"
      style={{ backgroundColor: "white" }}
      data-print-ready="true"
    >
      <h1 className="text-lg font-bold text-center uppercase mb-1">
        Real Property Field Appraisal &amp; Assessment Sheet – Machinery
      </h1>

      {/* ── Basic Info ── */}
      <table>
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "28%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "28%" }} />
        </colgroup>
        <tbody>
          <tr className="text-right">
            <td colSpan={4} className="pr-4">
              Transaction Code:{" "}
              <span className="font-bold">{fmt(data.transaction_code)}</span>
            </td>
          </tr>

          <tr>
            <td>ARP No.:</td>
            <td className="font-bold font-mono">{fmt(data.arp_no)}</td>
            <td>PIN:</td>
            <td className="font-bold">{fmt(data.pin)}</td>
          </tr>

          <tr>
            <td>OCT/TCT/CLOA No.</td>
            <td className="font-bold">{fmt(data.oct_tct_cloa_no)}</td>
            <td>Survey No.</td>
            <td className="font-bold">{fmt(data.survey_no)}</td>
          </tr>

          <tr className="border-b-2">
            <td>Lot No.</td>
            <td className="font-bold">{fmt(data.lot_no)}</td>
            <td>BLK</td>
            <td className="font-bold">{fmt(data.blk)}</td>
          </tr>

          <tr data-field="owner_name">
            <td>Owner:</td>
            <td colSpan={3} className="font-bold uppercase">{fmt(data.owner_name)}</td>
          </tr>

          <tr data-field="owner_address">
            <td>Address:</td>
            <td colSpan={3}>{fmt(data.owner_address)}</td>
          </tr>

          <tr data-field="admin_care_of">
            <td>Administration/Care of:</td>
            <td colSpan={3} className="capitalize">{fmt(data.admin_care_of)}</td>
          </tr>

          <tr className="border-b-2">
            <td>Address:</td>
            <td colSpan={3}>{fmt(data.admin_address)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Location of Property ── */}
      <table>
        <colgroup>
          <col style={{ width: "33%" }} />
          <col style={{ width: "33%" }} />
          <col style={{ width: "33%" }} />
        </colgroup>
        <tbody>
          <SectionHeader>LOCATION OF PROPERTY</SectionHeader>

          <tr className="border-t-2" data-field="location_municipality">
            <td>No/Street/Sitio:</td>
            <td>
              <div className="rpfaas-inner-grid grid grid-cols-2 divide-x divide-black items-stretch h-full">
                <div className="font-bold self-stretch flex items-center">{fmt(data.property_address)}</div>
                <div className="text-right self-stretch flex items-center justify-end">Municipality:</div>
              </div>
            </td>
            <td className="font-bold capitalize">{fmt(data.location_municipality)}</td>
          </tr>

          <tr className="border-b-2 border-black" data-field="location_barangay location_province">
            <td>Barangay:</td>
            <td>
              <div className="rpfaas-inner-grid grid grid-cols-2 divide-x divide-black items-stretch h-full">
                <div className="font-bold self-stretch flex items-center">{fmt(data.location_barangay)}</div>
                <div className="text-right self-stretch flex items-center justify-end">Province:</div>
              </div>
            </td>
            <td className="font-bold">{fmt(data.location_province)}</td>
          </tr>

          {/* Land & Building Reference */}
          <SectionHeader className="p-0!">
            <div className="flex">
              <div className="flex-2 px-2 py-1 form-table-header">LAND REFERENCE</div>
              <div className="flex-1 text-center border-l border-black px-1 py-1">BUILDING REFERENCE</div>
            </div>
          </SectionHeader>

          <tr className="border-t-2">
            <td>Land Owner:</td>
            <td className="font-bold">{fmt(data.land_owner)}</td>
            <td>Building Owner: <span className="font-bold">{fmt(data.building_owner)}</span></td>
          </tr>
          <tr>
            <td>PIN:</td>
            <td className="font-bold">{fmt(data.land_pin)}</td>
            <td>PIN: <span className="font-bold">{fmt(data.building_pin)}</span></td>
          </tr>
          <tr className="border-b-2">
            <td>TD/ARP No.:</td>
            <td className="font-bold">{fmt(data.land_arp_no)}</td>
            <td>TD/ARP No.: <span className="font-bold">{fmt(data.building_td_arp_no)}</span></td>
          </tr>
        </tbody>
      </table>

      {/* ── Machinery Items ── */}
      <table>
        <colgroup>
          <col style={{ width: "4%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "9%" }} />
        </colgroup>
        <tbody>
          <SectionHeader colSpan={10}>PROPERTY APPRAISAL</SectionHeader>

          {/* Column headers */}
          <tr className="bg-gray-100 text-xs font-semibold text-center border-t-2">
            <td>#</td>
            <td>Kind of Machinery</td>
            <td>Brand &amp; Model</td>
            <td>Capacity / HP</td>
            <td>Date Acquired</td>
            <td>Condition</td>
            <td>Eco. Life Est. (yrs)</td>
            <td>Eco. Life Rem. (yrs)</td>
            <td>Year Installed</td>
            <td>Year Init. Op.</td>
          </tr>

          {items.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center text-muted-foreground italic py-2">
                No machinery items recorded.
              </td>
            </tr>
          ) : (
            items.map((item, i) => (
              <tr key={i} className="text-xs text-center">
                <td>{i + 1}</td>
                <td className="text-left">{KIND_LABELS[item.kind_of_machinery ?? ""] ?? fmt(item.kind_of_machinery)}</td>
                <td className="text-left">{fmt(item.brand_model)}</td>
                <td>{fmt(item.capacity_hp)}</td>
                <td>{fmt(item.date_acquired)}</td>
                <td>{item.condition === "new" ? "New" : item.condition === "2nd_hand" ? "2nd Hand" : fmt(item.condition)}</td>
                <td>{fmt(item.economic_life_estimated)}</td>
                <td>{fmt(item.economic_life_remaining)}</td>
                <td>{fmt(item.year_installed)}</td>
                <td>{fmt(item.year_of_initial_operation)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ── Depreciation detail per item ── */}
      {items.length > 0 && (
        <table>
          <colgroup>
            <col style={{ width: "4%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            {/* Total Dep'n spans 2 sub-cols */}
            <col style={{ width: "9%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <tbody>
            <SectionHeader colSpan={10}>DEPRECIATION</SectionHeader>

            {/* Row 1 — main headers (Total Dep'n spans 2) */}
            <tr className="bg-gray-100 text-xs font-semibold text-center border-t-2">
              <td rowSpan={2}>#</td>
              <td rowSpan={2}>Kind of Machinery</td>
              <td rowSpan={2}>Original Cost</td>
              <td rowSpan={2}>Conv. Factor</td>
              <td rowSpan={2}>RCN</td>
              <td rowSpan={2}>No. of Yrs Used</td>
              <td rowSpan={2}>Rate of Dep'n</td>
              <td colSpan={2}>Total Dep'n</td>
              <td rowSpan={2}>Depr. Value</td>
            </tr>

            {/* Row 2 — sub-headers for Total Dep'n */}
            <tr className="bg-gray-100 text-xs font-semibold text-center">
              <td>%</td>
              <td>Value</td>
            </tr>

            {/* Data rows */}
            {items.map((item, i) => (
              <tr key={i} className="text-xs text-center">
                <td>{i + 1}</td>
                <td className="text-left">{KIND_LABELS[item.kind_of_machinery ?? ""] ?? fmt(item.kind_of_machinery)}</td>
                <td className="text-right">{item.original_cost ? `₱${formatCurrency(item.original_cost)}` : "—"}</td>
                <td>—</td>
                <td className="text-right">{item.rcn ? `₱${formatCurrency(item.rcn)}` : "—"}</td>
                <td>{fmt(item.years_used)}</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td className="text-right font-bold">{item.depreciated_value ? `₱${formatCurrency(item.depreciated_value)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── Property Assessment ── */}
      <table>
        <tbody>
          <SectionHeader colSpan={4}>PROPERTY ASSESSMENT</SectionHeader>

          <tr className="text-center bg-gray-100">
            <td>Actual Use</td>
            <td>Market Value</td>
            <td>Assessment Level</td>
            <td>Assessed Value</td>
          </tr>

          <tr data-field="kind_of_machinery market_value assessment_level assessed_value" className="text-center">
            <td className="font-bold capitalize">
              {KIND_LABELS[data.kind_of_machinery ?? ""] ?? fmt(data.kind_of_machinery)}
            </td>
            <td className="font-bold">
              {data.market_value ? `₱${formatCurrency(data.market_value)}` : ""}
            </td>
            <td className="font-bold">
              {data.assessment_level ? `${fmt(data.assessment_level)}%` : ""}
            </td>
            <td className="font-bold">
              {data.assessed_value ? `₱${formatCurrency(data.assessed_value)}` : ""}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Footer (signatures, memoranda, previous TD) ── */}
      <FaasFooter
        amountInWords={data.amount_in_words ?? ""}
        taxStatus={data.tax_status}
        locationMunicipality={data.location_municipality}
        effectivityOfAssessment={fmt(data.effectivity_of_assessment)}
        appraisedById={data.appraised_by}
        municipalReviewerId={data.municipal_reviewer_id}
        provincialReviewerId={data.provincial_reviewer_id}
        memoranda={data.memoranda}
        previousTdNo={data.previous_td_no}
        previousOwner={data.previous_owner}
        previousAv={data.previous_av}
        previousMv={data.previous_mv}
        previousArea={data.previous_area}
      />
    </div>
  );
}
