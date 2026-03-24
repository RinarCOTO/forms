"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import "@/app/styles/forms-fill.css";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Printer } from "lucide-react";
import BuildingStructureForm from "@/app/components/forms/RPFAAS/building_structure_form";

function BuildingTaxDecPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [formDataReady, setFormDataReady] = useState(false);

  useEffect(() => {
    if (!id) { setFormDataReady(true); return; }

    fetch(`/api/faas/building-structures/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((result) => {
        if (!result.success || !result.data) return;
        const d = result.data;

        const set = (key: string, val: string | null | undefined) => {
          if (val == null || val === "") return;
          localStorage.setItem(key, val);
        };

        // Step 1: owner / location
        set("rpfaas_owner_name",                       d.owner_name);
        set("rpfaas_admin_careof",                     d.admin_care_of);
        set("rpfaas_location_street",                  d.property_address);
        set("rpfaas_owner_address_province_code",      d.owner_province_code);
        set("rpfaas_owner_address_municipality_code",  d.owner_municipality_code);
        set("rpfaas_owner_address_barangay_code",      d.owner_barangay_code);
        set("rpfaas_owner_address",                    d.owner_address);
        set("rpfaas_admin_province_code",              d.admin_province_code);
        set("rpfaas_admin_municipality_code",          d.admin_municipality_code);
        set("rpfaas_admin_barangay_code",              d.admin_barangay_code);
        set("rpfaas_admin_address",                    d.admin_address);
        set("rpfaas_location_province_code",           d.property_province_code);
        set("rpfaas_location_municipality_code",       d.property_municipality_code);
        set("rpfaas_location_municipality",            d.location_municipality);
        set("rpfaas_location_barangay_code",           d.property_barangay_code);
        set("rpfaas_location_barangay",                d.location_barangay);
        set("rpfaas_location_province",                d.location_province);

        // Step 1: ARP / PIN / transaction code / title
        set("arp_no_p1",          d.arp_no);
        set("pin_p1",             d.pin);
        set("transaction_code_p1",d.transaction_code);
        set("rpfaas_title_type",  d.oct_tct_cloa_no ? d.oct_tct_cloa_no.split(" ")[0] : "");
        set("rpfaas_title_no",    d.oct_tct_cloa_no ? d.oct_tct_cloa_no.split(" ").slice(1).join(" ") : "");

        // Step 2
        localStorage.setItem("p2", JSON.stringify({
          type_of_building:    d.type_of_building    || "",
          structure_type:      d.structure_type      || "",
          building_permit_no:  d.building_permit_no  || "",
          cct:                 d.cct                 || "",
          completion_issued_on:d.completion_issued_on|| "",
          date_constructed:    d.date_constructed    || "",
          date_occupied:       d.date_occupied       || "",
          building_age:        d.building_age        || "",
          number_of_storeys:   d.number_of_storeys   || "",
          floor_areas:         d.floor_areas         || [],
          total_floor_area:    d.total_floor_area    || "",
          land_owner:          d.land_owner          || "",
          td_arp_no:           d.td_arp_no           || "",
          land_area:           d.land_area           || "",
        }));
        if (d.unit_cost != null) set("unit_cost_p2", String(d.unit_cost));

        // Step 3
        const rm = d.roofing_material  || {};
        const fm = d.flooring_material || {};
        const wm = d.wall_material     || {};
        localStorage.setItem("p3", JSON.stringify({
          roof_materials:           rm.data    || {},
          roof_materials_other_text:rm.otherText|| "",
          flooring_grid:            fm.grid    || [],
          walls_grid:               wm.grid    || [],
        }));

        // Step 4
        localStorage.setItem("p4", JSON.stringify({
          selected_deductions:         d.selected_deductions         || [],
          deduction_amounts:           d.deduction_amounts           || {},
          overall_comments:            d.overall_comments            || "",
          additional_percentage_choice:d.additional_percentage_choice|| "",
          additional_percentage_areas: d.additional_percentage_areas || [],
          additional_flat_rate_choice: d.additional_flat_rate_choice || "",
          additional_flat_rate_areas:  d.additional_flat_rate_areas  || [],
          market_value:                d.market_value,
        }));
        if (d.market_value != null) set("market_value_p4", String(d.market_value));

        // Step 5/6
        set("amount_in_words_p5",          d.amount_in_words);
        set("assessment_level_p5",         d.assessment_level != null ? String(d.assessment_level) : undefined);
        if (d.assessed_value != null) set("assessed_value_p5", String(d.assessed_value));
        set("actual_use_p5",               d.actual_use);
        if (d.effectivity_of_assessment != null) set("effectivity_of_assessment_p5", String(d.effectivity_of_assessment));
        if (d.appraised_by) set("appraised_by_p5", d.appraised_by);
        if (d.tax_status) set("tax_status_p5", d.tax_status);
      })
      .catch(() => {})
      .finally(() => setFormDataReady(true));
  }, [id]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 print:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/tax-declaration">Tax Declarations</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Building &amp; Structures</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto print:p-0">
          <div className="rpfaas-fill max-w-5xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6 print:hidden">
              <div>
                <h1 className="rpfaas-fill-title">Tax Declaration — Building &amp; Structures</h1>
                <p className="text-sm text-muted-foreground">Print or review the approved tax declaration.</p>
              </div>
              <Button onClick={() => window.print()} variant="outline" className="hidden sm:flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </header>

            <div className="bg-white shadow-sm border p-6" id="print-area">
              {formDataReady ? (
                <BuildingStructureForm />
              ) : (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function BuildingTaxDecPageWrapper() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <BuildingTaxDecPage />
    </Suspense>
  );
}
