"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { checkIfDataIsApplied } from "@/lib/utils";
import "@/app/styles/forms-fill.css";
import { StepPagination, LAND_IMPROVEMENT_STEPS } from "@/components/ui/step-pagination";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { useSaveDraft } from "@/hooks/useSaveDraft";
import { municipalityData } from "@/app/smv/land-other-improvements/data";

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
    const [landArea, setLandArea] = useState("");

    // Load municipality from draft (saved in step 1) to filter SMV categories
    const [municipality, setMunicipality] = useState("");

    // Derive which categories have SMV data for this municipality
    const munKey = municipality.toLowerCase();
    const SMV_CATEGORIES = ["commercial", "residential", "agricultural"] as const;
    const availableCategories = SMV_CATEGORIES.filter(
        (cat) => (municipalityData[munKey]?.[cat]?.length ?? 0) > 0
    );

    // Derive sub-classification options from the selected classification's SMV rows
    // e.g. besao + residential → ["R-1", "R-2", "R-3", "R-4"]
    // e.g. besao + commercial  → ["C-1"]
    const subClassificationOptions = classification
        ? (municipalityData[munKey]?.[classification as "commercial" | "residential" | "agricultural"] ?? [])
            .map((row) => row.subClassification)
        : [];

    // Auto-select when there is only one option (e.g. commercial → C-1)
    useEffect(() => {
        if (subClassificationOptions.length === 1) {
            setSubClassification(subClassificationOptions[0]);
        }
    }, [subClassificationOptions.length, classification]);

    useEffect(() => {
        const isDataApplied = checkIfDataIsApplied();
        if (isDataApplied) {
            router.push("/error-page");
        }
    }, []);

    // Load saved values from the draft
    useEffect(() => {
        if (!draftId) return;
        const load = async () => {
            try {
                const res = await fetch(`/api/faas/land-improvements/${draftId}`);
                if (!res.ok) return;
                const result = await res.json();
                if (!result.success || !result.data) return;
                const data = result.data;
                if (data.location_municipality) setMunicipality(data.location_municipality);
                if (data.classification) setClassification(data.classification);
                if (data.sub_classification) setSubClassification(data.sub_classification);
                if (data.area) setLandArea(String(data.area));
            } catch (err) {
                console.error("Failed to load draft for step 3:", err);
            }
        };
        load();
    }, [draftId]);

    const { handleSave, isSaving } = useSaveDraft({
        getFormData: () => ({ classification, sub_classification: subClassification, area: landArea }),
        draftId,
        apiEndpoint: "/api/faas/land-improvements",
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
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="shrink-0"
                            >
                                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Draft"}
                            </Button>
                        </header>
                        <form
                            id={`form_${FORM_NAME}_main`}
                            onSubmit={handleSubmit}
                            className="rpfaas-fill-form rpfaas-fill-form-single space-y-6"
                        >
                            <section className="rpfaas-fill-section">
                                <h2 className="rpfaas-fill-section-title mb-4">Land Appraisal</h2>

                                <div className="rpfaas-fill-field space-y-1">
                                    <Label className="rpfaas-fill-label">Classification</Label>
                                    <div className="relative">
                                        <select
                                            value={classification}
                                            onChange={(e) => {
                                                setClassification(e.target.value);
                                                setSubClassification(""); // reset sub when classification changes
                                            }}
                                            disabled={availableCategories.length === 0}
                                            className="rpfaas-fill-input appearance-none w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">
                                                {availableCategories.length === 0
                                                    ? "No SMV data for this municipality"
                                                    : "Select classification"}
                                            </option>
                                            {availableCategories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="rpfaas-fill-field space-y-1">
                                    <Label className="rpfaas-fill-label">Sub-Classification</Label>
                                    <div className="relative">
                                        <select
                                            value={subClassification}
                                            onChange={(e) => setSubClassification(e.target.value)}
                                            disabled={subClassificationOptions.length === 0}
                                            className="rpfaas-fill-input appearance-none w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">
                                                {subClassificationOptions.length === 0
                                                    ? "Select classification first"
                                                    : "Select sub-classification"}
                                            </option>
                                            {subClassificationOptions.map((sub) => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="rpfaas-fill-field space-y-1">
                                    <Label className="rpfaas-fill-label">Land Area</Label>
                                    <Input type="number" value={landArea} onChange={(e) => setLandArea(e.target.value)} className="rpfaas-fill-input" />
                                </div>
                            </section>

                            <StepPagination
                                currentStep={3}
                                draftId={draftId}
                                isDirty={false}
                                onNext={handleNext}
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
