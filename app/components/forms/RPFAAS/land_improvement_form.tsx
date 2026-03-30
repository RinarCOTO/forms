"use client";

import "@/app/components/forms/RPFAAS/faas_table_forms.css";
import FaasFooter from "./faas-footer";
import { SectionHeader } from "./components/SectionHeader";

// ─── Adjustment factor choices (mirrors step-4 page) ─────────────────────────
const ADDITIONAL_FLAT_RATE_CHOICES = [
  { id: "road-national",   name: "Provincial/National Road",         percentage:  0 },
  { id: "road-allweather", name: "All Weather Road",                 percentage: -3 },
  { id: "road-dirt",       name: "Dirt Road",                        percentage: -6 },
  { id: "road-none",       name: "No Road Outlet",                   percentage: -9 },
  { id: "awr-0-1",         name: "0–1 km to All-Weather Road",       percentage:  0 },
  { id: "awr-1-3",         name: "Over 1–3 km to All-Weather Road",  percentage: -2 },
  { id: "awr-3-6",         name: "Over 3–6 km to All-Weather Road",  percentage: -4 },
  { id: "awr-6-9",         name: "Over 6–9 km to All-Weather Road",  percentage: -6 },
  { id: "awr-9+",          name: "Over 9 km to All-Weather Road",    percentage: -8 },
  { id: "tc-0-1",          name: "0–1 km to Trading Center",         percentage: +5 },
  { id: "tc-1-3",          name: "Over 1–3 km to Trading Center",    percentage:  0 },
  { id: "tc-3-6",          name: "Over 3–6 km to Trading Center",    percentage: -2 },
  { id: "tc-6-9",          name: "Over 6–9 km to Trading Center",    percentage: -4 },
  { id: "tc-9+",           name: "Over 9 km to Trading Center",      percentage: -6 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LandImprovementFormData {
  // Identification
  transaction_code?: string;
  arp_no?: string;
  pin?: string;
  oct_tct_cloa_no?: string;
  survey_no?: string;
  lot_no?: string;
  blk?: string;
  previous_td_no?: string;
  previous_owner?: string;
  previous_av?: string | number;
  previous_mv?: string | number;
  previous_area?: string | number;
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
  // Boundaries
  north_property?: string;
  south_property?: string;
  east_property?: string;
  west_property?: string;
  // Appraisal
  classification?: string;
  sub_classification?: string;
  land_class?: string;
  unit_value?: string | number;
  land_area?: string | number;
  base_market_value?: string | number;
  // Adjustments
  additional_flat_rate_choice?: string;
  // Assessment
  market_value?: string | number;
  actual_use?: string;
  assessment_level?: string | number;
  assessed_value?: string | number;
  amount_in_words?: string;
  effectivity_of_assessment?: string;
  appraised_by?: string;
  municipal_reviewer_id?: string;
  provincial_reviewer_id?: string;
  memoranda?: string;
  tax_status?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: string | number | undefined | null): string {
  if (val == null || val === "") return "";
  return String(val);
}

function fmtMoney(val: string | number | undefined | null): string {
  if (val == null || val === "") return "";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return String(val);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function cap(val: string | undefined | null): string {
  if (!val) return "";
  return val.charAt(0).toUpperCase() + val.slice(1);
}

// ─── Main component ───────────────────────────────────────────────────────────

const LandImprovementForm = ({ data }: { data: LandImprovementFormData }) => {
  const selectedAdjustments = (data.additional_flat_rate_choice ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => ADDITIONAL_FLAT_RATE_CHOICES.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const baseMarketValue = data.base_market_value
    ? parseFloat(String(data.base_market_value)) || 0
    : 0;

  const isTitled = /^\d{2}-\d{4}-\d{5}$/.test(data.arp_no ?? "");
  const titleBonus = isTitled ? 35 : 0;

  // Percentages in ADDITIONAL_FLAT_RATE_CHOICES are negative for deductions, positive for additions.
  // Step-4 logic: effectiveRate = 100 + titleBonus - sum(abs(deductions)) + sum(additions)
  // Which is equivalent to: 100 + titleBonus + sum(signed percentages)
  const totalAdjustmentPct = selectedAdjustments.reduce(
    (sum, c) => sum + c.percentage, 0
  );
  const effectiveRate = 100 + titleBonus + totalAdjustmentPct;
  const adjustmentAmount = Math.round((baseMarketValue * (titleBonus + totalAdjustmentPct)) / 100 / 10) * 10;
  const marketValue = data.market_value
    ? parseFloat(String(data.market_value)) || 0
    : Math.round((baseMarketValue * effectiveRate) / 100 / 10) * 10;

  const assessmentLevelPct = data.assessment_level
    ? parseFloat(String(data.assessment_level).replace("%", "")) || 0
    : 0;

  const assessedValue = data.assessed_value
    ? parseFloat(String(data.assessed_value)) || 0
    : Math.round((marketValue * assessmentLevelPct) / 100 / 10) * 10;

  return (
    <div className="rpfaas-print" style={{ backgroundColor: "white" }} data-print-ready="true">
      {/* ── Form title ── */}
      <h1 className="text-lg font-bold text-center uppercase mb-1">
        Real Property Field Appraisal &amp; Assessment Sheet
      </h1>
      <h2 className="text-sm font-semibold text-center uppercase mb-3">
        Land &amp; Other Improvements
      </h2>

      {/* ── Section 1: Identification ── */}
      {/* 4-col: [label][value][label][value] */}
      <table>
        <colgroup>
          <col style={{ width: "15%" }} />
          <col style={{ width: "35%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <tbody>
          {/* Transaction Code — full row */}
          <tr className="text-right">
            <td colSpan={4}>
              Transaction Code:{" "}
              <span className="font-bold">{fmt(data.transaction_code)}</span>
            </td>
          </tr>

          {/* ARP No. label | ARP value | PIN label | PIN value */}
          <tr>
            <td>ARP No.:</td>
            <td className="font-bold font-mono">{fmt(data.arp_no)}</td>
            <td>PIN:</td>
            <td className="font-bold">{fmt(data.pin)}</td>
          </tr>

          <tr>
            <td>OCT/TCT/CLOA No.:</td>            
            <td className="font-bold">{fmt(data.oct_tct_cloa_no)}</td>
            <td>Survey No.:</td>
            <td className="font-bold">{fmt(data.survey_no)}</td>

          </tr>

          {/* Owner | value | Lot No. label | Lot No. value */}
          <tr data-field="owner_name">
            <td>Owner:</td>
            <td className="font-bold uppercase">{fmt(data.owner_name)}</td>
            <td>Lot No.:</td>
            <td className="font-bold">{fmt(data.lot_no)}</td>
          </tr>

          {/* Address | value | Survey No. label | Survey value */}
          <tr data-field="owner_address">
            <td>Address:</td>
            <td>{fmt(data.owner_address)}</td>
            <td>BLK:</td>
            <td className="font-bold">{fmt(data.blk)}</td>
          </tr>

          {/* Admin/Care of | value | Lot No. | BLK */}
          <tr data-field="admin_care_of">
            <td>Admin/Care of:</td>
            <td className="capitalize"  colSpan={3}>{fmt(data.admin_care_of)}</td>
          </tr>

          {/* Admin address — spans remaining cols */}
          <tr>
            <td>Address:</td>
            <td>{fmt(data.admin_address)}</td>
            <td>Tel No.</td>
            <td>090202</td>
          </tr>

          {/* Location */}
          <SectionHeader colSpan={4}>PROPERTY LOCATION</SectionHeader>
          <tr>
            <td>No/Street/Sitio:</td>
            <td className="font-bold">{fmt(data.property_address)}</td>
            <td data-field="location_barangay">Barangay:</td>
            <td className="font-bold">{fmt(data.location_barangay)}</td>
          </tr>
          <tr>
            <td data-field="location_municipality">Municipality:</td>
            <td className="font-bold">{fmt(data.location_municipality)}</td>
            <td>Province:</td>
            <td className="font-bold">
              {fmt(data.location_province) === ""
                ? "Mountain Province"
                : fmt(data.location_province)}
            </td>

          </tr>

          {/* Boundaries — all 4 directions in one row */}
          <SectionHeader colSpan={4}>PROPERTY BOUNDARIES</SectionHeader>
          <tr data-field="north_property" style={{ height: "2rem" }}>
            <td>North:</td>
            <td colSpan={3}>{fmt(data.north_property)}</td>
          </tr>
          <tr data-field="south_property" style={{ height: "2rem" }}>
            <td>South:</td>
            <td colSpan={3}>{fmt(data.south_property)}</td>
          </tr>
          <tr data-field="east_property" style={{ height: "2rem" }}>
            <td>East:</td>
            <td colSpan={3}>{fmt(data.east_property)}</td>
          </tr>
          <tr data-field="west_property" style={{ height: "2rem" }}>
            <td>West:</td>
            <td colSpan={3}>{fmt(data.west_property)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Section 2: Land Appraisal ── */}
      <table>
        <tbody>
          <SectionHeader colSpan={6}>LAND APPRAISAL</SectionHeader>
          <tr className="bg-gray-100 text-xs text-center">
            <td className="font-semibold">Classification</td>
            <td className="font-semibold">Sub-Classification</td>
            <td className="font-semibold">Area</td>
            <td className="font-semibold">Unit Value</td>
            <td className="font-semibold">Base Market Value</td>
          </tr>
          <tr className="text-center">
            <td data-field="classification" className="font-bold capitalize">
              {cap(data.classification)}
            </td>
            <td data-field="sub_classification" className="font-bold">
              {fmt(data.sub_classification)}
            </td>
            <td data-field="land_area" className="font-bold">
              {fmt(data.land_area)}
            </td>
            <td data-field="unit_value" className="font-bold">
              {fmt(data.unit_value)}
            </td>
            <td data-field="base_market_value" className="font-bold">
              {fmtMoney(data.base_market_value)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Section 3: Adjustment Factors ── */}
      <table>
        <tbody>
          <SectionHeader colSpan={3}>
            ADJUSTMENT FACTORS
          </SectionHeader>
          <tr className="bg-gray-100 text-xs">
            <td className="font-semibold">Factor</td>
            <td className="font-semibold text-center">Adjustment (%)</td>
            <td className="font-semibold text-center">Value Adjustment</td>
          </tr>
          {isTitled || selectedAdjustments.length > 0 ? (
            <>
              {/* Titled land bonus row — appears first and owns the rowSpan cell */}
              {isTitled && (
                <tr>
                  <td>Titled Land</td>
                  <td className="text-center">+35%</td>
                  <td
                    className="text-center font-bold"
                    rowSpan={(isTitled ? 1 : 0) + selectedAdjustments.length + 1}
                  >
                    {adjustmentAmount.toLocaleString("en-PH")}
                  </td>
                </tr>
              )}
              {selectedAdjustments.map((c, i) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="text-center">
                    {c.percentage > 0 ? `+${c.percentage}` : c.percentage}%
                  </td>
                  {/* If not titled, first adjustment row owns the rowSpan cell */}
                  {!isTitled && i === 0 && (
                    <td
                      className="text-center font-bold"
                      rowSpan={selectedAdjustments.length + 1}
                    >
                      {adjustmentAmount.toLocaleString("en-PH")}
                    </td>
                  )}
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="font-bold">TOTAL ADJUSTMENT</td>
                <td className="text-center font-bold">{effectiveRate}%</td>
              </tr>
            </>
          ) : (
            <tr>
              <td colSpan={3} className="text-muted-foreground italic">
                No adjustment factors applied.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Section 4: Property Assessment ── */}
      <table>
        <tbody>
          <SectionHeader colSpan={4}>PROPERTY ASSESSMENT</SectionHeader>
          <tr className="bg-gray-100 text-xs text-center">
            <td className="font-semibold">Actual Use</td>
            <td className="font-semibold">Market Value</td>
            <td className="font-semibold">Assessment Level</td>
            <td className="font-semibold">Assessed Value</td>
          </tr>
          <tr data-field="actual_use market_value assessment_level assessed_value" className="text-center">
            <td className="font-bold capitalize">{cap(data.actual_use)}</td>
            <td className="font-bold">{fmtMoney(marketValue)}</td>
            <td className="font-bold">
              {data.assessment_level
                ? String(data.assessment_level).includes("%")
                  ? String(data.assessment_level)
                  : `${data.assessment_level}%`
                : ""}
            </td>
            <td className="font-bold">{fmtMoney(assessedValue)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Footer ── */}
      <FaasFooter
        amountInWords={data.amount_in_words ?? ""}
        taxStatus={data.tax_status}
        locationMunicipality={data.location_municipality}
        effectivityOfAssessment={data.effectivity_of_assessment ?? ""}
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
};

export default LandImprovementForm;
