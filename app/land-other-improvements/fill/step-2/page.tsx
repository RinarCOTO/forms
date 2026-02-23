"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { checkIfDataIsApplied } from "@/lib/utils";
import "@/app/styles/forms-fill.css";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { useSaveDraft } from "@/hooks/useSaveDraft";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const FORM_NAME = "land-other-improvements-fill-2";

const LandOtherImprovementFormFillPage2 = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftId = searchParams.get("id");

    //Basic Fields
    const [NorthProperty, setNorthProperty] = useState("");
    const [SouthProperty, setSouthProperty] = useState("");
    const [EastProperty, setEastProperty] = useState("");
    const [WestProperty, setWestProperty] = useState("");

    useEffect(() => {
        const isDataApplied = checkIfDataIsApplied();
        if (isDataApplied) {
            router.push("/error-page");
        }
    }, []);

    const { handleSave, isSaving } = useSaveDraft({
        getFormData: () => ({
            north_property: NorthProperty,
            south_property: SouthProperty,
            east_property: EastProperty,
            west_property: WestProperty,
        }),
        draftId,
        apiEndpoint: "/api/forms/land-other-improvements",
    });

    const handleSubmit = useCallback((e: { preventDefault(): void }) => {
        e.preventDefault();
        router.push("/building-other-structure");
    }, [router]);

    const handleNext = useCallback(() => {
        router.push(`/land-other-improvements/fill/step-3${draftId ? `?id=${draftId}` : ''}`);
    }, [router, draftId]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/land-other-improvements/dashboard">Land &amp; Other Improvements Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Property Boundaries</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="rpfaas-fill max-w-3xl mx-auto">
                        <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="rpfaas-fill-title">Fill-up form: Property Boundaries</h1>
                            </div>
                        </header>
                        <form id={`form_${FORM_NAME}_main`} onSubmit={handleSubmit}
                        className="rpfaas-fill-form rpfaas-fill-form-single space-y-6"
                        >
                            <section className="rpfaas-fill-section">
                                <div className="rpfaas-fill-field space-y-1">
                                    <Label className="rpfaas-fill-label">North</Label>
                                    <Input value={NorthProperty} onChange={(e) => setNorthProperty(e.target.value)} className="rpfaas-fill-input" />
                                </div>
                                <div className="rpfaas-fill-field space-y-1">
                                    <Label className="rpfaas-fill-label">South</Label>
                                    <Input value={SouthProperty} onChange={(e) => setSouthProperty(e.target.value)} className="rpfaas-fill-input" />
                                </div>
                                <div className="rpfaas-fill-field space-y-1">
                                    <Label className="rpfaas-fill-label">East</Label>
                                    <Input value={EastProperty} onChange={(e) => setEastProperty(e.target.value)} className="rpfaas-fill-input" />
                                </div>
                                <div className="rpfaas-fill-field space-y-1">
                                    <Label className="rpfaas-fill-label">West</Label>
                                    <Input value={WestProperty} onChange={(e) => setWestProperty(e.target.value)} className="rpfaas-fill-input" />
                                </div>
                            </section>
                            <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                                <div className="rpfaas-fill-actions flex gap-2 justify-end items-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push(`/land-other-improvements/fill/step-1${draftId ? `?id=${draftId}` : ''}`)}
                                        className="rpfaas-fill-button rpfaas-fill-button-secondary"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="rpfaas-fill-button rpfaas-fill-button-secondary"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            "Save Draft"
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={isSaving}
                                        className="rpfaas-fill-button rpfaas-fill-button-primary"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin"/>
                                        ) : (
                                            "Next"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default function LandOtherImprovementFormFillPage2Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandOtherImprovementFormFillPage2 />
    </Suspense>
  );
}
