"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { checkIfDataIsApplied } from "@/lib/utils";
import "@/app/styles/forms-fill.css";
import { StepPagination } from "@/components/ui/step-pagination";
import { LAND_STEPS } from "@/app/land-other-improvements/fill/constants";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSaveDraft } from "@/hooks/useSaveDraft";
import { Loader2, Lock } from "lucide-react";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { useFormLock } from "@/hooks/useFormLock";

const FORM_NAME = "land-other-improvements-fill-2";

const LandOtherImprovementFormFillPage2 = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftId = searchParams.get("id");
    const { checking: lockChecking, locked, lockedBy } = useFormLock('land_improvements', draftId);

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

    useEffect(() => {
        if (!draftId) return;
        const loadDraft = async () => {
            try {
                const response = await fetch(`/api/faas/land-improvements/${draftId}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        const data = result.data;
                        if (data.north_property) setNorthProperty(data.north_property);
                        if (data.south_property) setSouthProperty(data.south_property);
                        if (data.east_property) setEastProperty(data.east_property);
                        if (data.west_property) setWestProperty(data.west_property);
                    }
                }
            } catch (error) {
                console.error('Failed to load draft data for step 2', error);
            }
        };
        loadDraft();
    }, [draftId]);

    const { handleSave, isSaving } = useSaveDraft({
        getFormData: () => ({
            north_property: NorthProperty,
            south_property: SouthProperty,
            east_property: EastProperty,
            west_property: WestProperty,
        }),
        draftId,
        apiEndpoint: "/api/faas/land-improvements",
    });

    const handleSubmit = useCallback((e: { preventDefault(): void }) => {
        e.preventDefault();
        router.push("/building-other-structure");
    }, [router]);

    const handleNext = useCallback(async () => {
        await handleSave();
        router.push(`/land-other-improvements/fill/step-3${draftId ? `?id=${draftId}` : ''}`);
    }, [handleSave, router, draftId]);

    return (
        <FormFillLayout
            breadcrumbParent={{ label: "Land & Other Improvements Dashboard", href: "/land-other-improvements/dashboard" }}
            pageTitle="Property Boundaries"
        >
                        <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="rpfaas-fill-title">Fill-up form: Property Boundaries</h1>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving || locked || lockChecking}
                                className="shrink-0"
                            >
                                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Draft"}
                            </Button>
                        </header>
                        {lockChecking && (
                          <div className="flex items-center gap-2 mb-4 rounded-md border bg-muted px-4 py-3 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Checking form availability…
                          </div>
                        )}
                        {!lockChecking && locked && (
                          <div className="flex items-center gap-2 mb-4 rounded-md border border-yellow-400/50 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                            <Lock className="h-4 w-4 shrink-0" />
                            <span><strong>{lockedBy}</strong> is currently editing this form. You can view it but cannot make changes.</span>
                          </div>
                        )}
                        <fieldset disabled={locked || lockChecking} className={`border-0 p-0 m-0 min-w-0 block${locked || lockChecking ? ' opacity-60' : ''}`}>
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
                            <StepPagination
                                currentStep={2}
                                draftId={draftId}
                                isDirty={false}
                                onNext={handleNext}
                                isNextLoading={isSaving}
                                isNextDisabled={isSaving || locked || lockChecking}
                                basePath="land-other-improvements"
                                steps={LAND_STEPS}
                                draftStorageKey="land_draft_id"
                            />
                        </form>
                        </fieldset>
        </FormFillLayout>
    );
};

export default function LandOtherImprovementFormFillPage2Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandOtherImprovementFormFillPage2 />
    </Suspense>
  );
}
