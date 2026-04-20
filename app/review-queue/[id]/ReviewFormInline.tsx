"use client";

import "@/app/styles/forms-fill.css";
import { useRPFAASData } from "@/app/components/forms/RPFAAS/hooks/useRPFAASData";
import { STRUCTURAL_MATERIAL_ROWS } from "@/app/components/forms/RPFAAS/constants/structuralMaterials";
import {
  DEDUCTION_CHOICES,
  ADDITIONAL_PERCENT_CHOICES,
  ADDITIONAL_FLAT_RATE_CHOICES,
} from "@/config/form-options";
import { MessageSquare } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Comment {
  id: string;
  field_name?: string | null;
  comment_text: string;
  suggested_value?: string | null;
  author_name: string;
  created_at: string;
}

interface Props {
  serverData: Record<string, any>;
  comments: Comment[];
  onCommentSection: (fields: string[]) => void;
}

// ---------------------------------------------------------------------------
// Per-field comment button
// ---------------------------------------------------------------------------
function FieldCommentBtn({
  fieldKey,
  comments,
  onCommentSection,
}: {
  fieldKey: string;
  comments: Comment[];
  onCommentSection: (fields: string[]) => void;
}) {
  const count = comments.filter((c) =>
    c.field_name?.split(",").map((s) => s.trim()).includes(fieldKey)
  ).length;

  return (
    <button
      type="button"
      onClick={() => onCommentSection([fieldKey])}
      title="Add comment for this field"
      className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors shrink-0
        ${count > 0
          ? "text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
    >
      <MessageSquare className="h-3.5 w-3.5" />
      {count > 0 && <span className="font-semibold">{count}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Read-only field row: label + comment btn + value
// ---------------------------------------------------------------------------
function FieldRow({
  label,
  fieldKey,
  value,
  comments,
  onCommentSection,
  mono = false,
}: {
  label: string;
  fieldKey: string;
  value: React.ReactNode;
  comments: Comment[];
  onCommentSection: (fields: string[]) => void;
  mono?: boolean;
}) {
  const hasComments = comments.some((c) =>
    c.field_name?.split(",").map((s) => s.trim()).includes(fieldKey)
  );

  return (
    <div
      data-comment-field={fieldKey}
      className={`rpfaas-fill-field space-y-1 rounded-md px-2 py-1 -mx-2 transition-colors
        ${hasComments ? "bg-amber-50/60" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="rpfaas-fill-label text-sm">{label}</label>
        <FieldCommentBtn
          fieldKey={fieldKey}
          comments={comments}
          onCommentSection={onCommentSection}
        />
      </div>
      <div
        className={`w-full border border-border rounded-md px-3 py-1.5 text-sm bg-white min-h-9 flex items-center
          ${mono ? "font-mono" : ""}`}
      >
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rpfaas-fill-section shadow-sm p-5">
      <h2 className="rpfaas-fill-section-title text-sm uppercase tracking-wide text-muted-foreground mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ReviewFormInline({ serverData, comments, onCommentSection }: Props) {
  const {
    transactionCode, arpNo, octTctCloaNo, pin, surveyNo, lotNo,
    ownerName, adminCareOfName,
    ownerAddressBarangay, ownerAddressMunicipality, ownerAddressProvince,
    adminBarangayName, adminMunicipalityName, adminProvinceName,
    locationStreet, locationMunicipality, locationBarangay, locationProvince,
    typeOfBuilding, structuralType, buildingPermitNo, cct,
    completionIssuedOn, dateConstructed, dateOccupied, buildingAge,
    numberOfStoreys, floorAreas, totalFloorArea,
    landOwner, landTdArpNo, landArea,
    roofMaterials, roofMaterialsOtherText,
    flooringGrid, wallsGrid,
    selectedDeductions, deductionAmounts, deductionComments,
    additionalPercentageChoice, additionalPercentageAreas,
    additionalFlatRateChoice, additionalFlatRateAreas,
    unitCost, baseCost, standardDeductionTotal,
    marketValue, actualUse, taxStatus, assessmentLevel, assessedValue,
    amountInWords, effectivityOfAssessment,
    appraisedById, municipalReviewerId, provincialReviewerId, memoranda,
  } = useRPFAASData(serverData);

  const storeys = parseInt(String(numberOfStoreys)) || 0;
  const fmt = (v: number) =>
    v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Shorthand props for FieldRow
  const fp = { comments, onCommentSection };

  // ── Roof materials ──────────────────────────────────────────────────────
  const roofMapping: Record<string, keyof typeof roofMaterials> = {
    "Reinforced Concrete": "reinforcedConcrete",
    "Longspan Roof": "longspanRoof",
    "Tiles": "tiles",
    "G.I. Sheets": "giSheets",
    "Aluminum": "aluminum",
    "Others (Specify)": "others",
  };
  const checkedRoof = STRUCTURAL_MATERIAL_ROWS
    .filter((r) => r.roof && roofMaterials[roofMapping[r.roof]])
    .map((r) => r.roof === "Others (Specify)" ? `Others: ${roofMaterialsOtherText}` : r.roof!)
    .join(", ");

  // ── Flooring & Walls — build readable per-floor strings ─────────────────
  function materialPerFloor(grid: boolean[][], rowLabels: (string | null)[]) {
    if (!grid.length) return "—";
    const result: string[] = [];
    for (let floor = 0; floor < storeys; floor++) {
      const checked = rowLabels.filter((_, rowIdx) => grid[rowIdx]?.[floor]).filter(Boolean);
      if (checked.length) result.push(`${floor + 1}F: ${checked.join(", ")}`);
    }
    return result.length ? result.join(" · ") : "—";
  }
  const flooringLabels = STRUCTURAL_MATERIAL_ROWS.map((r) => r.flooring);
  const wallLabels = STRUCTURAL_MATERIAL_ROWS.map((r) => r.walls);

  // ── Deductions ──────────────────────────────────────────────────────────
  const deductionsData = selectedDeductions.map((id) => {
    const d = DEDUCTION_CHOICES.find((x) => x.id === id);
    if (!d) return { id, name: id, percentage: 0, calculatedValue: 0 };
    const stored = deductionAmounts[id];
    return { ...d, calculatedValue: stored !== undefined ? stored : (baseCost * d.percentage) / 100 };
  });

  // ── Additional items ────────────────────────────────────────────────────
  const additionalPctData = (additionalPercentageChoice || "")
    .split(",").filter(Boolean)
    .map((itemId, i) => {
      const item = ADDITIONAL_PERCENT_CHOICES.find((c) => c.id === itemId);
      const area = additionalPercentageAreas[i] || 0;
      if (!item) return { id: itemId, name: itemId, percentage: 0, area, calculatedValue: 0 };
      return { ...item, area, calculatedValue: (unitCost * item.percentage / 100) * area };
    });

  const additionalFlatData = (additionalFlatRateChoice || "")
    .split(",").filter(Boolean)
    .map((itemId, i) => {
      const item = ADDITIONAL_FLAT_RATE_CHOICES.find((c) => c.id === itemId);
      const area = additionalFlatRateAreas[i] || 0;
      if (!item) return { id: itemId, name: itemId, pricePerSqm: 0, area, calculatedValue: 0 };
      return { ...item, area, calculatedValue: item.pricePerSqm * area };
    });

  const allAdditional = [...additionalPctData, ...additionalFlatData];

  return (
    <div className="rpfaas-fill max-w-3xl mx-auto py-6">

      {/* Title */}
      <div className="mb-2">
        <h1 className="text-lg font-semibold">RPFAAS — Building &amp; Other Structures</h1>
        <p className="text-sm text-muted-foreground">
          Review form. Click <MessageSquare className="inline h-3.5 w-3.5 mx-0.5 -mt-0.5" /> next to any field to add a comment.
        </p>
      </div>

      {/* ── Section 1: Property Identification ────────────────────────────── */}
      <Section title="Property Identification">
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Transaction Code" fieldKey="transaction_code" value={transactionCode} {...fp} />
          <FieldRow label="ARP No." fieldKey="arp_no" value={arpNo} mono {...fp} />
          <FieldRow label="OCT/TCT/CLOA No." fieldKey="oct_tct_cloa_no" value={octTctCloaNo} {...fp} />
          <FieldRow label="PIN" fieldKey="pin" value={pin} mono {...fp} />
          <FieldRow label="Survey No." fieldKey="survey_no" value={surveyNo} {...fp} />
          <FieldRow label="Lot No." fieldKey="lot_no" value={lotNo} {...fp} />
        </div>
      </Section>

      {/* ── Section 2: Owner & Administration ─────────────────────────────── */}
      <Section title="Owner & Administration">
        <FieldRow label="Owner Name" fieldKey="owner_name" value={ownerName?.toUpperCase()} {...fp} />
        <FieldRow
          label="Owner Address"
          fieldKey="owner_address"
          value={[ownerAddressBarangay, ownerAddressMunicipality, ownerAddressProvince].filter(Boolean).join(", ")}
          {...fp}
        />
        <FieldRow label="Administration / Care of" fieldKey="admin_care_of" value={adminCareOfName} {...fp} />
        <FieldRow
          label="Admin Address"
          fieldKey="admin_care_of"
          value={[adminBarangayName, adminMunicipalityName, adminProvinceName].filter(Boolean).join(", ")}
          {...fp}
        />
      </Section>

      {/* ── Section 3: Location of Property ───────────────────────────────── */}
      <Section title="Location of Property">
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Street / Sitio / No." fieldKey="location_municipality" value={locationStreet} {...fp} />
          <FieldRow label="Municipality" fieldKey="location_municipality" value={locationMunicipality} {...fp} />
          <FieldRow label="Barangay" fieldKey="location_barangay" value={locationBarangay} {...fp} />
          <FieldRow label="Province" fieldKey="location_province" value={locationProvince} {...fp} />
        </div>
      </Section>

      {/* ── Section 4: General Description ────────────────────────────────── */}
      <Section title="General Description">
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Type of Building" fieldKey="type_of_building" value={typeOfBuilding} {...fp} />
          <FieldRow label="Building Age" fieldKey="building_age" value={buildingAge ? `${buildingAge} years` : ""} {...fp} />
          <FieldRow label="Structural Type" fieldKey="structure_type" value={structuralType} {...fp} />
          <FieldRow label="No. of Storeys" fieldKey="number_of_storeys" value={numberOfStoreys} {...fp} />
          <FieldRow label="Building Permit No." fieldKey="building_permit_no" value={buildingPermitNo} {...fp} />
          <FieldRow label="CCT" fieldKey="cct" value={cct} {...fp} />
          <FieldRow label="Certificate of Completion" fieldKey="completion_issued_on" value={completionIssuedOn ? completionIssuedOn.slice(0, 4) : ""} {...fp} />
          <FieldRow label="Date Constructed" fieldKey="date_constructed" value={dateConstructed ? dateConstructed.slice(0, 4) : ""} {...fp} />
          <FieldRow label="Date Occupied" fieldKey="date_occupied" value={dateOccupied ? dateOccupied.slice(0, 4) : ""} {...fp} />
          <FieldRow label="Total Floor Area" fieldKey="total_floor_area" value={totalFloorArea ? `${totalFloorArea} sqm` : ""} {...fp} />
        </div>

        {/* Floor areas */}
        {storeys > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Floor Areas</p>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: storeys }, (_, i) => (
                <div key={i} className="border border-border rounded-md px-3 py-1.5 text-sm bg-white text-center">
                  <span className="text-xs text-muted-foreground block">Floor {i + 1}</span>
                  {floorAreas[i] || <span className="text-muted-foreground">—</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <FieldRow label="Unit Construction Cost" fieldKey="unit_cost" value={unitCost ? `₱${fmt(unitCost)}` : ""} {...fp} />
      </Section>

      {/* ── Section 5: Land Reference ──────────────────────────────────────── */}
      <Section title="Land Reference">
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Land Owner" fieldKey="land_owner" value={landOwner} {...fp} />
          <FieldRow label="TD / ARP No." fieldKey="td_arp_no" value={landTdArpNo} {...fp} />
          <FieldRow label="Land Area" fieldKey="land_area" value={landArea ? `${landArea} sqm` : ""} {...fp} />
        </div>
      </Section>

      {/* ── Section 6: Structural Materials ───────────────────────────────── */}
      <Section title="Structural Materials">
        <FieldRow
          label="Roof Material(s)"
          fieldKey="roofing_material"
          value={checkedRoof || "None selected"}
          {...fp}
        />
        <FieldRow
          label="Flooring Material(s) per Floor"
          fieldKey="flooring_material"
          value={materialPerFloor(flooringGrid, flooringLabels)}
          {...fp}
        />
        <FieldRow
          label="Wall Material(s) per Floor"
          fieldKey="wall_material"
          value={materialPerFloor(wallsGrid, wallLabels)}
          {...fp}
        />
      </Section>

      {/* ── Section 7: Deductions ──────────────────────────────────────────── */}
      <Section title="Deductions">
        {deductionsData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deductions selected.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-center px-3 py-2 font-medium">%</th>
                  <th className="text-right px-3 py-2 font-medium">Deduction Cost</th>
                </tr>
              </thead>
              <tbody>
                {deductionsData.map((d) => (
                  <tr key={d.id} className="border-t border-border">
                    <td className="px-3 py-2">{d.name}</td>
                    <td className="px-3 py-2 text-center">{d.percentage}%</td>
                    <td className="px-3 py-2 text-right">{fmt(d.calculatedValue)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border font-semibold bg-muted/30">
                  <td className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-center">
                    {deductionsData.reduce((s, d) => s + d.percentage, 0)}%
                  </td>
                  <td className="px-3 py-2 text-right">{fmt(standardDeductionTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {deductionComments && (
          <FieldRow label="Deduction Comments" fieldKey="selected_deductions" value={deductionComments} {...fp} />
        )}

        {/* Comment button for the whole deductions section */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onCommentSection(["selected_deductions", "market_value"])}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Comment on deductions
          </button>
        </div>
      </Section>

      {/* ── Section 8: Additional Items ────────────────────────────────────── */}
      {allAdditional.length > 0 && (
        <Section title="Additional Items">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-right px-3 py-2 font-medium">Area</th>
                  <th className="text-right px-3 py-2 font-medium">Rate</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {additionalPctData.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2 text-right">{item.area} sqm</td>
                    <td className="px-3 py-2 text-right">{item.percentage}%</td>
                    <td className="px-3 py-2 text-right">₱{fmt(item.calculatedValue)}</td>
                  </tr>
                ))}
                {additionalFlatData.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2 text-right">{item.area} sqm</td>
                    <td className="px-3 py-2 text-right">₱{fmt(item.pricePerSqm)}/sqm</td>
                    <td className="px-3 py-2 text-right">₱{fmt(item.calculatedValue)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border font-semibold bg-muted/30">
                  <td className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right">
                    {allAdditional.reduce((s, i) => s + i.area, 0)} sqm
                  </td>
                  <td></td>
                  <td className="px-3 py-2 text-right">
                    ₱{fmt(allAdditional.reduce((s, i) => s + i.calculatedValue, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── Section 9: Property Assessment ────────────────────────────────── */}
      <Section title="Property Assessment">
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Actual Use" fieldKey="actual_use" value={actualUse} {...fp} />
          <FieldRow
            label="Tax Status"
            fieldKey="actual_use"
            value={taxStatus === "exempt" ? "Exempt" : "Taxable"}
            {...fp}
          />
          <FieldRow label="Market Value" fieldKey="market_value" value={marketValue ? `₱${fmt(marketValue)}` : ""} {...fp} />
          <FieldRow label="Assessment Level" fieldKey="assessment_level" value={assessmentLevel} {...fp} />
          <FieldRow label="Assessed Value" fieldKey="assessed_value" value={assessedValue ? `₱${fmt(assessedValue)}` : ""} {...fp} />
          <FieldRow label="Effectivity of Assessment" fieldKey="effectivity_of_assessment" value={effectivityOfAssessment ? String(effectivityOfAssessment).slice(0, 4) : ""} {...fp} />
        </div>
        <FieldRow
          label="Amount in Words"
          fieldKey="amount_in_words"
          value={amountInWords ? `${amountInWords} Pesos Only` : ""}
          {...fp}
        />
      </Section>

      {/* ── Section 10: Signatories & Memoranda ────────────────────────────── */}
      <Section title="Memoranda">
        {/* <FieldRow label="Appraised By (ID)" fieldKey="appraised_by" value={appraisedById} {...fp} />
        <FieldRow label="Municipal Reviewer (ID)" fieldKey="municipal_reviewer_id" value={municipalReviewerId} {...fp} /> */}
        <FieldRow label="Memoranda" fieldKey="memoranda" value={memoranda} {...fp} />
      </Section>

    </div>
  );
}
