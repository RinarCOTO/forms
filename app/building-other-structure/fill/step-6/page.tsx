"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect, useMemo, useCallback, Suspense } from "react";
import "@/app/styles/forms-fill.css";
import { getAssessmentLevel } from "@/config/assessment-level";
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

// Helper function to collect form data from ONLY this step (step 5)
function collectFormData(
  actualUse: string,
  assessedValue: number,
  amountInWords: string,
  assessmentLevel: string
) {
  const data: any = {};

  if (actualUse) data.actual_use = actualUse;
  if (assessedValue) data.estimated_value = assessedValue.toString();
  if (amountInWords) data.amount_in_words = amountInWords;
  // Strip "%" and save as a number (e.g. "5%" → 5)
  if (assessmentLevel) data.assessment_level = parseFloat(assessmentLevel);

  return data;
}

const FORM_NAME = "building-structure-form-fill-page-5";
const PAGE_DESCRIPTION = "Final notes and summary of the property assessment.";

// Pure helper at module scope — no state/props, never recreated on render
function formatNumberWithCommas(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to convert number to words
function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const thousands = ["", "Thousand", "Million", "Billion"];

  function convertHundreds(n: number): string {
    let result = "";

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }

    if (n >= 10 && n < 20) {
      result += teens[n - 10] + " ";
    } else {
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      }
      if (n > 0) {
        result += ones[n] + " ";
      }
    }

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

function BuildingStructureFormFillPage5() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');

  const [isSaving, setIsSaving] = useState(false);
  const [actualUse, setActualUse] = useState("");
  const [typeOfBuildingLabel, setTypeOfBuildingLabel] = useState("");
  const [marketValue, setMarketValue] = useState<number>(0);

  const assessmentLevel = useMemo(
    () => getAssessmentLevel(typeOfBuildingLabel, actualUse, marketValue) ?? "",
    [typeOfBuildingLabel, actualUse, marketValue]
  );

  // Auto-compute assessed value: Market Value × Assessment Level, rounded to nearest 10
  const assessedValue = useMemo(() => {
    if (!marketValue || !assessmentLevel) return 0;
    const levelPercent = parseFloat(assessmentLevel) / 100;
    const raw = marketValue * levelPercent;
    return Math.round(raw / 10) * 10;
  }, [marketValue, assessmentLevel]);

  // Auto-derive amount in words from assessedValue
  const amountInWords = useMemo(() => {
    return assessedValue > 0 ? numberToWords(assessedValue) : "";
  }, [assessedValue]);

  // Load the type of building from localStorage
  useEffect(() => {
    try {
      const typeOfBuilding = localStorage.getItem("type_of_building_p2") || "";
      setTypeOfBuildingLabel(typeOfBuilding);
      // Capitalize first letter for display
      const formattedType = typeOfBuilding.charAt(0).toUpperCase() + typeOfBuilding.slice(1);
      setActualUse(formattedType || "Residential");

      const savedMarketValue = parseFloat(localStorage.getItem("market_value_p4") || "0");
      setMarketValue(savedMarketValue);
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setActualUse("Residential");
    }
  }, []);

  // Load draft data if editing
  useEffect(() => {
    if (!draftId) return;
    const loadDraft = async () => {
      try {
        const response = await fetch(`/api/building-structure/${draftId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            if (data.actual_use) setActualUse(data.actual_use);
            Object.entries(data).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                localStorage.setItem(`${key}_p5`, String(value));
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to load draft data for step 5', error);
      }
    };
    loadDraft();
  }, [draftId]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    router.push("/building-other-structure");
  }, [router]);

  const handlePreview = useCallback(async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData(actualUse, assessedValue, amountInWords, assessmentLevel);
      formData.status = 'draft';

      // Save assessment data to localStorage for the RPFAAS form
      localStorage.setItem("assessment_level_p5", assessmentLevel);
      localStorage.setItem("assessed_value_p5", assessedValue.toString());
      localStorage.setItem("actual_use_p5", actualUse);

      console.log('Saving Step 5 form data to Supabase:', formData);

      let response;
      const currentDraftId = draftId || localStorage.getItem('draft_id');

      if (currentDraftId) {
        response = await fetch(`/api/building-structure/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/building-structure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Save result:', result);
        if (result.data?.id) {
          localStorage.setItem('draft_id', result.data.id.toString());
          router.push(`/building-other-structure/fill/preview-form?id=${result.data.id}`);
        }
      } else {
        const error = await response.json();
        console.error('Save error:', error);
        alert('Failed to save: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [actualUse, assessedValue, amountInWords, assessmentLevel, draftId, router]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/building-other-structure">Building & Other Structures</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{PAGE_DESCRIPTION}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-3xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Fill-up Form: Property Assessment</h1>
                <p className="text-sm text-muted-foreground">{PAGE_DESCRIPTION}</p>
              </div>
            </header>

            <form id={`form_${FORM_NAME}`} data-form-name={FORM_NAME} onSubmit={handleSubmit} className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Property Assessment</h2>

                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="actual_use_p5">Actual Use</Label>
                  <Input
                    id="actual_use_p5"
                    name="actual_use_p5"
                    value={actualUse}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="market_value_p5">Market Value</Label>
                  <Input
                    id="market_value_p5"
                    name="market_value_p5"
                    value={marketValue > 0 ? `₱${formatNumberWithCommas(marketValue)}` : ""}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="assessment_level_p5">Assessment Level</Label>
                  <Input
                    id="assessment_level_p5"
                    name="assessment_level_p5"
                    value={assessmentLevel}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="estimated_value_p5">Assessed Value</Label>
                  <Input
                    id="estimated_value_p5"
                    name="estimated_value_p5"
                    type="text"
                    value={assessedValue > 0 ? `₱${formatNumberWithCommas(assessedValue)}` : ""}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="amount_in_words_p5">Amount in Words:</Label>
                  <Input
                    id="amount_in_words_p5"
                    name="amount_in_words_p5"
                    value={amountInWords}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white"
                  />
                </div>
              </section>

              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                <div className="rpfaas-fill-actions flex gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/building-other-structure/fill/step-5${draftId ? `?id=${draftId}` : ''}`)}
                      className="rpfaas-fill-button rpfaas-fill-button-secondary"
                    >
                      Previous
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handlePreview}
                      disabled={isSaving}
                      className="rpfaas-fill-button rpfaas-fill-button-primary"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Preview'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function BuildingStructureFormFillPage6Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuildingStructureFormFillPage5 />
    </Suspense>
  );
}