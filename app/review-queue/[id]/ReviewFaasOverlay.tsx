"use client";

import { useEffect, useRef } from "react";
import BuildingStructureForm from "@/app/components/forms/RPFAAS/building_structure_form";

interface Comment {
  id: string;
  field_name?: string | null;
}

interface Props {
  serverData: Record<string, any>;
  comments: Comment[];
  onCommentSection: (fields: string[]) => void;
}

const FIELD_LABELS: Record<string, string> = {
  arp_no: "ARP No.", oct_tct_cloa_no: "OCT/TCT/CLOA No.", survey_no: "Survey No.",
  pin: "PIN", lot_no: "Lot No.", transaction_code: "Transaction Code",
  owner_name: "Owner Name", admin_care_of: "Admin/Care Of", owner_address: "Owner Address",
  location_province: "Province", location_municipality: "Municipality",
  location_barangay: "Barangay",
  type_of_building: "Type of Building", structure_type: "Structural Type",
  building_permit_no: "Building Permit No.", cct: "CCT",
  completion_issued_on: "Completion Date", date_constructed: "Date Constructed",
  date_occupied: "Date Occupied", building_age: "Building Age",
  number_of_storeys: "No. of Storeys", total_floor_area: "Total Floor Area",
  unit_cost: "Unit Cost", land_owner: "Land Owner", td_arp_no: "Land TD/ARP No.",
  land_area: "Land Area", roofing_material: "Roofing Material",
  flooring_material: "Flooring Material", wall_material: "Wall Material",
  selected_deductions: "Deductions", market_value: "Market Value",
  actual_use: "Actual Use", assessment_level: "Assessment Level",
  assessed_value: "Assessed Value", amount_in_words: "Amount in Words",
  effectivity_of_assessment: "Effectivity", appraised_by: "Appraised By",
  memoranda: "Memoranda",
};

const KNOWN_FIELDS = new Set(Object.keys(FIELD_LABELS));

function parseFields(attr: string): string[] {
  return attr.split(/[\s,]+/).map(s => s.trim()).filter(f => KNOWN_FIELDS.has(f));
}

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

export default function ReviewFaasOverlay({ serverData, comments, onCommentSection }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Inject comment icons into value cells after each render
  useEffect(() => {
    const container = wrapperRef.current;
    if (!container) return;

    // Build set of commented fields for highlight
    const commentedFields = new Set(
      comments.flatMap(c =>
        c.field_name?.split(",").map(s => s.trim()).filter(Boolean) ?? []
      )
    );

    // Remove previously injected buttons
    container.querySelectorAll("[data-comment-injected]").forEach(el => el.remove());
    // Remove previously added relative positioning marker
    container.querySelectorAll("[data-comment-cell]").forEach(el => {
      (el as HTMLElement).style.position = "";
      el.removeAttribute("data-comment-cell");
    });

    container.querySelectorAll<HTMLElement>("[data-field]").forEach(row => {
      const rowFields = parseFields(row.getAttribute("data-field") ?? "");
      if (!rowFields.length) return;

      // Highlight rows that have existing comments
      const hasComment = rowFields.some(f => commentedFields.has(f));
      row.classList.toggle("faas-field-highlight", hasComment);

      // Inject icon into value cells only (odd-indexed direct children)
      const cells = Array.from(row.children) as HTMLElement[];
      cells.forEach((cell, idx) => {
        // Value cells: odd index (1, 3, 5…), or all cells for single-field rows
        const isValueCell = rowFields.length === 1 ? idx === 1 : idx % 2 === 1;
        if (!isValueCell) return;

        const fieldIdx = Math.floor(idx / 2);
        const field = rowFields[fieldIdx] ?? rowFields[0];
        if (!field) return;

        // Make cell a positioned container for the icon
        cell.style.position = "relative";
        cell.setAttribute("data-comment-cell", "");

        // Build the icon button
        const btn = document.createElement("button");
        btn.setAttribute("data-comment-injected", "");
        btn.setAttribute("type", "button");
        btn.setAttribute("title", `Comment on ${FIELD_LABELS[field] ?? field}`);
        btn.innerHTML = ICON_SVG;
        btn.style.cssText = `
          position: absolute;
          top: 50%;
          right: 4px;
          transform: translateY(-50%);
          opacity: 0;
          transition: opacity 0.15s;
          z-index: 10;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          line-height: 1;
        `;

        // Show on cell hover, hide on leave (unless moving to btn)
        const show = () => { btn.style.opacity = "1"; };
        const hide = (e: MouseEvent) => {
          if (!btn.contains(e.relatedTarget as Node)) btn.style.opacity = "0";
        };
        const hidFromBtn = (e: MouseEvent) => {
          if (!cell.contains(e.relatedTarget as Node)) btn.style.opacity = "0";
        };

        cell.addEventListener("mouseenter", show);
        cell.addEventListener("mouseleave", hide);
        btn.addEventListener("mouseleave", hidFromBtn);

        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          onCommentSection([field]);
        });

        cell.appendChild(btn);
      });
    });
  });

  return (
    <>
      <style>{`
        .faas-review-overlay [data-comment-cell]:hover {
          background-color: rgba(59, 130, 246, 0.06) !important;
        }
      `}</style>

      <div
        ref={wrapperRef}
        className="faas-review-overlay relative overflow-auto h-full bg-white"
        style={{ padding: "12px 16px" }}
      >
        <BuildingStructureForm serverData={serverData} />
      </div>
    </>
  );
}
