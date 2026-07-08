"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import { StepPagination } from "@/components/ui/step-pagination";
import { LAND_STEPS } from "@/app/land-other-improvements/fill/constants";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import "@/app/styles/forms-fill.css";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { SaveDraftButton } from "@/components/SaveDraftButton";
import { FormLockBanner } from "@/components/ui/form-lock-banner";
import { Label } from "@/components/ui/label";

import { DeductionsTable, AdjustmentTable, SelectOption } from "./improvementsTable";
import TotalImprovements from "./improvementsTable";

import { toast } from "sonner";
import { useFormLock } from "@/hooks/useFormLock";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFormData } from "@/hooks/useFormData";
import { municipalityData } from "@/app/smv/land-other-improvements/data";
import { PINE_TREE_IMPROVEMENT_OPTIONS } from "@/app/smv/land-other-improvements/pine-tree-schedule";
import { getStoredFaasDraftId, setStoredFaasDraftId } from "@/utils/form-draft-storage";

// ─── Empty choice arrays — data to be added later ────────────────────────────
const DEDUCTION_CHOICES: SelectOption[] = [];
const ADDITIONAL_PERCENT_CHOICES: SelectOption[] = [];

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

function safeSetLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Skipping localStorage write for ${key}:`, error);
  }
}

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

  // Pinetree Land only — optional, no default. Most municipalities don't assess
  // improvements at a separate rate, so this stays blank unless an assessor types one in.
  const [improvementAssessmentLevel, setImprovementAssessmentLevel] = useState("");

  // Additional Percent (Additions)
  const [additionalPercentSelections, setAdditionalPercentSelections] = useState<(string | number | null)[]>(() => [null]);
  const [additionalPercentAreas, setAdditionalPercentAreas] = useState<number[]>([0]);

  // Additional Flat Rate (Additions)
  const [additionalFlatRateSelections, setAdditionalFlatRateSelections] = useState<(string | number | null)[]>(() => [null]);
  // Value from AdjustmentTable: base land value x (100% + titled bonus + adjustment factors)
  const [baseAdjustedMarketValue, setBaseAdjustedMarketValue] = useState(0);
  const [additionalFlatRateAreas, setAdditionalFlatRateAreas] = useState<number[]>([0]);

  const [comments, setComments] = useState<string>("");
  const [unitCost, setUnitCost] = useState<number>(0);
  const [totalArea, setTotalArea] = useState<number>(0);
  const [baseMarketValueP3, setBaseMarketValueP3] = useState<number>(0);
  const [titleNo, setTitleNo] = useState("");

  // Loaded from step 3 to conditionally show improvement kind
  const [classification, setClassification] = useState("");
  const [subClassification, setSubClassification] = useState("");
  const [municipality, setMunicipality] = useState("");
  // "first" | "second" | "third" | "fourth" — drives which price column to use for kind options
  const [landClass, setLandClass] = useState<"first" | "second" | "third" | "fourth">("first");

  // Show improvement kind options only when classification is agricultural + Fruit Land
  // The options come from the municipality's agriculturalImprovementRow (e.g. Avocado, Banana, etc.)
  const munKey = municipality.toLowerCase();
  const isFruitLand = classification === "agricultural" && subClassification === "Fruit Land";
  // Pine Tree schedule is a single province-wide table (not per-municipality)
  const isPinetreeLand = classification === "agricultural" && subClassification === "Pinetree Land";
  const improvementKindOptions = isFruitLand
    ? (municipalityData[munKey]?.agriculturalImprovementRow ?? [])
    : [];
  const hasImprovementKindOptions = isPinetreeLand || improvementKindOptions.length > 0;

  // When improvement kind options exist, use them as the deduction choices in the table.
  // Otherwise fall back to the default (empty) DEDUCTION_CHOICES.
  // Use the price column matching the selected land class (e.g. landClass="second" → row.second).
  // Falls back to "first" if landClass is unset.
  const effectiveDeductionChoices: SelectOption[] = isPinetreeLand
    ? PINE_TREE_IMPROVEMENT_OPTIONS
    : improvementKindOptions.length > 0
      ? improvementKindOptions.map((row) => ({
          id: row.type,
          name: row.type,
          pricePerSqm: parseFloat(((landClass in row ? row[landClass as "first" | "second" | "third"] : row.first) ?? row.first).replace(/[₱,\s]/g, "")) || 0,
        }))
      : DEDUCTION_CHOICES;

  // Sum of (quantity x unit price) across picked improvement kinds (e.g. pine trees, fruit trees).
  // This is a flat peso addition, separate from the percentage-based adjustment factors below.
  const improvementKindTotal = hasImprovementKindOptions
    ? selectedKinds.reduce<number>((sum, id, i) => {
        if (!id) return sum;
        const opt = effectiveDeductionChoices.find((o) => String(o.id) === String(id));
        return opt?.pricePerSqm ? sum + opt.pricePerSqm * (quantities[i] || 0) : sum;
      }, 0)
    : 0;

  // Final market value = (base land value x adjustment factors from AdjustmentTable) + improvement kinds total
  const adjustedMarketValue = baseAdjustedMarketValue + improvementKindTotal;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loadedData } = useFormData<any>("faas/land-improvements", draftId || "");

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { deductions: [] },
  });

  useEffect(() => {
    try {
      localStorage.removeItem("land_p4");
    } catch {
      // Best-effort cleanup only.
    }
  }, []);

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
    if (loadedData) {
      // Existing draft — trust the DB's value, including an explicit "no title," over
      // any stale localStorage value left over from a different draft/session.
      setTitleNo(loadedData.oct_tct_cloa_no || "");
    } else {
      const titleNoFromStorage = localStorage.getItem('oct_tct_cloa_no_p1');
      if (titleNoFromStorage) setTitleNo(titleNoFromStorage);
    }

    if (loadedData?.overall_comments) setComments(loadedData.overall_comments);
    if (loadedData?.classification) setClassification(loadedData.classification);
    if (loadedData?.sub_classification) setSubClassification(loadedData.sub_classification);
    if (loadedData?.location_municipality) setMunicipality(loadedData.location_municipality);
    if (loadedData?.land_class) setLandClass(loadedData.land_class);
    if (loadedData?.improvement_assessment_level != null) {
      setImprovementAssessmentLevel(String(loadedData.improvement_assessment_level));
    }
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
      const opt = effectiveDeductionChoices.find((c) => String(c.id) === String(curr));
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
      const opt = ADDITIONAL_PERCENT_CHOICES.find((o) => String(o.id) === String(id));
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
  ]);

  // ── Handle Next ─────────────────────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    setIsSaving(true);
    try {
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
        land_market_value: baseAdjustedMarketValue,
        improvement_market_value: improvementKindTotal,
        improvement_assessment_level: improvementAssessmentLevel ? parseFloat(improvementAssessmentLevel) || 0 : null,
      };

      const currentDraftId = draftId || getStoredFaasDraftId(localStorage, "land");
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
          safeSetLocalStorage("land_market_value_p4", adjustedMarketValue.toString());
          setStoredFaasDraftId(localStorage, "land", result.data.id.toString());
          router.push(`/land-other-improvements/fill/step-5?id=${result.data.id}`);
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  }, [adjustedMarketValue, baseAdjustedMarketValue, improvementKindTotal, improvementAssessmentLevel, financialSummary, selections, selectedKinds, quantities, comments, additionalPercentSelections, additionalPercentAreas, additionalFlatRateSelections, additionalFlatRateAreas, draftId, router]);

  // ── Handle Save Draft ───────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
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
        land_market_value: baseAdjustedMarketValue,
        improvement_market_value: improvementKindTotal,
        improvement_assessment_level: improvementAssessmentLevel ? parseFloat(improvementAssessmentLevel) || 0 : null,
      };

      const currentDraftId = draftId || getStoredFaasDraftId(localStorage, "land");
      const method = currentDraftId ? "PUT" : "POST";
      const url = currentDraftId ? `${API_ENDPOINT}/${currentDraftId}` : API_ENDPOINT;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) setStoredFaasDraftId(localStorage, "land", result.data.id.toString());
        safeSetLocalStorage("land_market_value_p4", adjustedMarketValue.toString());
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
  }, [adjustedMarketValue, baseAdjustedMarketValue, improvementKindTotal, improvementAssessmentLevel, financialSummary, selections, selectedKinds, quantities, comments, additionalPercentSelections, additionalPercentAreas, additionalFlatRateSelections, additionalFlatRateAreas, draftId]);

  return (
    <FormFillLayout
      breadcrumbParent={{ label: "Land & Other Improvements", href: "/land-other-improvements/dashboard" }}
      pageTitle="Other Improvements"
      sidePanel={<ErrorBoundary><ReviewCommentsFloat draftId={draftId} formType="land" /></ErrorBoundary>}
    >
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Fill-up Form: Other Improvements</h1>
                <p className="text-sm text-muted-foreground">Manage land improvement deductions and deviations.</p>
              </div>
              <SaveDraftButton
                onClick={() => form.handleSubmit(handleSaveDraft)()}
                isSaving={isSavingDraft}
                disabled={isSavingDraft || isSaving || locked || lockChecking}
              />
            </header>
            <FormLockBanner locked={locked} lockedBy={lockedBy} />
            <fieldset disabled={locked || lockChecking} className={`border-0 p-0 m-0 min-w-0 block${locked || lockChecking ? ' opacity-60' : ''}`}>
            <form onSubmit={form.handleSubmit(handleNext)} className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">

              <div data-comment-field="selected_deductions">
                <DeductionsTable
                  selections={hasImprovementKindOptions ? selectedKinds : selections}
                  onSelectionChange={hasImprovementKindOptions ? setSelectedKinds : handleSelectionChange}
                  quantities={quantities}
                  onQuantitiesChange={setQuantities}
                  deductionChoices={effectiveDeductionChoices}
                  error={form.formState.errors.deductions?.message as string}
                />
              </div>

              {isPinetreeLand && (
                <section className="bg-card rounded-lg border p-6 shadow-sm" data-comment-field="improvement_assessment_level">
                  <Label className="rpfaas-fill-label mb-2 block">Assessment Level (Other Improvements)</Label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parseFloat(improvementAssessmentLevel) === 40}
                      onChange={(e) => setImprovementAssessmentLevel(e.target.checked ? "40%" : "")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Assess Other Improvements at 40%</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Applies to the whole Other Improvements total above, not per entry. Leave unchecked
                    to assess the combined market value at the land&apos;s rate, as usual (most municipalities).
                  </p>
                </section>
              )}

              <AdjustmentTable
                options={ADDITIONAL_FLAT_RATE_CHOICES}
                values={additionalFlatRateSelections}
                onChange={setAdditionalFlatRateSelections}
                baseMarketValue={baseMarketValueP3}
                isTitled={Boolean(titleNo)}
                onMarketValueChange={setBaseAdjustedMarketValue}
              />

              <div data-comment-field="market_value">
                <TotalImprovements
                  label="Market Value Summary"
                  unitCost={unitCost}
                  totalArea={totalArea}
                  isTitled={Boolean(titleNo)}
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
                steps={LAND_STEPS}
                draftStorageKey="land_draft_id"
              />
            </form>
            </fieldset>
    </FormFillLayout>
  );
};

export default function LandImprovementsFormFillPage4Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandImprovementsFormFillPage4 />
    </Suspense>
  );
}
