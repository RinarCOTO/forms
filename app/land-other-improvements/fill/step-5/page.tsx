"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { StepPagination, LAND_IMPROVEMENT_STEPS } from "@/components/ui/step-pagination";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
import DatePicker from "../../../components/dropdowns/date-picker";
import "@/app/styles/forms-fill.css";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_ENDPOINT = "/api/faas/land-improvements";

// Assessment level lookup for land improvements
function getLandAssessmentLevel(classification: string): string {
  switch (classification.toLowerCase()) {
    case "residential":   return "20%";
    case "agricultural":  return "40%";
    case "commercial":    return "50%";
    case "industrial":    return "50%";
    case "mineral":       return "50%";
    case "timberland":    return "20%";
    default:              return "";
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

  let word = "";
  let scale = 0;
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      const chunkWord = convertHundreds(chunk);
      word = chunkWord + (thousands[scale] ? " " + thousands[scale] : "") + (word ? " " + word : "");
    }
    num = Math.floor(num / 1000);
    scale++;
  }
  return word.trim();
}

function formatWithCommas(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function LandImprovementsFormFillPage5() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  const [isSaving, setIsSaving] = useState(false);
  const [classification, setClassification] = useState("");
  const [marketValue, setMarketValue] = useState<number>(0);
  const [effectivityDate, setEffectivityDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const assessmentLevel = useMemo(
    () => getLandAssessmentLevel(classification),
    [classification]
  );

  const assessedValue = useMemo(() => {
    if (!marketValue || !assessmentLevel) return 0;
    const levelPercent = parseFloat(assessmentLevel) / 100;
    const raw = marketValue * levelPercent;
    return Math.round(raw / 10) * 10;
  }, [marketValue, assessmentLevel]);

  const amountInWords = useMemo(
    () => (assessedValue > 0 ? numberToWords(assessedValue) : ""),
    [assessedValue]
  );

  // Load from localStorage (saved by previous steps)
  useEffect(() => {
    try {
      const savedMarketValue = parseFloat(localStorage.getItem("land_market_value_p4") || "0");
      if (savedMarketValue) setMarketValue(savedMarketValue);
    } catch {
      // ignore
    }
  }, []);

  // Load draft data if editing
  useEffect(() => {
    if (!draftId) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_ENDPOINT}/${draftId}`);
        if (!res.ok) return;
        const result = await res.json();
        if (!result.success || !result.data) return;
        const data = result.data;
        if (data.classification) setClassification(data.classification);
        if (data.market_value) setMarketValue(parseFloat(data.market_value));
      } catch {
        // ignore
      }
    };
    load();
  }, [draftId]);

  const handlePreview = useCallback(async () => {
    setIsSaving(true);
    try {
      const formData: Record<string, unknown> = {
        status: "draft",
        actual_use: classification,
        market_value: marketValue,
        assessment_level: parseFloat(assessmentLevel) || 0,
        estimated_value: assessedValue,
        amount_in_words: amountInWords,
      };

      if (effectivityDate) {
        formData.effectivity_of_assessment = effectivityDate;
      }

      // Save to localStorage for preview
      localStorage.setItem("land_assessment_level_p5", assessmentLevel);
      localStorage.setItem("land_assessed_value_p5", assessedValue.toString());
      localStorage.setItem("land_actual_use_p5", classification);

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
          localStorage.setItem("land_draft_id", result.data.id.toString());
          router.push(`/land-other-improvements/fill/preview-form?id=${result.data.id}`);
        }
      } else {
        toast.error("Failed to save assessment.");
      }
    } catch {
      toast.error("Error saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [classification, marketValue, assessmentLevel, assessedValue, amountInWords, effectivityDate, draftId, router]);

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
                <BreadcrumbPage>Property Assessment</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-3xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Fill-up Form: Property Assessment</h1>
                <p className="text-sm text-muted-foreground">Final summary of the land improvement assessment.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={isSaving}
                className="shrink-0"
              >
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Draft"}
              </Button>
            </header>

            <form className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Property Assessment</h2>

                <div className="rpfaas-fill-field space-y-1" data-comment-field="actual_use">
                  <Label className="rpfaas-fill-label" htmlFor="actual_use_p5">Actual Use</Label>
                  <Input
                    id="actual_use_p5"
                    value={classification ? classification.charAt(0).toUpperCase() + classification.slice(1) : ""}
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white text-black disabled:opacity-100"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-1" data-comment-field="market_value">
                  <Label className="rpfaas-fill-label" htmlFor="market_value_p5">Market Value</Label>
                  <Input
                    id="market_value_p5"
                    value={marketValue > 0 ? `₱${formatWithCommas(marketValue)}` : ""}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white text-black disabled:opacity-100"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-1" data-comment-field="assessment_level">
                  <Label className="rpfaas-fill-label" htmlFor="assessment_level_p5">Assessment Level</Label>
                  <Input
                    id="assessment_level_p5"
                    value={assessmentLevel}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white text-black disabled:opacity-100"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-1" data-comment-field="assessed_value">
                  <Label className="rpfaas-fill-label" htmlFor="assessed_value_p5">Assessed Value</Label>
                  <Input
                    id="assessed_value_p5"
                    value={assessedValue > 0 ? `${formatWithCommas(assessedValue)}` : ""}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white text-black disabled:opacity-100"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-1" data-comment-field="amount_in_words">
                  <Label className="rpfaas-fill-label" htmlFor="amount_in_words_p5">Amount in Words</Label>
                  <Input
                    id="amount_in_words_p5"
                    value={amountInWords ? `${amountInWords} Pesos Only` : ""}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white text-black disabled:opacity-100"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-1" data-comment-field="effectivity_of_assessment">
                  <Label className="rpfaas-fill-label" htmlFor="effectivity_of_assessment_p5">Effectivity of Assessment</Label>
                  <DatePicker value={effectivityDate} onChange={setEffectivityDate} />
                </div>
              </section>

              <StepPagination
                currentStep={5}
                draftId={draftId}
                isDirty={false}
                onNext={handlePreview}
                nextLabel="Preview"
                isNextLoading={isSaving}
                isNextDisabled={isSaving}
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
}

export default function LandImprovementsFormFillPage5Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandImprovementsFormFillPage5 />
    </Suspense>
  );
}
