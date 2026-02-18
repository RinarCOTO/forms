"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react"; // Added useMemo
import "@/app/styles/forms-fill.css";
import { Button } from "@/components/ui/button";
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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { DeductionsTable } from "./deductionsTable";
import { AdditionalTable } from "./additionalTable";
import TotalDeductionTable from "./totalDeductionTable";

import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import {
  FORM_CONSTANTS,
  DEDUCTION_CHOICES,
  ADDITIONAL_PERCENT_CHOICES,
  ADDITIONAL_FLAT_RATE_CHOICES,
} from "@/config/form-options";
import { useFormData } from "@/hooks/useFormData";

const FormSchema = z.object({
  deductions: z.array(z.string()).min(1, {
    message: "Please select at least one deduction.",
  }),
});

const BuildingStructureFormFillPage4 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  const [isSaving, setIsSaving] = useState(false);
  
  // State for Standard Deductions
  const [selections, setSelections] = useState<(string | number | null)[]>(() => [null]);

  // State for Additional Percent (Additions)
  const [additionalPercentSelections, setAdditionalPercentSelections] = useState<(string | number | null)[]>(() => [null]);
  const [additionalPercentAreas, setAdditionalPercentAreas] = useState<number[]>([0]);

  // State for Additional Flat Rate (Additions)
  const [additionalFlatRateSelections, setAdditionalFlatRateSelections] = useState<(string | number | null)[]>(() => [null]);
  const [additionalFlatRateAreas, setAdditionalFlatRateAreas] = useState<number[]>([0]);

  const [comments, setComments] = useState<string>("");
  const [unitCost, setUnitCost] = useState<number>(0);
  const [totalFloorArea, setTotalFloorArea] = useState<number>(0);

  const { data: loadedData } = useFormData<any>("building-structure", draftId || "");

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { deductions: [] },
  });

  // ---------------------------------------------------------
  // 1. DATA LOADING EFFECT
  // ---------------------------------------------------------
  useEffect(() => {
    // Load Unit Cost
    const savedCost = localStorage.getItem("unit_cost_p2");
    const dbCost = loadedData?.cost_of_construction;
    if (savedCost) setUnitCost(parseFloat(savedCost));
    else if (dbCost) setUnitCost(parseFloat(dbCost));

    // Load Total Floor Area
    const savedFloorArea = localStorage.getItem("total_floor_area_p2");
    const dbFloorArea = loadedData?.total_floor_area;
    if (savedFloorArea) setTotalFloorArea(parseFloat(savedFloorArea));
    else if (dbFloorArea) setTotalFloorArea(parseFloat(dbFloorArea));

    // Load Comments
    if (loadedData?.overall_comments) setComments(loadedData.overall_comments);

    // Load Selections
    const dbDeductions = loadedData?.selected_deductions || loadedData?.deductions;
    let savedDeductions: string[] = [];
    if (dbDeductions) {
      if (Array.isArray(dbDeductions)) savedDeductions = dbDeductions;
      else if (typeof dbDeductions === "string") savedDeductions = dbDeductions.split(",");
    }

    if (savedDeductions.length > 0) {
      const recoveredSelections = savedDeductions
        .map((d: string) => {
          const match = DEDUCTION_CHOICES.find((c) => c.id === d || c.name === d);
          return match ? match.id : null;
        })
        .filter(Boolean);
      setSelections(recoveredSelections);
      
      // Update react-hook-form validation
      const validNames = recoveredSelections
        .map((id: string) => DEDUCTION_CHOICES.find((c) => String(c.id) === String(id))?.name)
        .filter(Boolean);
      form.setValue("deductions", validNames as string[]);
    }
    
    // Note: You may need similar loading logic here for additionalPercentSelections/Areas
    // if you are saving them to the DB and want to reload them on edit.
    
  }, [loadedData, form]);

  const handleSelectionChange = (newValues: (string | number | null)[]) => {
    setSelections([...newValues]);
    const validNames = newValues
      .map((val) => DEDUCTION_CHOICES.find((c) => String(c.id) === String(val))?.name)
      .filter((v): v is string => !!v);
    form.setValue("deductions", validNames);
  };

  // ---------------------------------------------------------
  // 2. CENTRALIZED CALCULATION LOGIC (useMemo)
  // This updates live whenever any input changes.
  // ---------------------------------------------------------
  const financialSummary = useMemo(() => {
    const baseCost = unitCost * totalFloorArea;

    // A. Calculate Standard Deductions (SUBTRACTION)
    const standardDeductionTotal = selections.reduce((acc, curr) => {
      if (!curr) return acc;
      const opt = DEDUCTION_CHOICES.find((c) => String(c.id) === String(curr));
      if (!opt) return acc;
      
      let amount = 0;
      if (opt.percentage) {
        amount = (baseCost * opt.percentage) / 100;
      } else if (opt.pricePerSqm) {
        amount = opt.pricePerSqm * totalFloorArea;
      }
      return acc + amount;
    }, 0);

    // B. Calculate Additional Percent (ADDITION)
    let additionalPercentTotal = 0;
    additionalPercentSelections.forEach((id, idx) => {
       if(!id) return;
       const opt = ADDITIONAL_PERCENT_CHOICES.find(o => String(o.id) === String(id));
       const area = additionalPercentAreas[idx] || 0;
       if(opt && opt.percentage) {
          // Formula: (Unit Cost * % / 100) * Area
          additionalPercentTotal += ((unitCost * opt.percentage) / 100) * area;
       }
    });

    // C. Calculate Additional Flat Rate (ADDITION)
    let additionalFlatTotal = 0;
    additionalFlatRateSelections.forEach((id, idx) => {
       if(!id) return;
       const opt = ADDITIONAL_FLAT_RATE_CHOICES.find(o => String(o.id) === String(id));
       const area = additionalFlatRateAreas[idx] || 0;
       if(opt && opt.pricePerSqm) {
          // Formula: Price/sqm * Area
          additionalFlatTotal += opt.pricePerSqm * area;
       }
    });

    // D. Final Net Calculation
    const totalAdditions = additionalPercentTotal + additionalFlatTotal;
    // Market Value = Base - Deductions + Additions
    const netMarketValue = baseCost - standardDeductionTotal + totalAdditions;

    return {
      standardDeductionTotal,
      totalAdditions,
      netMarketValue
    };
  }, [
    unitCost, 
    totalFloorArea, 
    selections, 
    additionalPercentSelections, 
    additionalPercentAreas, 
    additionalFlatRateSelections, 
    additionalFlatRateAreas
  ]);

  // ---------------------------------------------------------
  // 3. HANDLE NEXT (USING PRE-CALCULATED DATA)
  // ---------------------------------------------------------
  const handleNext = async (data: any) => {
    setIsSaving(true);
    try {
      // Fetch the calculated values directly from our hook
      const { standardDeductionTotal, totalAdditions, netMarketValue } = financialSummary;

      const formData = {
        status: "draft",
        selected_deductions: selections.filter(Boolean),
        overall_comments: comments,
        
        // Saving the financial summary directly
        total_deduction_amount: standardDeductionTotal,
        total_addition_amount: totalAdditions,
        net_unit_construction_cost: netMarketValue,
      };

      const currentDraftId = draftId || localStorage.getItem("draft_id");
      const method = currentDraftId ? "PUT" : "POST";
      const url = currentDraftId
        ? `${FORM_CONSTANTS.API_ENDPOINTS.BUILDING_STRUCTURE}/${currentDraftId}`
        : FORM_CONSTANTS.API_ENDPOINTS.BUILDING_STRUCTURE;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) {
          localStorage.setItem("draft_id", result.data.id.toString());
          router.push(`/building-other-structure/fill/step-5?id=${result.data.id}`);
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Additional Structure Details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto bg-stone-200">
          <div className="max-w-4xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Fill-up Form: General Description</h1>
              <p className="text-sm text-muted-foreground">Manage structure deductions and deviations.</p>
            </header>

            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-8">
              
              <DeductionsTable
                unitCost={unitCost}
                totalFloorArea={totalFloorArea}
                selections={selections}
                onSelectionChange={handleSelectionChange}
                deductionChoices={DEDUCTION_CHOICES}
                comments={comments}
                onCommentsChange={setComments}
                error={form.formState.errors.deductions?.message as string}
              />

              <AdditionalTable
                label="Additional Percent Deviations (Additions)"
                unitCost={unitCost}
                values={additionalPercentSelections}
                onChange={setAdditionalPercentSelections}
                options={ADDITIONAL_PERCENT_CHOICES}
                areas={additionalPercentAreas}
                onAreasChange={setAdditionalPercentAreas}
              />

              <AdditionalTable
                label="Additional Flat Rate Deviations (Additions)"
                unitCost={unitCost}
                values={additionalFlatRateSelections}
                onChange={setAdditionalFlatRateSelections}
                options={ADDITIONAL_FLAT_RATE_CHOICES}
                areas={additionalFlatRateAreas}
                onAreasChange={setAdditionalFlatRateAreas}
              />

              <TotalDeductionTable
                label="Market Value Summary"
                unitCost={unitCost}
                totalFloorArea={totalFloorArea}
                
                // Standard
                deductionSelections={selections}
                deductionOptions={DEDUCTION_CHOICES}
                
                // Percent
                addPercentSelections={additionalPercentSelections}
                addPercentAreas={additionalPercentAreas}
                addPercentOptions={ADDITIONAL_PERCENT_CHOICES}

                // Flat
                addFlatSelections={additionalFlatRateSelections}
                addFlatAreas={additionalFlatRateAreas}
                addFlatOptions={ADDITIONAL_FLAT_RATE_CHOICES}
              />

              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/building-other-structure/fill/step-3${draftId ? `?id=${draftId}` : ""}`
                    )
                  }
                >
                  Previous
                </Button>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Next"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default BuildingStructureFormFillPage4;