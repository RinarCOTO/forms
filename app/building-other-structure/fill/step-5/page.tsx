"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
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

// Helper function to collect form data from ONLY this step (step 5)
function collectFormData(
  actualUse: string,
  estimatedValue: number,
  amountInWords: string
) {
  const data: any = {};
  
  // Save assessment data
  if (actualUse) data.actual_use = actualUse;
  if (estimatedValue) data.estimated_value = estimatedValue.toString();
  if (amountInWords) data.amount_in_words = amountInWords;
  
  // Note: If you have market_value and assessment_level fields in the form,
  // add them as parameters and map them here
  
  return data;
}

const FORM_NAME = "building-structure-form-fill-page-5";
const PAGE_DESCRIPTION = "Final notes and summary of the property assessment.";

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

export default function BuildingStructureFormFillPage5() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');
  
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [actualUse, setActualUse] = useState("");
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [estimatedValueDisplay, setEstimatedValueDisplay] = useState("");
  const [amountInWords, setAmountInWords] = useState("");

  // Format number with commas
  const formatNumberWithCommas = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Remove commas from string
  const removeCommas = (str: string): string => {
    return str.replace(/,/g, "");
  };

  // Load the type of building from localStorage
  useEffect(() => {
    try {
      const typeOfBuilding = localStorage.getItem("type_of_building_p2") || "";
      // Capitalize first letter for display
      const formattedType = typeOfBuilding.charAt(0).toUpperCase() + typeOfBuilding.slice(1);
      setActualUse(formattedType || "Residential");

      // Load estimated value and convert to words
      const savedEstimatedValue = localStorage.getItem("estimated_value_p5") || "0";
      const value = parseFloat(savedEstimatedValue) || 0;
      setEstimatedValue(value);
      setEstimatedValueDisplay(value > 0 ? formatNumberWithCommas(value) : "");
      
      if (value > 0) {
        setAmountInWords(numberToWords(value));
      } else {
        setAmountInWords("");
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setActualUse("Residential");
      setEstimatedValue(0);
      setEstimatedValueDisplay("");
      setAmountInWords("");
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
            // Populate form fields
            if (data.actual_use) setActualUse(data.actual_use);
            if (data.estimated_value) setEstimatedValue(Number(data.estimated_value));
            if (data.amount_in_words) setAmountInWords(data.amount_in_words);
            // Save to localStorage for consistency with other steps
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // For now, go back to main list after submit
    router.push("/building-other-structure");
  };

  const handlePreview = async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData(actualUse, estimatedValue, amountInWords);
      formData.status = 'draft';
      
      console.log('Saving Step 5 form data to Supabase:', formData);
      
      let response;
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      
      if (currentDraftId) {
        // Update existing draft
        response = await fetch(`/api/building-structure/${currentDraftId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new draft
        response = await fetch('/api/building-structure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Save result:', result);
        // Store the draft ID for future updates
        if (result.data?.id) {
          localStorage.setItem('draft_id', result.data.id.toString());
          const savedDraftId = result.data.id;
          // Navigate to preview with the draft ID
          router.push(`/building-other-structure/fill/preview-form?id=${savedDraftId}`);
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
  };

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
                <p className="text-sm text-muted-foreground">
                  {PAGE_DESCRIPTION}
                </p>
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
                    value="number"
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
                    value="number"
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input bg-white"
                  />
                </div>
                <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label" htmlFor="estimated_value_p5">Estimated Value</Label>
                    <Input
                    id="estimated_value_p5"
                    name="estimated_value_p5"
                    type="text"
                    value={estimatedValueDisplay}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const numericValue = removeCommas(inputValue);
                      
                      // Only allow numbers
                      if (/^\d*$/.test(numericValue)) {
                        const value = parseFloat(numericValue) || 0;
                        setEstimatedValue(value);
                        setEstimatedValueDisplay(numericValue ? formatNumberWithCommas(value) : "");
                        
                        if (value > 0) {
                          setAmountInWords(numberToWords(value));
                        } else {
                          setAmountInWords("");
                        }
                        localStorage.setItem("estimated_value_p5", value.toString());
                      }
                    }}
                    className="rpfaas-fill-input bg-white"
                    placeholder="0"
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
                    <Button type="button" variant="outline" onClick={() => router.push(`/building-other-structure/fill/step-4${draftId ? `?id=${draftId}` : ''}`)} className="rpfaas-fill-button rpfaas-fill-button-secondary">Previous</Button>
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
