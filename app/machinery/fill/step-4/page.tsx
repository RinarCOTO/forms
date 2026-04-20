"use client";

// React & Next.js
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";

// Styles
import "@/app/styles/forms-fill.css";

// Third-party
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// UI components
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { FormLockBanner } from "@/components/ui/form-lock-banner";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepPagination } from "@/components/ui/step-pagination";
import { Textarea } from "@/components/ui/textarea";

// Hooks
import { useFormLock } from "@/hooks/useFormLock";

// RPFAAS components
import { ReviewCommentsFloat } from "@/components/review-comments-float";
import { ACTUAL_USE_OPTIONS } from "@/app/machinery/components/machinery-item-card";

// Constants
import { MACHINERY_STEPS } from "@/app/machinery/fill/constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Assessment levels for machinery per RA 7160, Section 218.
 * Keyed by actual use code (AA, AR, AC, AI, ASC, ASS, ASH, ASLWD, SG).
 */
function getMachineryAssessmentLevel(actualUseCode: string): string {
  switch (actualUseCode) {
    case "AA":    return "40%";
    case "AR":    return "50%";
    case "AC":    return "80%";
    case "AI":    return "80%";
    case "ASC":   return "15%";
    case "ASS":   return "15%";
    case "ASH":   return "15%";
    case "ASLWD": return "10%";
    case "SG":    return "10%";
    default:      return "";
  }
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const thousands = ["", "Thousand", "Million", "Billion"];

  function convertHundreds(n: number): string {
    let result = "";
    if (n >= 100) { result += ones[Math.floor(n / 100)] + " Hundred "; n %= 100; }
    if (n >= 10 && n < 20) { result += teens[n - 10] + " "; }
    else { if (n >= 20) { result += tens[Math.floor(n / 10)] + " "; n %= 10; } if (n > 0) result += ones[n] + " "; }
    return result.trim();
  }

  let word = ""; let scale = 0;
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      const chunkWord = convertHundreds(chunk);
      word = chunkWord + (thousands[scale] ? " " + thousands[scale] : "") + (word ? " " + word : "");
    }
    num = Math.floor(num / 1000); scale++;
  }
  return word.trim();
}

function formatWithCommas(num: number): string {
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function MachineryStep4Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  const { checking: lockChecking, locked, lockedBy } = useFormLock("machinery", draftId);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [actualUse, setActualUse] = useState(""); // derived from first item's actual_use
  const [marketValue, setMarketValue] = useState<number>(0);
  const [taxStatus, setTaxStatus] = useState<"taxable" | "exempt">("taxable");
  const [effectivityYear, setEffectivityYear] = useState(String(new Date().getFullYear() + 1));
  const [appraisedBy, setAppraisedBy] = useState("");
  const [memoranda, setMemoranda] = useState("");

  const [taxMappers, setTaxMappers] = useState<{ id: string; full_name: string }[]>([]);
  const [taxMappersLoading, setTaxMappersLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; full_name: string; role: string } | null>(null);
  const [propertyMunicipality, setPropertyMunicipality] = useState("");

  const actualUseLabel = ACTUAL_USE_OPTIONS.find(u => u.code === actualUse)?.label ?? "";

  // Derived values
  const assessmentLevel = useMemo(
    () => getMachineryAssessmentLevel(actualUse),
    [actualUse]
  );

  const assessedValue = useMemo(() => {
    if (!marketValue || !assessmentLevel) return 0;
    const raw = marketValue * (parseFloat(assessmentLevel) / 100);
    return Math.round(raw / 10) * 10;
  }, [marketValue, assessmentLevel]);

  const amountInWords = useMemo(
    () => (assessedValue > 0 ? numberToWords(assessedValue) : ""),
    [assessedValue]
  );

  // ── Fetch current user ──
  useEffect(() => {
    Promise.all([
      fetch("/api/auth/user").then(r => r.json()),
      fetch("/api/users/permissions").then(r => r.json()),
    ]).then(([authData, permsData]) => {
      if (authData.user) {
        setCurrentUser({
          id: authData.user.id,
          full_name: authData.user.user_metadata?.full_name || authData.user.email?.split("@")[0] || "",
          role: permsData.role || "",
        });
      }
    }).catch(() => {});
  }, []);

  // Auto-select current user for all roles (unless a value was already loaded from the draft)
  useEffect(() => {
    if (!currentUser || appraisedBy) return;
    setAppraisedBy(currentUser.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // ── Fetch tax mappers when municipality is known ──
  useEffect(() => {
    if (!propertyMunicipality) return;
    setTaxMappersLoading(true);
    const params = new URLSearchParams({ role: "municipal_tax_mapper", municipality: propertyMunicipality });
    fetch(`/api/users/by-role?${params}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.users)) setTaxMappers(data.users); })
      .catch(() => {})
      .finally(() => setTaxMappersLoading(false));
  }, [propertyMunicipality]);

  // ── Load draft ──
  useEffect(() => {
    if (!draftId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/faas/machinery/${draftId}`);
        if (!res.ok) return;
        const result = await res.json();
        if (!result.success || !result.data) return;
        const data = result.data;

        if (data.tax_status === "taxable" || data.tax_status === "exempt") setTaxStatus(data.tax_status);
        if (data.effectivity_of_assessment) setEffectivityYear(String(data.effectivity_of_assessment));
        if (data.appraised_by) setAppraisedBy(String(data.appraised_by));
        if (data.memoranda) setMemoranda(data.memoranda);
        if (data.location_municipality) setPropertyMunicipality(data.location_municipality.toLowerCase());

        // actual_use is a form-level field set in step-1
        if (data.actual_use) setActualUse(data.actual_use);

        // Market value = sum of items' depreciated values
        if (Array.isArray(data.appraisal_items) && data.appraisal_items.length > 0) {
          const total = data.appraisal_items.reduce(
            (sum: number, item: { depreciated_value?: string }) =>
              sum + (parseFloat(item.depreciated_value || "0") || 0),
            0
          );
          if (total > 0) setMarketValue(total);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [draftId]);

  // ── Save logic ──
  const saveData = useCallback(async (): Promise<boolean> => {
    const currentDraftId = draftId || localStorage.getItem("draft_id");
    if (!currentDraftId) {
      toast.error("No draft found. Go back to step 1 and save first.");
      return false;
    }
    const payload: Record<string, unknown> = {
      actual_use: actualUse,
      market_value: marketValue,
      assessment_level: assessmentLevel ? parseFloat(assessmentLevel) : null,
      assessed_value: assessedValue,
      amount_in_words: amountInWords,
      tax_status: taxStatus,
      effectivity_of_assessment: effectivityYear ? parseInt(effectivityYear) : null,
    };
    if (appraisedBy) payload.appraised_by = appraisedBy;
    if (memoranda) payload.memoranda = memoranda;

    try {
      const res = await fetch(`/api/faas/machinery/${currentDraftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return true;
      const error = await res.json();
      toast.error("Failed to save: " + (error.message ?? "Unknown error"));
    } catch {
      toast.error("Error saving. Please try again.");
    }
    return false;
  }, [draftId, actualUse, marketValue, assessmentLevel, assessedValue, amountInWords, taxStatus, effectivityYear, appraisedBy, memoranda]);

  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    const ok = await saveData();
    if (ok) toast.success("Draft saved successfully.");
    setIsSavingDraft(false);
  }, [saveData]);

  const handlePreview = useCallback(async () => {
    setIsSaving(true);
    const ok = await saveData();
    if (ok) {
      const id = draftId || localStorage.getItem("draft_id");
      router.push(`/machinery/fill/preview-form${id ? `?id=${id}` : ""}`);
    }
    setIsSaving(false);
  }, [saveData, draftId, router]);

  return (
    <FormFillLayout
      breadcrumbParent={{ label: "Machinery", href: "#" }}
      pageTitle="Step 4: Property Assessment"
      sidePanel={
        <ErrorBoundary>
          <ReviewCommentsFloat
            draftId={draftId}
            stepFields={["actual_use", "market_value", "assessment_level", "assessed_value", "amount_in_words", "effectivity_of_assessment", "appraised_by", "memoranda"]}
          />
        </ErrorBoundary>
      }
    >
      <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="rpfaas-fill-title">Fill-up Form: RPFAAS - Machinery</h1>
          <p className="text-sm text-muted-foreground">Final summary of the machinery assessment.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveDraft}
          disabled={isSavingDraft || isSaving || locked || lockChecking}
          className="shrink-0"
        >
          {isSavingDraft ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Draft"}
        </Button>
      </header>

      <FormLockBanner locked={locked} lockedBy={lockedBy} />

      <fieldset
        disabled={locked}
        className={`border-0 p-0 m-0 min-w-0 block${locked ? " opacity-60" : ""}${lockChecking ? " animate-pulse" : ""}`}
      >
        <form className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">

          <FormSection title="Property Assessment">
            {/* Actual Use — read-only, set in step 1 */}
            <div className="space-y-1" data-comment-field="actual_use">
              <Label className="rpfaas-fill-label">Actual Use</Label>
              <Input
                value={actualUseLabel || "—"}
                readOnly
                disabled
                aria-disabled="true"
                className="rpfaas-fill-input bg-white text-black disabled:opacity-100"
              />
            </div>

            {/* Tax Status */}
            <div className="space-y-2">
              <Label className="rpfaas-fill-label">Tax Status</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tax_status" value="taxable" checked={taxStatus === "taxable"} onChange={() => setTaxStatus("taxable")} className="w-4 h-4" />
                  <span>Taxable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tax_status" value="exempt" checked={taxStatus === "exempt"} onChange={() => setTaxStatus("exempt")} className="w-4 h-4" />
                  <span>Exempt</span>
                </label>
              </div>
            </div>

            {/* Market Value — auto-computed from sum of items' depreciated values */}
            <div className="space-y-1" data-comment-field="market_value">
              <Label className="rpfaas-fill-label">Market Value</Label>
              <div className="h-9 rounded-md border border-input bg-muted/40 px-3 flex items-center text-sm">
                {marketValue > 0
                  ? `₱${marketValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : <span className="text-muted-foreground text-xs">—</span>
                }
              </div>
            </div>

            {/* Assessment Level (computed) */}
            <div className="space-y-1" data-comment-field="assessment_level">
              <Label className="rpfaas-fill-label">Assessment Level</Label>
              <Input
                value={assessmentLevel || "—"}
                readOnly
                disabled
                className="rpfaas-fill-input bg-muted/40 disabled:opacity-100"
              />
            </div>

            {/* Assessed Value (computed) */}
            <div className="space-y-1" data-comment-field="assessed_value">
              <Label className="rpfaas-fill-label">Assessed Value</Label>
              <Input
                value={assessedValue > 0 ? `₱${formatWithCommas(assessedValue)}` : ""}
                readOnly
                disabled
                className="rpfaas-fill-input bg-muted/40 disabled:opacity-100"
              />
            </div>

            {/* Amount in Words (computed) */}
            <div className="space-y-1" data-comment-field="amount_in_words">
              <Label className="rpfaas-fill-label">Amount in Words</Label>
              <Input
                value={amountInWords ? `${amountInWords} Pesos Only` : ""}
                readOnly
                disabled
                className="rpfaas-fill-input bg-muted/40 disabled:opacity-100"
              />
            </div>

            {/* Effectivity of Assessment */}
            <div className="space-y-1" data-comment-field="effectivity_of_assessment">
              <Label className="rpfaas-fill-label">Effectivity of Assessment</Label>
              <Select value={effectivityYear} onValueChange={setEffectivityYear}>
                <SelectTrigger className="rpfaas-fill-input">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 10 + i).map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormSection>

          <FormSection title="Assessed / Appraised By">
            <div className="space-y-1" data-comment-field="appraised_by">
              {currentUser && currentUser.role !== "municipal_tax_mapper" ? (
                <Input
                  value={currentUser.full_name}
                  readOnly
                  disabled
                  className="rpfaas-fill-input bg-muted/40 disabled:opacity-100"
                />
              ) : (
                <Select value={appraisedBy} onValueChange={setAppraisedBy} disabled={taxMappersLoading}>
                  <SelectTrigger className="rpfaas-fill-input">
                    <SelectValue placeholder={taxMappersLoading ? "Loading..." : "Select tax mapper"} />
                  </SelectTrigger>
                  <SelectContent>
                    {taxMappers.map((mapper) => (
                      <SelectItem key={mapper.id} value={mapper.id}>{mapper.full_name}</SelectItem>
                    ))}
                    {!taxMappersLoading && taxMappers.length === 0 && (
                      <SelectItem value="__none__" disabled>No tax mappers found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Memoranda */}
            <div className="space-y-1" data-comment-field="memoranda">
              <Label className="rpfaas-fill-label">Memoranda</Label>
              <Textarea
                value={memoranda}
                onChange={(e) => setMemoranda(e.target.value)}
                placeholder="Enter any memoranda or notes..."
                className="rpfaas-fill-input"
                rows={3}
              />
            </div>
          </FormSection>

          <StepPagination
            currentStep={4}
            draftId={draftId}
            isDirty={false}
            onNext={handlePreview}
            nextLabel="Preview"
            isNextLoading={isSaving}
            isNextDisabled={isSaving || isSavingDraft || locked || lockChecking}
            basePath="machinery"
            steps={MACHINERY_STEPS}
          />
        </form>
      </fieldset>
    </FormFillLayout>
  );
}

export default function MachineryStep4Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <MachineryStep4Content />
    </Suspense>
  );
}
