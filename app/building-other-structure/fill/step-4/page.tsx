"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import { StepPagination } from "@/components/ui/step-pagination";
import { BUILDING_STEPS } from "@/app/building-other-structure/fill/constants";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import "@/app/styles/forms-fill.css";
import { Button } from "@/components/ui/button";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { SaveDraftButton } from "@/components/SaveDraftButton";
import { useSaveDraftShortcut } from "@/hooks/useSaveDraftShortcut";

import { DeductionsTable } from "./deductionsTable";
import { AdditionalTable } from "./additionalTable";
import TotalDeductionTableBase from "./totalDeductionTable";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TotalDeductionTable = TotalDeductionTableBase as any;

import { Loader2 } from "lucide-react";
import { useFormLock } from "@/hooks/useFormLock";
import { toast } from "sonner";
import { FormLockBanner } from "@/components/ui/form-lock-banner";
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
import { getBuildingDepreciationRate, type DepreciationResult } from "@/config/depreciation-table";
import { useFormData } from "@/hooks/useFormData";

const FormSchema = z.object({
  deductions: z.array(z.string()),
});

const BuildingStructureFormFillPage4 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");
  const { checking: lockChecking, locked, lockedBy } = useFormLock('building_structures', draftId);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isInitializedRef = useRef(false);

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

  // Physical depreciation
  const [buildingAge, setBuildingAge] = useState<number>(0);
  const [structuralType, setStructuralType] = useState<string>("");
  const [depreciationResult, setDepreciationResult] = useState<DepreciationResult | null>(null);


  const { data: loadedData } = useFormData<any>("faas/building-structures", draftId || "");

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
    const parsedSavedCost = savedCost ? parseFloat(savedCost) : NaN;
    if (!isNaN(parsedSavedCost) && parsedSavedCost > 0) setUnitCost(parsedSavedCost);
    else if (dbCost) setUnitCost(parseFloat(dbCost));

    // Load Total Floor Area
    const savedFloorArea = localStorage.getItem("total_floor_area_p2");
    const dbFloorArea = loadedData?.total_floor_area;
    const parsedSavedFloorArea = savedFloorArea ? parseFloat(savedFloorArea) : NaN;
    if (!isNaN(parsedSavedFloorArea) && parsedSavedFloorArea > 0) {
      setTotalFloorArea(parsedSavedFloorArea);
    } else if (dbFloorArea && parseFloat(String(dbFloorArea)) > 0) {
      setTotalFloorArea(parseFloat(String(dbFloorArea)));
    } else if (loadedData?.floor_areas) {
      const areas = Array.isArray(loadedData.floor_areas)
        ? loadedData.floor_areas
        : (typeof loadedData.floor_areas === 'string' ? JSON.parse(loadedData.floor_areas) : []);
      const computed = areas.reduce((sum: number, a: any) => sum + (parseFloat(a) || 0), 0);
      if (computed > 0) setTotalFloorArea(computed);
    }

    // Load Comments
    if (loadedData?.overall_comments) setComments(loadedData.overall_comments);

    // Load building info for depreciation
    const age = parseFloat(loadedData?.building_age) || 0;
    const sType = loadedData?.structure_type || "";
    if (age) setBuildingAge(age);
    if (sType) setStructuralType(sType);

    // Auto-compute depreciation from band schedule using building age from step 2
    // Buildings 0–1 years old are considered new — no depreciation applied
    if (age > 1 && sType) {
      const result = getBuildingDepreciationRate(age, sType);
      if (result !== null) setDepreciationResult(result);
    } else {
      setDepreciationResult(null);
    }


    // Load Selections
    const dbDeductions = loadedData?.selected_deductions || loadedData?.deductions;
    let savedDeductions: string[] = [];
    if (dbDeductions) {
      if (Array.isArray(dbDeductions)) savedDeductions = dbDeductions;
      else if (typeof dbDeductions === "string") savedDeductions = dbDeductions.split(",");
    }

    // Load Additional Percent
   if (loadedData?.additional_percentage_choice) {
  const ids = loadedData.additional_percentage_choice.split(",").filter(Boolean);
  setAdditionalPercentSelections(ids);
}
if (loadedData?.additional_percentage_areas?.length > 0) {
  setAdditionalPercentAreas(loadedData.additional_percentage_areas.map(Number));  // ✅ ADD
}

if (loadedData?.additional_flat_rate_choice) {
  const ids = loadedData.additional_flat_rate_choice.split(",").filter(Boolean);
  setAdditionalFlatRateSelections(ids);
}
if (loadedData?.additional_flat_rate_areas?.length > 0) {
  setAdditionalFlatRateAreas(loadedData.additional_flat_rate_areas.map(Number));  // ✅ ADD
}

    // Sync DB data to localStorage so the RPFAAS preview form can read it
    if (loadedData) {
      if (dbCost && !savedCost) {
        localStorage.setItem("unit_cost_p2", String(dbCost));
      }
      const existingP4 = localStorage.getItem("p4");
      const existingP4Data = existingP4 ? JSON.parse(existingP4) : {};
      localStorage.setItem("p4", JSON.stringify({
        ...existingP4Data,
        selected_deductions: loadedData.selected_deductions || loadedData.deductions || existingP4Data.selected_deductions || [],
        deduction_amounts: loadedData.deduction_amounts || existingP4Data.deduction_amounts || {},
        overall_comments: loadedData.overall_comments || existingP4Data.overall_comments || "",
        additional_percentage_choice: loadedData.additional_percentage_choice || existingP4Data.additional_percentage_choice || "",
        additional_percentage_areas: loadedData.additional_percentage_areas?.map(Number) || existingP4Data.additional_percentage_areas || [],
        additional_flat_rate_choice: loadedData.additional_flat_rate_choice || existingP4Data.additional_flat_rate_choice || "",
        additional_flat_rate_areas: loadedData.additional_flat_rate_areas?.map(Number) || existingP4Data.additional_flat_rate_areas || [],
        market_value: loadedData.market_value || existingP4Data.market_value || 0,
      }));
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
        .map((id) => DEDUCTION_CHOICES.find((c) => String(c.id) === String(id))?.name)
        .filter(Boolean);
      form.setValue("deductions", validNames as string[], { shouldValidate: true });
    }
    
    // Note: You may need similar loading logic here for additionalPercentSelections/Areas
    // if you are saving them to the DB and want to reload them on edit.
    setTimeout(() => { isInitializedRef.current = true; }, 0);
  }, [loadedData, form]);

  // Track unsaved changes after initialization
  useEffect(() => {
    if (isInitializedRef.current) setIsDirty(true);
  }, [selections, comments, additionalPercentSelections, additionalPercentAreas, additionalFlatRateSelections, additionalFlatRateAreas]);

  const handleSelectionChange = useCallback((newValues: (string | number | null)[]) => {
    setSelections([...newValues]);
    const validNames = newValues
      .map((val) => DEDUCTION_CHOICES.find((c) => String(c.id) === String(val))?.name)
      .filter((v): v is string => !!v);
    form.setValue("deductions", validNames, { shouldValidate: true });
  }, [form]);

  // ---------------------------------------------------------
  // 2. CENTRALIZED CALCULATION LOGIC (useMemo)
  // This updates live whenever any input changes.
  // ---------------------------------------------------------
  const financialSummary = useMemo(() => {
    // Step 1: Main cost = unit cost × floor area (no depreciation yet)
    const mainCost = totalFloorArea > 0 ? unitCost * totalFloorArea : unitCost;

    // Step 2: Additions — use original unit cost (not depreciated)
    let additionalPercentTotal = 0;
    additionalPercentSelections.forEach((id, idx) => {
      if (!id) return;
      const opt = ADDITIONAL_PERCENT_CHOICES.find(o => String(o.id) === String(id));
      const area = additionalPercentAreas[idx] || 0;
      if (opt && opt.percentage) {
        additionalPercentTotal += ((unitCost * opt.percentage) / 100) * area;
      }
    });

    let additionalFlatTotal = 0;
    additionalFlatRateSelections.forEach((id, idx) => {
      if (!id) return;
      const opt = ADDITIONAL_FLAT_RATE_CHOICES.find(o => String(o.id) === String(id));
      const area = additionalFlatRateAreas[idx] || 0;
      if (opt && opt.pricePerSqm) {
        additionalFlatTotal += opt.pricePerSqm * area;
      }
    });

    // Step 3: Total Reproduction Cost = main + all additions (before deductions and depreciation)
    const totalReproductionCost = mainCost + additionalPercentTotal + additionalFlatTotal;

    // Step 4: Standard Deductions applied to totalReproductionCost
    const standardDeductionTotal = selections.reduce<number>((acc, curr) => {
      if (!curr) return acc;
      const opt = DEDUCTION_CHOICES.find((c) => String(c.id) === String(curr)) as any;
      if (!opt) return acc;
      let amount = 0;
      if (opt.percentage) {
        amount = (totalReproductionCost * opt.percentage) / 100;
      } else if (opt.pricePerSqm) {
        amount = opt.pricePerSqm * totalFloorArea;
      }
      return acc + amount;
    }, 0);

    // Step 5: Physical depreciation (band-based)
    const physicalPct = depreciationResult?.rate ?? 0;
    const depreciationAmount = totalReproductionCost * physicalPct / 100;

    // Step 6: Market Value
    const netMarketValue = totalReproductionCost - standardDeductionTotal - depreciationAmount;

    return {
      depreciationAmount,
      physicalPct,
      mainCost,
      totalReproductionCost,
      standardDeductionTotal,
      totalAdditions: additionalPercentTotal + additionalFlatTotal,
      netMarketValue,
      additionalPercentTotal,
      additionalFlatTotal,
    };
  }, [
    unitCost,
    totalFloorArea,
    selections,
    additionalPercentSelections,
    additionalPercentAreas,
    additionalFlatRateSelections,
    additionalFlatRateAreas,
    depreciationResult,
  ]);

  // ---------------------------------------------------------
  // 3. HANDLE NEXT (USING PRE-CALCULATED DATA)
  // ---------------------------------------------------------
  const handleNext = useCallback(async (data: any) => {
    setIsSaving(true);
    try {
      // Fetch the calculated values directly from our hook
      const { standardDeductionTotal, totalAdditions, netMarketValue } = financialSummary;

      // Save market value to localStorage for step 6
      if (netMarketValue !== undefined && netMarketValue !== null) {
        localStorage.setItem("market_value_p4", netMarketValue.toString());
      }

      // Build per-deduction amount map — applied on total reproduction cost
      const { totalReproductionCost: baseCostForAmounts } = financialSummary;
      const deductionAmounts: Record<string, number> = {};
      selections.filter((id): id is string => Boolean(id)).forEach((id) => {
        const opt = DEDUCTION_CHOICES.find((c) => String(c.id) === String(id)) as any;
        if (!opt) return;
        if (opt.percentage) deductionAmounts[id] = (baseCostForAmounts * opt.percentage) / 100;
        else if (opt.pricePerSqm) deductionAmounts[id] = opt.pricePerSqm * totalFloorArea;
      });

      // Save p4 data to localStorage for the RPFAAS form
      const p4LocalStorageData = {
        selected_deductions: selections.filter(Boolean),
        deduction_amounts: deductionAmounts,
        overall_comments: comments,
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(","),
        additional_percentage_areas: additionalPercentAreas,
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(","),
        additional_flat_rate_areas: additionalFlatRateAreas,
        market_value: financialSummary.netMarketValue
      };
      localStorage.setItem("p4", JSON.stringify(p4LocalStorageData));

      const formData: Record<string, unknown> = {
        selected_deductions: selections.filter(Boolean),
        deduction_amounts: deductionAmounts,
        overall_comments: comments,

        // Physical depreciation
        physical_depreciation_pct: depreciationResult?.rate ?? null,

        // Saving the financial summary directly
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(","),
        additional_percentage_value: financialSummary.totalAdditions,
        additional_percentage_areas: additionalPercentAreas,

        // Additional Flat Rate
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(","),
        additional_flat_rate_value: additionalFlatRateAreas.reduce((a, b) => a + b, 0),
        additional_flat_rate_areas: additionalFlatRateAreas,

        // Market Value
        market_value: financialSummary.netMarketValue,
      };

      const currentDraftId = draftId || localStorage.getItem("draft_id");
      const method = currentDraftId ? "PUT" : "POST";
      if (!currentDraftId) formData.status = 'draft';
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
          setIsDirty(false);
          localStorage.setItem("draft_id", result.data.id.toString());
          router.push(`/building-other-structure/fill/step-5?id=${result.data.id}`);
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  }, [financialSummary, selections, comments, additionalPercentSelections, additionalPercentAreas, additionalFlatRateSelections, additionalFlatRateAreas, draftId, router]);

  const handleSaveDraft = useCallback(async (data: any) => {
    setIsSavingDraft(true);
    try {
      const { netMarketValue } = financialSummary;
      if (netMarketValue !== undefined && netMarketValue !== null) {
        localStorage.setItem('market_value_p4', netMarketValue.toString());
      }
      const { totalReproductionCost: baseCostDraft } = financialSummary;
      const deductionAmountsDraft: Record<string, number> = {};
      selections.filter((id): id is string => Boolean(id)).forEach((id) => {
        const opt = DEDUCTION_CHOICES.find((c) => String(c.id) === String(id)) as any;
        if (!opt) return;
        if (opt.percentage) deductionAmountsDraft[id] = (baseCostDraft * opt.percentage) / 100;
        else if (opt.pricePerSqm) deductionAmountsDraft[id] = opt.pricePerSqm * totalFloorArea;
      });

      localStorage.setItem('p4', JSON.stringify({
        selected_deductions: selections.filter(Boolean),
        deduction_amounts: deductionAmountsDraft,
        overall_comments: comments,
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(','),
        additional_percentage_areas: additionalPercentAreas,
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(','),
        additional_flat_rate_areas: additionalFlatRateAreas,
        market_value: financialSummary.netMarketValue,
      }));
      const formData: Record<string, unknown> = {
        selected_deductions: selections.filter(Boolean),
        deduction_amounts: deductionAmountsDraft,
        overall_comments: comments,
        physical_depreciation_pct: depreciationResult?.rate ?? null,
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(','),
        additional_percentage_value: financialSummary.totalAdditions,
        additional_percentage_areas: additionalPercentAreas,
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(','),
        additional_flat_rate_value: additionalFlatRateAreas.reduce((a: number, b: number) => a + b, 0),
        additional_flat_rate_areas: additionalFlatRateAreas,
        market_value: financialSummary.netMarketValue,
      };
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      const method = currentDraftId ? 'PUT' : 'POST';
      if (!currentDraftId) formData.status = 'draft';
      const url = currentDraftId
        ? `${FORM_CONSTANTS.API_ENDPOINTS.BUILDING_STRUCTURE}/${currentDraftId}`
        : FORM_CONSTANTS.API_ENDPOINTS.BUILDING_STRUCTURE;
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) localStorage.setItem('draft_id', result.data.id.toString());
        setIsDirty(false);
        toast.success('Draft saved successfully.');
      } else {
        toast.error('Failed to save draft.');
      }
    } catch {
      toast.error('Error saving draft.');
    } finally {
      setIsSavingDraft(false);
    }
  }, [financialSummary, selections, comments, additionalPercentSelections, additionalPercentAreas, additionalFlatRateSelections, additionalFlatRateAreas, draftId]);

  useSaveDraftShortcut(() => form.handleSubmit(handleSaveDraft)(), isSavingDraft || locked);

  return (
    <FormFillLayout
      breadcrumbParent={{ label: "Building Your Application", href: "#" }}
      pageTitle="Additional Structure Details"
      sidePanel={<ErrorBoundary><ReviewCommentsFloat draftId={draftId} stepFields={["selected_deductions","market_value","unit_cost"]} /></ErrorBoundary>}
    >
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Fill-up Form: General Description</h1>
                <p className="text-sm text-muted-foreground">Manage structure deductions and deviations.</p>
              </div>
              <SaveDraftButton
                onClick={() => form.handleSubmit(handleSaveDraft)()}
                isSaving={isSavingDraft}
                disabled={isSaving || locked || lockChecking}
              />
            </header>
            <FormLockBanner locked={locked} lockedBy={lockedBy} />
            <fieldset disabled={locked} className={`border-0 p-0 m-0 min-w-0 block${locked ? ' opacity-60' : ''}${lockChecking ? ' animate-pulse' : ''}`}>
            <form onSubmit={form.handleSubmit(handleNext)} className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">
              
              <div data-comment-field="selected_deductions">
                <DeductionsTable
                  unitCost={unitCost}
                  totalFloorArea={totalFloorArea}
                  depreciatedUnitCost={financialSummary.totalReproductionCost}
                  selections={selections}
                  onSelectionChange={handleSelectionChange}
                  deductionChoices={DEDUCTION_CHOICES}
                  comments={comments}
                  onCommentsChange={setComments}
                  error={form.formState.errors.deductions?.message as string}
                />
              </div>

              {/* ── Physical Depreciation ── */}
              <section className="bg-card rounded-lg border p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-base">Physical Depreciation</h3>

                {/* Info row */}
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-chart-2">
                      <tr>
                        <th className="border-b px-4 py-2 text-left font-medium text-chart-5">Years Used</th>
                        <th className="border-b px-4 py-2 text-left font-medium text-chart-5">Structural Type</th>
                        <th className="border-b px-4 py-2 text-center font-medium text-chart-5">Rate</th>
                        <th className="border-b px-4 py-2 text-center font-medium text-chart-5">Residual Floor</th>
                        <th className="border-b px-4 py-2 text-right font-medium text-chart-5">Depreciation Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {buildingAge <= 1 && buildingAge > 0
                            ? <span className="text-emerald-600 font-medium">New</span>
                            : buildingAge > 1
                              ? `${buildingAge} yr${buildingAge !== 1 ? "s" : ""}`
                              : "—"}
                        </td>
                        <td className="px-4 py-3">{structuralType || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          {buildingAge <= 1 && buildingAge > 0
                            ? <span className="text-emerald-600 font-medium">0% (New)</span>
                            : depreciationResult !== null
                              ? <span className={depreciationResult.capped ? "text-amber-600 font-medium" : ""}>
                                  {depreciationResult.rate.toFixed(2)}%
                                  {depreciationResult.capped && " (capped)"}
                                </span>
                              : "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {depreciationResult !== null ? `${depreciationResult.residual}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-destructive">
                          {financialSummary.depreciationAmount > 0
                            ? `- ₱${financialSummary.depreciationAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                            : "₱0.00"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </section>

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

              <div data-comment-field="market_value">
                <TotalDeductionTable
                  label="Market Value Summary"
                  unitCost={unitCost}
                  totalFloorArea={totalFloorArea}
                  depreciationAmount={financialSummary.depreciationAmount}
                  depreciatedUnitCost={financialSummary.totalReproductionCost}

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
              </div>

              <StepPagination
                currentStep={4}
                draftId={draftId}
                isDirty={isDirty}
                onNext={() => form.handleSubmit(handleNext)()}
                isNextLoading={isSaving}
                isNextDisabled={isSaving || isSavingDraft || locked || lockChecking}
                steps={BUILDING_STEPS}
              />
            </form>
            </fieldset>
    </FormFillLayout>
  );
};

export default function BuildingStructureFormFillPage4Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuildingStructureFormFillPage4 />
    </Suspense>
  );
}