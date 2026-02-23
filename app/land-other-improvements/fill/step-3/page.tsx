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
import { LandClassificationForm, LandSubClassificationForm } from "@/app/components/forms/LandClassificationForm";

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

const FORM_NAME = "land-other-improvements-fill-3";

const LandOtherImprovementFormFillPage3 = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftId = searchParams.get("id");

    const [classification, setClassification] = useState("");
    const [subClassification, setSubClassification] = useState("");

    //input fields
    const [landArea, setLandArea] = useState("");

    useEffect(() => {
        const isDataApplied = checkIfDataIsApplied();
        if (isDataApplied) {
            router.push("/error-page");
        }
    }, []);

    const { handleSave, isSaving } = useSaveDraft({
        getFormData: () => ({ classification, subClassification }),
        draftId,
        apiEndpoint: "/api/forms/land-other-improvements",
    });

    const handleSubmit = useCallback((e: { preventDefault(): void }) => {
        e.preventDefault();
    }, []);

    const handleNext = useCallback(() => {
        router.push(`/land-other-improvements/fill/step-4${draftId ? `?id=${draftId}` : ""}`);
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
                                <BreadcrumbPage>Classification</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="rpfaas-fill max-w-3xl mx-auto">
                        <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="rpfaas-fill-title">Fill-up form: Classification</h1>
                            </div>
                        </header>
                        <form
                            id={`form_${FORM_NAME}_main`}
                            onSubmit={handleSubmit}
                            className="rpfaas-fill-form rpfaas-fill-form-single space-y-6"
                        >
                            <section className="rpfaas-fill-section">
                                <h2 className="rpfaas-fill-section-title mb-4">Land Appraisal</h2>
                                <LandClassificationForm
                                    label="Classification"
                                    value={classification}
                                    onChange={(val) => {
                                        setClassification(val);
                                        setSubClassification("");
                                    }}
                                />
                                <LandSubClassificationForm
                                    classification={classification}
                                    value={subClassification}
                                    onChange={setSubClassification}
                                />

                                <div className="rpfaas-fill-field space-y-1">
                                    <Label className="rpfaas-fill-label">Land Area</Label>
                                    <Input type="number" value={landArea} onChange={(e) => setLandArea(e.target.value)} className="rpfaas-fill-input" />
                                </div>
                            </section>

                            <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                                <div className="rpfaas-fill-actions flex gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push(`/land-other-improvements/fill/step-2${draftId ? `?id=${draftId}` : ""}`)}
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
                                            <Loader2 className="h-4 w-4 animate-spin" />
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

export default function LandOtherImprovementFormFillPage3Wrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LandOtherImprovementFormFillPage3 />
        </Suspense>
    );
}
