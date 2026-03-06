"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import { StepPagination, LAND_IMPROVEMENT_STEPS } from "@/components/ui/step-pagination";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
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

import { DeductionsTable, AdjustmentTable } from "./improvementsTable";
import TotalImprovements from "./improvementsTable";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFormData } from "@/hooks/useFormData";

// ─── Empty choice arrays — data to be added later ────────────────────────────
const DEDUCTION_CHOICES: any[] = [];
const ADDITIONAL_PERCENT_CHOICES: any[] = [];
const ADDITIONAL_FLAT_RATE_CHOICES: any[] = [];

const API_ENDPOINT = "/api/faas/land-improvements";

const FormSchema = z.object({
  deductions: z.array(z.string()),
});

const LandImprovementsFormFillPage4 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isInitializedRef = useRef(false);

  // Standard Deductions
  const [selections, setSelections] = useState<(string | number | null)[]>(() => [null]);
  const [quantities, setQuantities] = useState<number[]>([0]);

  // Additional Percent (Additions)
  const [additionalPercentSelections, setAdditionalPercentSelections] = useState<(string | number | null)[]>(() => [null]);
  const [additionalPercentAreas, setAdditionalPercentAreas] = useState<number[]>([0]);

  // Additional Flat Rate (Additions)
  const [additionalFlatRateSelections, setAdditionalFlatRateSelections] = useState<(string | number | null)[]>(() => [null]);
  const [additionalFlatRateAreas, setAdditionalFlatRateAreas] = useState<number[]>([0]);

  const [comments, setComments] = useState<string>("");
  const [unitCost, setUnitCost] = useState<number>(0);
  const [totalArea, setTotalArea] = useState<number>(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loadedData } = useFormData<any>("faas/land-improvements", draftId || "");

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { deductions: [] },
  });

  // ── Data Loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedCost = localStorage.getItem("land_unit_cost_p4");
    const dbCost = loadedData?.unit_cost;
    if (savedCost) setUnitCost(parseFloat(savedCost));
    else if (dbCost) setUnitCost(parseFloat(dbCost));

    const savedArea = localStorage.getItem("land_total_area_p4");
    const dbArea = loadedData?.total_area;
    if (savedArea) setTotalArea(parseFloat(savedArea));
    else if (dbArea) setTotalArea(parseFloat(dbArea));

    if (loadedData?.overall_comments) setComments(loadedData.overall_comments);

    const dbDeductions = loadedData?.selected_deductions || loadedData?.deductions;
    let savedDeductions: string[] = [];
    if (dbDeductions) {
      if (Array.isArray(dbDeductions)) savedDeductions = dbDeductions;
      else if (typeof dbDeductions === "string") savedDeductions = dbDeductions.split(",");
    }

    if (loadedData?.additional_percentage_choice) {
      const ids = loadedData.additional_percentage_choice.split(",").filter(Boolean);
      setAdditionalPercentSelections(ids);
    }
    if (loadedData?.additional_percentage_areas?.length > 0) {
      setAdditionalPercentAreas(loadedData.additional_percentage_areas.map(Number));
    }

    if (loadedData?.additional_flat_rate_choice) {
      const ids = loadedData.additional_flat_rate_choice.split(",").filter(Boolean);
      setAdditionalFlatRateSelections(ids);
    }
    if (loadedData?.additional_flat_rate_areas?.length > 0) {
      setAdditionalFlatRateAreas(loadedData.additional_flat_rate_areas.map(Number));
    }

    if (savedDeductions.length > 0) {
      const recoveredSelections = savedDeductions
        .map((d: string) => {
          const match = DEDUCTION_CHOICES.find((c: any) => c.id === d || c.name === d);
          return match ? match.id : null;
        })
        .filter(Boolean);
      setSelections(recoveredSelections);

      const validNames = recoveredSelections
        .map((id: any) => DEDUCTION_CHOICES.find((c: any) => String(c.id) === String(id))?.name)
        .filter(Boolean);
      form.setValue("deductions", validNames as string[], { shouldValidate: true });
    }

    setTimeout(() => { isInitializedRef.current = true; }, 150);
  }, [loadedData, form]);

  useEffect(() => {
    if (isInitializedRef.current) setIsDirty(true);
  }, [selections, comments, additionalPercentSelections, additionalPercentAreas, additionalFlatRateSelections, additionalFlatRateAreas]);

  const handleSelectionChange = useCallback((newValues: (string | number | null)[]) => {
    setSelections([...newValues]);
    const validNames = newValues
      .map((val) => DEDUCTION_CHOICES.find((c: any) => String(c.id) === String(val))?.name)
      .filter((v): v is string => !!v);
    form.setValue("deductions", validNames, { shouldValidate: true });
  }, [form]);

  // ── Calculations ────────────────────────────────────────────────────────────
  const financialSummary = useMemo(() => {
    const baseCost = unitCost * totalArea;

    const standardDeductionTotal = selections.reduce<number>((acc, curr) => {
      if (!curr) return acc;
      const opt = DEDUCTION_CHOICES.find((c: any) => String(c.id) === String(curr)) as any;
      if (!opt) return acc;

      let amount = 0;
      if (opt.percentage) {
        amount = (baseCost * opt.percentage) / 100;
      } else if (opt.pricePerSqm) {
        amount = opt.pricePerSqm * totalArea;
      }
      return acc + amount;
    }, 0);

    let additionalPercentTotal = 0;
    additionalPercentSelections.forEach((id, idx) => {
      if (!id) return;
      const opt = ADDITIONAL_PERCENT_CHOICES.find((o: any) => String(o.id) === String(id));
      const area = additionalPercentAreas[idx] || 0;
      if (opt?.percentage) {
        additionalPercentTotal += ((unitCost * opt.percentage) / 100) * area;
      }
    });

    let additionalFlatTotal = 0;
    additionalFlatRateSelections.forEach((id, idx) => {
      if (!id) return;
      const opt = ADDITIONAL_FLAT_RATE_CHOICES.find((o: any) => String(o.id) === String(id));
      const area = additionalFlatRateAreas[idx] || 0;
      if (opt?.pricePerSqm) {
        additionalFlatTotal += opt.pricePerSqm * area;
      }
    });

    const totalAdditions = additionalPercentTotal + additionalFlatTotal;
    const netUnitCost = baseCost - standardDeductionTotal;
    const netMarketValue = netUnitCost + totalAdditions;

    return {
      standardDeductionTotal,
      totalAdditions,
      netUnitCost,
      netMarketValue,
      additionalPercentTotal,
      additionalFlatTotal,
    };
  }, [
    unitCost,
    totalArea,
    selections,
    additionalPercentSelections,
    additionalPercentAreas,
    additionalFlatRateSelections,
    additionalFlatRateAreas,
  ]);

  // ── Handle Next ─────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNext = useCallback(async (_data: any) => {
    setIsSaving(true);
    try {
      const { netMarketValue } = financialSummary;

      if (netMarketValue !== undefined && netMarketValue !== null) {
        localStorage.setItem("land_market_value_p4", netMarketValue.toString());
      }

      const p4LocalStorageData = {
        selected_deductions: selections.filter(Boolean),
        overall_comments: comments,
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(","),
        additional_percentage_areas: additionalPercentAreas,
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(","),
        additional_flat_rate_areas: additionalFlatRateAreas,
        market_value: financialSummary.netMarketValue,
      };
      localStorage.setItem("land_p4", JSON.stringify(p4LocalStorageData));

      const formData = {
        status: "draft",
        selected_deductions: selections.filter(Boolean),
        overall_comments: comments,
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(","),
        additional_percentage_value: financialSummary.totalAdditions,
        additional_percentage_areas: additionalPercentAreas,
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(","),
        additional_flat_rate_value: additionalFlatRateAreas.reduce((a, b) => a + b, 0),
        additional_flat_rate_areas: additionalFlatRateAreas,
        market_value: financialSummary.netMarketValue,
      };

      const currentDraftId = draftId || localStorage.getItem("land_draft_id");
      const method = currentDraftId ? "PUT" : "POST";
      const url = currentDraftId ? `${API_ENDPOINT}/${currentDraftId}` : API_ENDPOINT;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) {
          setIsDirty(false);
          localStorage.setItem("land_draft_id", result.data.id.toString());
          router.push(`/land-other-improvements/fill/step-5?id=${result.data.id}`);
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  }, [financialSummary, selections, comments, additionalPercentSelections, additionalPercentAreas, additionalFlatRateSelections, additionalFlatRateAreas, draftId, router]);

  // ── Handle Save Draft ───────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveDraft = useCallback(async (_data: any) => {
    setIsSavingDraft(true);
    try {
      const { netMarketValue } = financialSummary;
      if (netMarketValue !== undefined && netMarketValue !== null) {
        localStorage.setItem("land_market_value_p4", netMarketValue.toString());
      }
      localStorage.setItem("land_p4", JSON.stringify({
        selected_deductions: selections.filter(Boolean),
        overall_comments: comments,
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(","),
        additional_percentage_areas: additionalPercentAreas,
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(","),
        additional_flat_rate_areas: additionalFlatRateAreas,
        market_value: financialSummary.netMarketValue,
      }));

      const formData = {
        status: "draft",
        selected_deductions: selections.filter(Boolean),
        overall_comments: comments,
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(","),
        additional_percentage_value: financialSummary.totalAdditions,
        additional_percentage_areas: additionalPercentAreas,
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(","),
        additional_flat_rate_value: additionalFlatRateAreas.reduce((a: number, b: number) => a + b, 0),
        additional_flat_rate_areas: additionalFlatRateAreas,
        market_value: financialSummary.netMarketValue,
      };

      const currentDraftId = draftId || localStorage.getItem("land_draft_id");
      const method = currentDraftId ? "PUT" : "POST";
      const url = currentDraftId ? `${API_ENDPOINT}/${currentDraftId}` : API_ENDPOINT;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) localStorage.setItem("land_draft_id", result.data.id.toString());
        setIsDirty(false);
        toast.success("Draft saved successfully.");
      } else {
        toast.error("Failed to save draft.");
      }
    } catch {
      toast.error("Error saving draft.");
    } finally {
      setIsSavingDraft(false);
    }
  }, [financialSummary, selections, comments, additionalPercentSelections, additionalPercentAreas, additionalFlatRateSelections, additionalFlatRateAreas, draftId]);

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
                <BreadcrumbLink href="/land-other-improvements/dashboard">
                  Land &amp; Other Improvements
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Other Improvements</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto bg-stone-200">
          <div className="max-w-4xl mx-auto">
            <header className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Fill-up Form: Other Improvements</h1>
                <p className="text-sm text-muted-foreground">Manage land improvement deductions and deviations.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.handleSubmit(handleSaveDraft)()}
                disabled={isSavingDraft || isSaving}
                className="shrink-0"
              >
                {isSavingDraft ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Draft"}
              </Button>
            </header>

            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-8">

              <div data-comment-field="selected_deductions">
                <DeductionsTable
                  selections={selections}
                  onSelectionChange={handleSelectionChange}
                  quantities={quantities}
                  onQuantitiesChange={setQuantities}
                  deductionChoices={DEDUCTION_CHOICES}
                  error={form.formState.errors.deductions?.message as string}
                />
              </div>

              <AdjustmentTable
                options={ADDITIONAL_FLAT_RATE_CHOICES}
                values={additionalFlatRateSelections}
                onChange={setAdditionalFlatRateSelections}
                baseMarketValue={financialSummary.netMarketValue}
              />

              <div data-comment-field="market_value">
                <TotalImprovements
                  label="Market Value Summary"
                  unitCost={unitCost}
                  totalArea={totalArea}

                  deductionSelections={selections}
                  deductionOptions={DEDUCTION_CHOICES}

                  addPercentSelections={additionalPercentSelections}
                  addPercentAreas={additionalPercentAreas}
                  addPercentOptions={ADDITIONAL_PERCENT_CHOICES}

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
                isNextDisabled={isSaving || isSavingDraft}
                basePath="land-other-improvements"
                steps={LAND_IMPROVEMENT_STEPS}
                draftStorageKey="land_draft_id"
              />
            </form>
          </div>
        </div>
      </SidebarInset>
      <ReviewCommentsFloat draftId={draftId} />
    </SidebarProvider>
  );
};

export default function LandImprovementsFormFillPage4Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandImprovementsFormFillPage4 />
    </Suspense>
  );
}
