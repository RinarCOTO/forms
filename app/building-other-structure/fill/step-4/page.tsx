"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
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

import { SelectOption } from "@/components/dynamicSelectButton";
import { DeductionsTable } from "./deductionsTable";
import { AdditionalTable } from "./additionalTable";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { FORM_CONSTANTS } from "@/config/form-options";
import { useFormData } from "@/hooks/useFormData";

const FormSchema = z.object({
  deductions: z.array(z.string()).min(1, {
    message: "Please select at least one deduction.",
  }),
});

const deductionChoices: SelectOption[] = [
  { id: "no_plumbing", name: "No Plumbing", percentage: 3 },
  { id: "no_electrical", name: "No Electrical", percentage: 3 },
  { id: "no_paint", name: "No Paint", percentage: 6 },
  { id: "no_ceiling", name: "No Ceiling", percentage: 7 },
  { id: "no_partition", name: "No Partition", percentage: 5 },
  { id: "no_cement_plaster_inside", name: "No Cement Plaster Inside", percentage: 3 },
  { id: "no_cement_plaster_outside", name: "No Cement Plaster Outside", percentage: 3 },
  { id: "second_hand_material_used", name: "Second Hand Material Used", percentage: 10 },
];

const additionalPercentChoices: SelectOption[] = [
  { id: "carport", name: "Carport", percentage: 70 },
  { id: "mezzanine", name: "Mezzanine", percentage: 60 },
  { id: "porch", name: "Porch", percentage: 40 },
  { id: "balcony", name: "Balcony", percentage: 45 },
  { id: "garage", name: "Garage", percentage: 45 },
  { id: "terrace_covered", name: "Terrace (Covered)", percentage: 35 },
  { id: "terrace_open", name: "Terrace (Open)", percentage: 20 },
  { id: "roof_deck_open", name: "Roof Deck (Open)", percentage: 20 },
  { id: "roof_deck_covered", name: "Roof Deck (Covered - No Sidings)", percentage: 30 },
  { id: "basement_residential", name: "Basement (Residential)", percentage: 60 },
  { id: "basement_high_rise", name: "Basement (High Rise Building Plus)", percentage: 20 },
]

const additionalFlatRateChoices: SelectOption[] = [
  { id: "pavement_tennis_court", name: "Pavement: Tennis Court", pricePerSqm: 450 },
  { id: "pavement_concrete_10cm", name: "Concrete Pavement (10cm thick)", pricePerSqm: 450 },
  { id: "pavement_concrete_15cm", name: "Concrete Pavement (15cm thick)", pricePerSqm: 600 },
  { id: "pavement_concrete_20cm", name: "Concrete Pavement (20cm thick)", pricePerSqm: 700 },
  { id: "floor_marble_tiles", name: "Floor: Marble Tiles", pricePerSqm: 500 },
  { id: "floor_narra", name: "Floor: Narra", pricePerSqm: 400 },
  { id: "floor_fancy_wood", name: "Floor: Fancy Wood Tiles", pricePerSqm: 300 },
  { id: "floor_ordinary_wood", name: "Floor: Ordinary Wood Tiles", pricePerSqm: 200 },
  { id: "floor_washout_pebbles", name: "Floor: Washout Pebbles", pricePerSqm: 200 },
  { id: "floor_granite", name: "Floor: Granite", pricePerSqm: 600 },
  { id: "floor_crazy_cut_marble", name: "Floor: Crazy Cut Marble", pricePerSqm: 400 },
  { id: "floor_vinyl_tiles", name: "Floor: Vinyl Tiles", pricePerSqm: 100 },
]

const BuildingStructureFormFillPage4 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  const [isSaving, setIsSaving] = useState(false);
  const [selections, setSelections] = useState<(string | number | null)[]>(() => [null]);
  const [additionalPercentSelections, setAdditionalPercentSelections] = useState<(string | number | null)[]>(() => [null]);
  const [additionalFlatRateSelections, setAdditionalFlatRateSelections] = useState<(string | number | null)[]>(() => [null]);
  const [comments, setComments] = useState<string>(""); // State for comments
  const [unitCost, setUnitCost] = useState<number>(0);

  const { data: loadedData } = useFormData<any>("building-structure", draftId || "");

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { deductions: [] },
  });

  // Load Cost and Draft Data
  useEffect(() => {
    // 1. Load Unit Cost
    const savedCost = localStorage.getItem("unit_cost_p2");
    const dbCost = loadedData?.cost_of_construction;

    if (savedCost) {
      setUnitCost(parseFloat(savedCost));
    } else if (dbCost) {
      setUnitCost(parseFloat(dbCost));
    }

    // 2. Load Comments
    if (loadedData?.overall_comments) {
      setComments(loadedData.overall_comments);
    }

    // 3. Load Selections (Check both 'selected_deductions' from API and legacy 'deductions')
    const dbDeductions = loadedData?.selected_deductions || loadedData?.deductions;

    if (dbDeductions) {
      const savedDeductions = Array.isArray(dbDeductions)
        ? dbDeductions
        : typeof dbDeductions === "string"
        ? dbDeductions.split(",")
        : [];

      if (savedDeductions.length > 0) {
        const recoveredSelections = savedDeductions
          .map((d: string) => {
            const match = deductionChoices.find((c) => c.id === d || c.name === d);
            return match ? match.id : null;
          })
          .filter(Boolean);

        setSelections(recoveredSelections);

        const validNames = recoveredSelections
          .map((id: string) => deductionChoices.find((c) => String(c.id) === String(id))?.name)
          .filter(Boolean);
        form.setValue("deductions", validNames as string[]);
      }
    }
  }, [loadedData, form]);

  const handleSelectionChange = (newValues: (string | number | null)[]) => {
    setSelections([...newValues]);
    const validNames = newValues
      .map((val) => deductionChoices.find((c) => String(c.id) === String(val))?.name)
      .filter((v): v is string => !!v);

    form.setValue("deductions", validNames);
  };

  const handleNext = async (data: any) => {
    setIsSaving(true);
    try {
      // Internal calculation for totals to send to API
      const totalPercentage = selections.reduce((acc, curr) => {
        const option = deductionChoices.find((c) => String(c.id) === String(curr));
        return acc + (option?.percentage || 0);
      }, 0);

      const totalDeductionAmount = (unitCost * totalPercentage) / 100;
      const netUnitCost = unitCost - totalDeductionAmount;

      // Construct Payload based on your API's PUT handler keys
      const formData = {
        status: "draft",
        selected_deductions: selections.filter(Boolean), // Matches API key: dbData.selected_deductions
        overall_comments: comments, // Matches API key: dbData.overall_comments
        total_deduction_percentage: totalPercentage, // Matches API key
        total_deduction_amount: totalDeductionAmount, // Matches API key
        net_unit_construction_cost: netUnitCost, // Matches API key
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

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Fill-up Form: General Description</h1>
              <p className="text-sm text-muted-foreground">Manage structure deductions and percentages.</p>
            </header>

            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-8">
              
              <DeductionsTable
                unitCost={unitCost}
                selections={selections}
                onSelectionChange={handleSelectionChange}
                deductionChoices={deductionChoices}
                comments={comments} // Pass state
                onCommentsChange={setComments} // Pass handler
                error={form.formState.errors.deductions?.message as string}
              />
              <AdditionalTable
                label="Additional Percent Deviations"
                unitCost={unitCost}
                values={additionalPercentSelections}
                onChange={setAdditionalPercentSelections}
                options={additionalPercentChoices}
              />
              <AdditionalTable
                label="Additional Flat Rate Deviations"
                unitCost={unitCost}
                values={additionalFlatRateSelections}
                onChange={setAdditionalFlatRateSelections}
                options={additionalFlatRateChoices}
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