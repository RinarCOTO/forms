"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import "@/app/styles/forms-fill.css";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/sidebar"

import { DynamicSelectGroup, SelectOption } from "@/components/dynamicSelectButton";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { FORM_CONSTANTS } from "@/config/form-options";
import { useFormData } from "@/hooks/useFormData"; // Assuming you have this hook

const FormSchema = z.object({
  deductions: z.array(z.string()).min(1, {
    message: "Please select at least one deduction.",
  }),
});

const BuildingStructureFormFillPage4 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  const [isSaving, setIsSaving] = useState(false);
  const [selections, setSelections] = useState<(string | number | null)[]>(() => [null]);
  const [unitCost, setUnitCost] = useState<number>(0);

  // Load existing data if editing a draft
  const { data: loadedData } = useFormData<any>("building-structure", draftId || "");

  const deductionChoices: SelectOption[] = [
    { id: 'no_plumbing', name: 'No Plumbing', percentage: 3 },
    { id: 'no_electrical', name: 'No Electrical', percentage: 3 },
    { id: 'no_paint', name: 'No Paint', percentage: 6 },
    { id: 'no_ceiling', name: 'No Ceiling', percentage: 7 },
    { id: 'no_partition', name: 'No Partition', percentage: 5 },
    { id: 'no_cement_plaster_inside', name: 'No Cement Plaster Inside', percentage: 3 },
    { id: 'no_cement_plaster_outside', name: 'No Cement Plaster Outside', percentage: 3 },
    { id: 'second_hand_material_used', name: 'Second Hand Material Used', percentage: 10 },
  ];

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { deductions: [] },
  });

  // --- 1. Load Unit Cost and Draft Data ---
  useEffect(() => {
    // A. Retrieve Unit Cost (Priority: LocalStorage -> DB -> 0)
    const savedCost = localStorage.getItem('unit_cost_p2');
    const dbCost = loadedData?.cost_of_construction;

    if (savedCost) {
      setUnitCost(parseFloat(savedCost));
    } else if (dbCost) {
      setUnitCost(parseFloat(dbCost));
    }

    // B. Load Saved Deductions (if editing)
    if (loadedData?.deductions) {
      // Assuming db saves array of strings: ['no_plumbing', 'no_paint']
      // Or if saved as comma-separated string, add .split(',') logic
      const savedDeductions = Array.isArray(loadedData.deductions) 
        ? loadedData.deductions 
        : typeof loadedData.deductions === 'string' 
          ? loadedData.deductions.split(',') 
          : []; // Adjust based on how your DB saves it
      
      if (savedDeductions.length > 0) {
        // Map saved IDs back to SelectOption format
        const recoveredSelections = savedDeductions.map((d: string) => {
             // If d is the name, find ID. If d is ID, use it directly.
             const match = deductionChoices.find(c => c.id === d || c.name === d);
             return match ? match.id : null;
        }).filter(Boolean);

        setSelections(recoveredSelections);
        
        // Update form validation
        const validNames = recoveredSelections.map((id: string) => 
            deductionChoices.find(c => String(c.id) === String(id))?.name
        ).filter(Boolean);
        form.setValue("deductions", validNames);
      }
    }
  }, [loadedData]);

  const handleSelectionChange = (newValues: (string | number | null)[]) => {
    setSelections([...newValues]);
    const validNames = newValues
      .map(val => deductionChoices.find(c => String(c.id) === String(val))?.name)
      .filter((v): v is string => !!v);
    
    form.setValue("deductions", validNames);
  };

  // --- 2. Calculate Totals ---
  const totalPercentage = selections.reduce((acc, curr) => {
    const option = deductionChoices.find(c => String(c.id) === String(curr));
    return acc + (option?.percentage || 0);
  }, 0);

  const totalDeductionValue = (unitCost * totalPercentage) / 100;
  const netUnitCost = unitCost - totalDeductionValue;

  const handleNext = async (data: any) => {
    setIsSaving(true);
    try {
      const formData = {
        status: 'draft',
        deductions: selections.filter(Boolean), // Save IDs: ['no_plumbing', ...]
        total_deduction_percentage: totalPercentage,
        net_unit_construction_cost: netUnitCost // Optional: save the computed net cost
      };
      
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      const method = currentDraftId ? 'PUT' : 'POST';
      const url = currentDraftId 
        ? `${FORM_CONSTANTS.API_ENDPOINTS.BUILDING_STRUCTURE}/${currentDraftId}`
        : FORM_CONSTANTS.API_ENDPOINTS.BUILDING_STRUCTURE;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) {
          localStorage.setItem('draft_id', result.data.id.toString());
          router.push(`/building-other-structure/fill/step-5?id=${result.data.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
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
              <BreadcrumbItem><BreadcrumbPage>Additional Structure Details</BreadcrumbPage></BreadcrumbItem>
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
              <section className="bg-card rounded-lg border p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-base font-semibold block">DEDUCTIONS TABLE</Label>
                  <div className="text-sm text-muted-foreground">
                    Base Unit Cost: <span className="font-mono font-medium text-foreground">₱{unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                
                {form.formState.errors.deductions && (
                  <p className="text-destructive text-sm mb-2">{form.formState.errors.deductions.message as string}</p>
                )}

                <div className="space-y-4">
                  {/* Pass unitCost to the component */}
                  <DynamicSelectGroup 
                    label="Deduction"
                    options={deductionChoices}
                    values={selections}
                    onChange={handleSelectionChange}
                    unitCost={unitCost} 
                  />

                  {/* Supplemental information row (Comments/Totals) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="space-y-2">
                      <Label>Overall Comments</Label>
                      <textarea 
                        className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Add any additional notes here..."
                      />
                    </div>
                    
                    {/* Summary Calculation Box */}
                    <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-md border">
                       <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total Deduction %:</span>
                        <span className="font-bold">{totalPercentage}%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total Deduction Value:</span>
                        <span className="font-bold text-destructive">- ₱{totalDeductionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <Separator className="my-2"/>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">Cost of Deduction:</span>
                        <span className="text-xl font-bold text-primary">
                          ₱{netUnitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/building-other-structure/fill/step-3${draftId ? `?id=${draftId}` : ''}`)}
                >
                  Previous
                </Button>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Next'}
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