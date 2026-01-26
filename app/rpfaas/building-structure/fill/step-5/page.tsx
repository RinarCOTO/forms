"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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

const FORM_NAME = "building-structure-form-fill-page-5";

export default function BuildingStructureFormFillPage5() {
  const router = useRouter();
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // For now, go back to main list after submit
    router.push("/rpfaas/building-structure/view");
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
                <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Final Notes</BreadcrumbPage>
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
                  Final notes and summary of the property assessment.
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
                    value="Residential"
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input"
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
                    className="rpfaas-fill-input"
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
                    className="rpfaas-fill-input"
                  />
                </div>
                <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label" htmlFor="estimated_value_p5">Estimated Value</Label>
                    <Input
                    id="estimated_value_p5"
                    name="estimated_value_p5"
                    value="number"
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input"
                  />
                </div>
                <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label" htmlFor="amount_in_words_p5">Amount in Words:</Label>
                    <Input
                    id="amount_in_words_p5"
                    name="amount_in_words_p5"
                    value="text"
                    readOnly
                    disabled
                    aria-disabled="true"
                    className="rpfaas-fill-input"
                  />
                </div>
              </section>

              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                <div className="rpfaas-fill-actions flex gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => router.push("/rpfaas/building-structure/fill/step-4")} className="rpfaas-fill-button rpfaas-fill-button-secondary">Previous</Button>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" onClick={() => router.push("/rpfaas/building-structure/fill/preview")} className="rpfaas-fill-button rpfaas-fill-button-primary">Preview</Button>
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
