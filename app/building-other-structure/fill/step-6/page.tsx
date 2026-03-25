"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { StepPagination } from "@/components/ui/step-pagination";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { TextArea } from "react-aria-components";

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
    const formatCurrency = (value: number) =>
        value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
const FORM_NAME = "building-structure-form-fill-page-6";
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

function BuildingStructureFormFillPage6() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');

  const [isSaving, setIsSaving] = useState(false);
  const [actualUse, setActualUse] = useState("");
  const [taxStatus, setTaxStatus] = useState<"taxable" | "exempt">("taxable");
  const [memoranda, setMemoranda] = useState("");
  const [typeOfBuildingLabel, setTypeOfBuildingLabel] = useState("");
  const [marketValue, setMarketValue] = useState<number>(0);
  const [effectivityYear, setEffectivityYear] = useState<string>(String(new Date().getFullYear() + 1));
  const [appraisedBy, setAppraisedBy] = useState<string>("");
  const [taxMappers, setTaxMappers] = useState<{ id: string; full_name: string }[]>([]);
  const [taxMappersLoading, setTaxMappersLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; full_name: string; role: string } | null>(null);

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

  // Fetch current user role + name
  useEffect(() => {
    Promise.all([
      fetch('/api/auth/user').then(r => r.json()),
      fetch('/api/users/permissions').then(r => r.json()),
    ]).then(([authData, permsData]) => {
      if (authData.user) {
        setCurrentUser({
          id: authData.user.id,
          full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || '',
          role: permsData.role || '',
        });
      }
    }).catch(() => {});
  }, []);

  // Auto-select self for all roles except base tax_mapper (who may select a different mapper)
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role !== 'tax_mapper' && !appraisedBy) setAppraisedBy(currentUser.id);
  }, [currentUser, appraisedBy]);

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

      // Restore effectivity year and appraised by from localStorage (persisted from a previous visit)
      const savedEffectivity = localStorage.getItem("effectivity_of_assessment_p5");
      if (savedEffectivity) setEffectivityYear(savedEffectivity);

      const savedAppraisedBy = localStorage.getItem("appraised_by_p5");
      if (savedAppraisedBy) setAppraisedBy(savedAppraisedBy);

      const savedMemoranda = localStorage.getItem("memoranda_p5");
      if (savedMemoranda) setMemoranda(savedMemoranda);

      const savedTaxStatus = localStorage.getItem("tax_status_p5");
      if (savedTaxStatus === "taxable" || savedTaxStatus === "exempt") setTaxStatus(savedTaxStatus);
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setActualUse("Residential");
    }
  }, []);

  // Fetch tax mappers based on the property's location municipality
  useEffect(() => {
    setTaxMappersLoading(true);

    // 10-digit PSGC code → DB slug (matches what /api/locations returns)
    const PSGC_TO_SLUG: Record<string, string> = {
      "1404401000": "barlig",
      "1404402000": "bauko",
      "1404403000": "besao",
      "1404404000": "bontoc",
      "1404405000": "natonin",
      "1404406000": "paracellis",
      "1404407000": "sabangan",
      "1404408000": "sadanga",
      "1404409000": "sagada",
      "1404410000": "tadian",
    };
    const DISPLAY_TO_SLUG: Record<string, string> = { paracelis: "paracellis" };

    let municipalityName = "";
    const storedName = localStorage.getItem("rpfaas_location_municipality") || "";
    const storedCode = localStorage.getItem("rpfaas_location_municipality_code") || "";

    if (storedCode && PSGC_TO_SLUG[storedCode]) {
      // Most reliable: resolve directly from 10-digit PSGC code
      municipalityName = PSGC_TO_SLUG[storedCode];
    } else if (storedName) {
      // Fall back to stored display name, normalize to slug
      municipalityName = DISPLAY_TO_SLUG[storedName.toLowerCase()] ?? storedName.toLowerCase();
    }

    const params = new URLSearchParams({ role: "tax_mapper,municipal_tax_mapper" });
    if (municipalityName) params.set("municipality", municipalityName);

    fetch(`/api/users/by-role?${params}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.users)) setTaxMappers(data.users);
      })
      .catch(() => {/* non-fatal */})
      .finally(() => setTaxMappersLoading(false));
  }, []);

  // Load draft data if editing
  useEffect(() => {
    if (!draftId) return;
    const loadDraft = async () => {
      try {
        const response = await fetch(`/api/faas/building-structures/${draftId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            if (data.actual_use) setActualUse(data.actual_use);
            if (data.effectivity_of_assessment != null) setEffectivityYear(String(data.effectivity_of_assessment));
            if (data.appraised_by) setAppraisedBy(data.appraised_by);
            if (data.memoranda) setMemoranda(data.memoranda);
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

  const handleSubmit = useCallback((e: { preventDefault: () => void }) => {
    e.preventDefault();
    router.push("/building-other-structure");
  }, [router]);

  const handlePreview = useCallback(async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData(actualUse, assessedValue, amountInWords, assessmentLevel);
      formData.status = 'draft';
      if (effectivityYear) {
        formData.effectivity_of_assessment = parseInt(effectivityYear);
        localStorage.setItem("effectivity_of_assessment_p5", effectivityYear);
      }
      if (appraisedBy) {
        formData.appraised_by = appraisedBy;
        localStorage.setItem("appraised_by_p5", appraisedBy);
      }

      if (memoranda) {
        formData.memoranda = memoranda;
        localStorage.setItem("memoranda_p5", memoranda);
      } else {
        localStorage.removeItem("memoranda_p5");
      }

      // Save assessment data to localStorage for the RPFAAS form
      localStorage.setItem("assessment_level_p5", assessmentLevel);
      localStorage.setItem("estimated_value_p5", assessedValue.toString());
      localStorage.setItem("actual_use_p5", actualUse);
      localStorage.setItem("tax_status_p5", taxStatus);
      formData.tax_status = taxStatus;

      console.log('Saving Step 5 form data to Supabase:', formData);

      let response;
      const currentDraftId = draftId || localStorage.getItem('draft_id');

      if (currentDraftId) {
        response = await fetch(`/api/faas/building-structures/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/faas/building-structures', {
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
        const raw = await response.text();
        console.error('Save error — status:', response.status, 'body:', raw);
        let message = 'Unknown error';
        try { message = JSON.parse(raw)?.message || raw || message; } catch { message = raw || message; }
        toast.error(`Failed to save (${response.status}): ` + message);
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [actualUse, assessedValue, amountInWords, assessmentLevel, draftId, router, effectivityYear, appraisedBy, memoranda]);

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

            <form id={`form_${FORM_NAME}`} data-form-name={FORM_NAME} onSubmit={handleSubmit} className="rpfaas-fill-form rpfaas-fill-form-single space-y-6 px-4 py-6">
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Property Assessment</h2>

                <div className="rpfaas-fill-field space-y-1" data-comment-field="actual_use">
                  <Label className="rpfaas-fill-label" htmlFor="actual_use_p5">Actual Use</Label>
                  <Input 
                    id="actual_use_p5"
                    name="actual_use_p5"
                    value={actualUse}
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white text-black disabled:opacity-100"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-2">
                  <Label className="rpfaas-fill-label">Tax Status</Label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tax_status"
                        value="taxable"
                        checked={taxStatus === "taxable"}
                        onChange={() => setTaxStatus("taxable")}
                        className="w-4 h-4"
                      />
                      <span>Taxable</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tax_status"
                        value="exempt"
                        checked={taxStatus === "exempt"}
                        onChange={() => setTaxStatus("exempt")}
                        className="w-4 h-4"
                      />
                      <span>Exempt</span>
                    </label>
                  </div>
                </div>

                <div className="rpfaas-fill-field space-y-1" data-comment-field="market_value">
                  <Label className="rpfaas-fill-label" htmlFor="market_value_p5">Market Value</Label>
                  <Input
                    id="market_value_p5"
                    name="market_value_p5"
                    value={marketValue > 0 ? `₱${formatCurrency(marketValue)}` : ""}
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
                    name="assessment_level_p5"
                    value={assessmentLevel}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white text-black disabled:opacity-100"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-1" data-comment-field="assessed_value">
                  <Label className="rpfaas-fill-label" htmlFor="estimated_value_p5">Assessed Value</Label>
                  <Input
                    id="estimated_value_p5"
                    name="estimated_value_p5"
                    type="text"
                    value={assessedValue > 0 ? `₱${formatNumberWithCommas(assessedValue)}` : ""}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white text-black disabled:opacity-100"
                  />
                </div>

                <div className="rpfaas-fill-field space-y-1" data-comment-field="amount_in_words">
                  <Label className="rpfaas-fill-label" htmlFor="amount_in_words_p5">Amount in Words:</Label>
                  <Input
                    id="amount_in_words_p5"
                    name="amount_in_words_p5"
                    value={amountInWords ? `${amountInWords} Pesos Only` : ''}
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white text-black disabled:opacity-100"
                  />
                </div>
                <div className="rpfaas-fill-field space-y-1" data-comment-field="effectivity_of_assessment">
                  <Label className="rpfaas-fill-label" htmlFor="effectivity_of_assessment_p5">Effectivity of Assessment</Label>
                  <Select value={effectivityYear} onValueChange={setEffectivityYear}>
                    <SelectTrigger id="effectivity_of_assessment_p5" className="rpfaas-fill-input">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 10 + i).map((year) => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>
              <section className="rpfaas-fill-section">
                <div className="rpfaas-fill-field space-y-1" data-comment-field="appraised_by">
                  <Label className="rpfaas-fill-label" htmlFor="appraised_by_p5">Assessed/Appraised by:</Label>
                  {currentUser && currentUser.role !== 'tax_mapper' ? (
                    <Input
                      id="appraised_by_p5"
                      value={currentUser.full_name}
                      readOnly
                      disabled
                      aria-disabled="true"
                      className="rpfaas-fill-input bg-white text-black disabled:opacity-100"
                    />
                  ) : (
                    <Select value={appraisedBy} onValueChange={setAppraisedBy} disabled={taxMappersLoading}>
                      <SelectTrigger id="appraised_by_p5" className="rpfaas-fill-input">
                        <SelectValue placeholder={taxMappersLoading ? "Loading..." : "Select tax mapper"} />
                      </SelectTrigger>
                      <SelectContent>
                        {taxMappers.map((mapper) => (
                          <SelectItem key={mapper.id} value={mapper.id}>
                            {mapper.full_name}
                          </SelectItem>
                        ))}
                        {!taxMappersLoading && taxMappers.length === 0 && (
                          <SelectItem value="__none__" disabled>No tax mappers found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="rpfaas-fill-field space-y-1 mt-4" data-comment-field="memoranda">
                  <Label className="rpfaas-fill-label" htmlFor="memoranda_p5">Memoranda</Label>
                  <TextArea
                    id="memoranda_p5"
                    name="memoranda_p5"
                    value={memoranda}
                    onChange={(e) => setMemoranda(e.target.value)}
                    placeholder="Enter memoranda notes..."
                    className="rpfaas-fill-input"
                    rows={3}
                  />
                </div>
              </section>

              <StepPagination
                currentStep={6}
                draftId={draftId}
                isDirty={false}
                onNext={handlePreview}
                nextLabel="Preview"
                isNextLoading={isSaving}
                isNextDisabled={isSaving}
              />
            </form>
          </div>
        </div>
      </SidebarInset>
      <ReviewCommentsFloat draftId={draftId} />
    </SidebarProvider>
  );
}

export default function BuildingStructureFormFillPage6Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuildingStructureFormFillPage6 />
    </Suspense>
  );
}