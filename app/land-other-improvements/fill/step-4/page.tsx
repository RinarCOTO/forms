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

import { DeductionsTable, AdjustmentTable, SelectOption } from "./improvementsTable";
import TotalImprovements from "./improvementsTable";

import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useFormLock } from "@/hooks/useFormLock";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFormData } from "@/hooks/useFormData";
import { municipalityData } from "@/app/smv/land-other-improvements/data";

// ─── Empty choice arrays — data to be added later ────────────────────────────
const DEDUCTION_CHOICES: any[] = [];
const ADDITIONAL_PERCENT_CHOICES: any[] = [];

// ─── Agricultural Land Adjustment Factors (RA 7160 / RPAM) ──────────────────
// Category 1: Type of Road
// Category 2: Distance to All-Weather Road
// Category 3: Distance to Trading Center (Poblacion)
// A user typically picks one option per category (up to 3 rows total).
const ADDITIONAL_FLAT_RATE_CHOICES = [
  // (1) Type of Road
  { id: "road-national",    name: "Provincial/National Road",          percentage:  0 },
  { id: "road-allweather",  name: "All Weather Road",                  percentage: -3 },
  { id: "road-dirt",        name: "Dirt Road",                         percentage: -6 },
  { id: "road-none",        name: "No Road Outlet",                    percentage: -9 },
  // (2a) Distance to All-Weather Road — 0 to 1 km is baseline (0%), farther = deduction
  { id: "awr-0-1",          name: "0–1 km to All-Weather Road",        percentage:  0 },
  { id: "awr-1-3",          name: "Over 1–3 km to All-Weather Road",   percentage: -2 },
  { id: "awr-3-6",          name: "Over 3–6 km to All-Weather Road",   percentage: -4 },
  { id: "awr-6-9",          name: "Over 6–9 km to All-Weather Road",   percentage: -6 },
  { id: "awr-9+",           name: "Over 9 km to All-Weather Road",     percentage: -8 },
  // (2b) Distance to Trading Center (Poblacion) — 0 to 1 km gets +5% addition
  { id: "tc-0-1",           name: "0–1 km to Trading Center",          percentage: +5 },
  { id: "tc-1-3",           name: "Over 1–3 km to Trading Center",     percentage:  0 },
  { id: "tc-3-6",           name: "Over 3–6 km to Trading Center",     percentage: -2 },
  { id: "tc-6-9",           name: "Over 6–9 km to Trading Center",     percentage: -4 },
  { id: "tc-9+",            name: "Over 9 km to Trading Center",       percentage: -6 },
];

const API_ENDPOINT = "/api/faas/land-improvements";

const FormSchema = z.object({
  deductions: z.array(z.string()),
});

const LandImprovementsFormFillPage4 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");
  const { checking: lockChecking, locked, lockedBy } = useFormLock('land_improvements', draftId);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isInitializedRef = useRef(false);

  // Standard Deductions
  const [selections, setSelections] = useState<(string | number | null)[]>(() => [null]);
  const [quantities, setQuantities] = useState<number[]>([0]);

  // Improvement kinds (e.g. Avocado, Banana under Fruit Land)
  const [selectedKinds, setSelectedKinds] = useState<(string | number | null)[]>([null]);

  // Additional Percent (Additions)
  const [additionalPercentSelections, setAdditionalPercentSelections] = useState<(string | number | null)[]>(() => [null]);
  const [additionalPercentAreas, setAdditionalPercentAreas] = useState<number[]>([0]);

  // Additional Flat Rate (Additions)
  const [additionalFlatRateSelections, setAdditionalFlatRateSelections] = useState<(string | number | null)[]>(() => [null]);
  const [adjustedMarketValue, setAdjustedMarketValue] = useState(0);
  const [additionalFlatRateAreas, setAdditionalFlatRateAreas] = useState<number[]>([0]);

  const [comments, setComments] = useState<string>("");
  const [unitCost, setUnitCost] = useState<number>(0);
  const [totalArea, setTotalArea] = useState<number>(0);
  const [baseMarketValueP3, setBaseMarketValueP3] = useState<number>(0);
  const [arpNo, setArpNo] = useState("");

  // Loaded from step 3 to conditionally show improvement kind
  const [classification, setClassification] = useState("");
  const [subClassification, setSubClassification] = useState("");
  const [municipality, setMunicipality] = useState("");
  // "first" | "second" | "third" | "fourth" — drives which price column to use for kind options
  const [landClass, setLandClass] = useState<"first" | "second" | "third" | "fourth">("first");

  // Show improvement kind options only when classification is agricultural + Fruit Land
  // The options come from the municipality's agriculturalImprovementRow (e.g. Avocado, Banana, etc.)
  const munKey = municipality.toLowerCase();
  const improvementKindOptions =
    classification === "agricultural" && subClassification === "Fruit Land"
      ? (municipalityData[munKey]?.agriculturalImprovementRow ?? [])
      : [];

  // When improvement kind options exist, use them as the deduction choices in the table.
  // Otherwise fall back to the default (empty) DEDUCTION_CHOICES.
  // Use the price column matching the selected land class (e.g. landClass="second" → row.second).
  // Falls back to "first" if landClass is unset.
  const effectiveDeductionChoices: SelectOption[] = improvementKindOptions.length > 0
    ? improvementKindOptions.map((row) => ({
        id: row.type,
        name: row.type,
        pricePerSqm: parseFloat(((landClass in row ? row[landClass as "first" | "second" | "third"] : row.first) ?? row.first).replace(/[₱,\s]/g, "")) || 0,
      }))
    : DEDUCTION_CHOICES;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loadedData } = useFormData<any>("faas/land-improvements", draftId || "");

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { deductions: [] },
  });

  // ── Data Loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    isInitializedRef.current = false;
    const savedCost = localStorage.getItem("land_unit_cost_p4");
    const dbCost = loadedData?.unit_value;
    if (savedCost) setUnitCost(parseFloat(savedCost));
    else if (dbCost) setUnitCost(parseFloat(dbCost));

    const savedArea = localStorage.getItem("land_total_area_p4");
    const dbArea = loadedData?.land_area;
    if (savedArea) setTotalArea(parseFloat(savedArea));
    else if (dbArea) setTotalArea(parseFloat(dbArea));

    if (loadedData?.base_market_value) setBaseMarketValueP3(parseFloat(loadedData.base_market_value));
    const arpNoFromDb = loadedData?.arp_no;
    const arpNoFromStorage = localStorage.getItem('arp_no_p1');
    if (arpNoFromDb) setArpNo(arpNoFromDb);
    else if (arpNoFromStorage) setArpNo(arpNoFromStorage);

    if (loadedData?.overall_comments) setComments(loadedData.overall_comments);
    if (loadedData?.classification) setClassification(loadedData.classification);
    if (loadedData?.sub_classification) setSubClassification(loadedData.sub_classification);
    if (loadedData?.location_municipality) setMunicipality(loadedData.location_municipality);
    if (loadedData?.land_class) setLandClass(loadedData.land_class);
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

    // Restore selections directly — IDs are the kind names (e.g. "Avocado", "Banana")
    if (savedDeductions.length > 0) {
      setSelections(savedDeductions);
      form.setValue("deductions", savedDeductions, { shouldValidate: true });
    }

    // Restore improvement kinds (e.g. Avocado, Banana under Fruit Land)
    if (loadedData?.improvement_kind?.length > 0) {
      setSelectedKinds(
        Array.isArray(loadedData.improvement_kind)
          ? loadedData.improvement_kind
          : loadedData.improvement_kind.split(",")
      );
    }

    // Restore quantities (Total Number column)
    if (loadedData?.quantities?.length > 0) {
      setQuantities(loadedData.quantities.map(Number));
    }

    setTimeout(() => { isInitializedRef.current = true; }, 150);
  }, [loadedData, form]);

  useEffect(() => {
    if (isInitializedRef.current) setIsDirty(true);
  }, [selections, comments, additionalPercentSelections, additionalPercentAreas, additionalFlatRateSelections, additionalFlatRateAreas]);

  const handleSelectionChange = useCallback((newValues: (string | number | null)[]) => {
    setSelections([...newValues]);
    const validNames = newValues
      .map((val) => effectiveDeductionChoices.find((c) => String(c.id) === String(val))?.name)
      .filter((v): v is string => !!v);
    form.setValue("deductions", validNames, { shouldValidate: true });
  }, [form, effectiveDeductionChoices]);

  // ── Calculations ────────────────────────────────────────────────────────────
  const financialSummary = useMemo(() => {
    const baseCost = unitCost * totalArea;

    const standardDeductionTotal = selections.reduce<number>((acc, curr) => {
      if (!curr) return acc;
      const opt = effectiveDeductionChoices.find((c) => String(c.id) === String(curr)) as any;
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

    const baseCostForAdjustment = unitCost * totalArea;
    let additionalFlatTotal = 0;
    additionalFlatRateSelections.forEach((id) => {
      if (!id) return;
      const opt = ADDITIONAL_FLAT_RATE_CHOICES.find((o) => String(o.id) === String(id));
      if (opt?.percentage) {
        additionalFlatTotal += (baseCostForAdjustment * opt.percentage) / 100;
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
    effectiveDeductionChoices,
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
      localStorage.setItem("land_market_value_p4", adjustedMarketValue.toString());

      const p4LocalStorageData = {
        selected_deductions: selections.filter(Boolean),
        overall_comments: comments,
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(","),
        additional_percentage_areas: additionalPercentAreas,
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(","),
        additional_flat_rate_areas: additionalFlatRateAreas,
        market_value: adjustedMarketValue,
      };
      localStorage.setItem("land_p4", JSON.stringify(p4LocalStorageData));

      const formData = {
        status: "draft",
        selected_deductions: selections.filter(Boolean),
        improvement_kind: selectedKinds.filter(Boolean),
        quantities,
        overall_comments: comments,
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(","),
        additional_percentage_value: financialSummary.totalAdditions,
        additional_percentage_areas: additionalPercentAreas,
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(","),
        additional_flat_rate_value: additionalFlatRateAreas.reduce((a, b) => a + b, 0),
        additional_flat_rate_areas: additionalFlatRateAreas,
        market_value: adjustedMarketValue,
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
  }, [adjustedMarketValue, financialSummary, selections, comments, additionalPercentSelections, additionalPercentAreas, additionalFlatRateSelections, additionalFlatRateAreas, draftId, router]);

  // ── Handle Save Draft ───────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveDraft = useCallback(async (_data: any) => {
    setIsSavingDraft(true);
    try {
      localStorage.setItem("land_market_value_p4", adjustedMarketValue.toString());
      localStorage.setItem("land_p4", JSON.stringify({
        selected_deductions: selections.filter(Boolean),
        overall_comments: comments,
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(","),
        additional_percentage_areas: additionalPercentAreas,
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(","),
        additional_flat_rate_areas: additionalFlatRateAreas,
        market_value: adjustedMarketValue,
      }));

      const formData = {
        status: "draft",
        selected_deductions: selections.filter(Boolean),
        improvement_kind: selectedKinds.filter(Boolean),
        quantities,
        overall_comments: comments,
        additional_percentage_choice: additionalPercentSelections.filter(Boolean).join(","),
        additional_percentage_value: financialSummary.totalAdditions,
        additional_percentage_areas: additionalPercentAreas,
        additional_flat_rate_choice: additionalFlatRateSelections.filter(Boolean).join(","),
        additional_flat_rate_value: additionalFlatRateAreas.reduce((a: number, b: number) => a + b, 0),
        additional_flat_rate_areas: additionalFlatRateAreas,
        market_value: adjustedMarketValue,
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
  }, [adjustedMarketValue, financialSummary, selections, comments, additionalPercentSelections, additionalPercentAreas, additionalFlatRateSelections, additionalFlatRateAreas, draftId]);

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

        <div className="flex-1 p-6 overflow-y-auto">
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
                disabled={isSavingDraft || isSaving || locked || lockChecking}
                className="shrink-0"
              >
                {isSavingDraft ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Draft"}
              </Button>
            </header>
            {lockChecking && (
              <div className="flex items-center gap-2 mb-4 rounded-md border bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking form availability…
              </div>
            )}
            {!lockChecking && locked && (
              <div className="flex items-center gap-2 mb-4 rounded-md border border-yellow-400/50 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                <Lock className="h-4 w-4 shrink-0" />
                <span><strong>{lockedBy}</strong> is currently editing this form. You can view it but cannot make changes.</span>
              </div>
            )}
            <fieldset disabled={locked || lockChecking} className={`border-0 p-0 m-0 min-w-0 block${locked || lockChecking ? ' opacity-60' : ''}`}>
            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-8">

              <div data-comment-field="selected_deductions">
                <DeductionsTable
                  selections={improvementKindOptions.length > 0 ? selectedKinds : selections}
                  onSelectionChange={improvementKindOptions.length > 0 ? setSelectedKinds : handleSelectionChange}
                  quantities={quantities}
                  onQuantitiesChange={setQuantities}
                  deductionChoices={effectiveDeductionChoices}
                  error={form.formState.errors.deductions?.message as string}
                />
              </div>

              <AdjustmentTable
                options={ADDITIONAL_FLAT_RATE_CHOICES}
                values={additionalFlatRateSelections}
                onChange={setAdditionalFlatRateSelections}
                baseMarketValue={baseMarketValueP3}
                isTitled={/^\d{2}-\d{4}-\d{5}$/.test(arpNo)}
                onMarketValueChange={setAdjustedMarketValue}
              />

              <div data-comment-field="market_value">
                <TotalImprovements
                  label="Market Value Summary"
                  unitCost={unitCost}
                  totalArea={totalArea}
                  isTitled={/^\d{2}-\d{4}-\d{5}$/.test(arpNo)}
                  baseMarketValue={baseMarketValueP3}
                  adjustedMarketValue={adjustedMarketValue}

                  deductionSelections={selections}
                  deductionOptions={effectiveDeductionChoices}

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
                isNextDisabled={isSaving || isSavingDraft || locked || lockChecking}
                basePath="land-other-improvements"
                steps={LAND_IMPROVEMENT_STEPS}
                draftStorageKey="land_draft_id"
              />
            </form>
            </fieldset>
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
