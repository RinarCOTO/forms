"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import "@/app/styles/forms-fill.css";

import { Label } from "@/components/ui/label";
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

// STEP 1 OF LEARNING: Import the data file.
// We export `municipalityData` and the `SmvRow` type from the data file.
// The `@/` prefix means "from the root of the project".
import { municipalityData, SmvRow } from "@/app/smv/land-other-improvements/data";

// ─── Types ───────────────────────────────────────────────────────────────────
// We only care about these three categories from the SMV data.
type SmvCategory = "commercial" | "residential" | "agricultural";

// ─── Component ───────────────────────────────────────────────────────────────
const LandImprovementsStep4Content = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  // STEP 2 OF LEARNING: useState.
  // Each piece of data the user interacts with needs its own state variable.
  // useState(initialValue) returns [currentValue, setterFunction].

  // Data loaded from the draft (saved in previous steps)
  const [municipality, setMunicipality] = useState("");   // e.g. "Bontoc" — from step 1
  const [classification, setClassification] = useState(""); // e.g. "residential" — from step 3

  // What the user selects on this page
  const [selectedIndex, setSelectedIndex] = useState<number | "">("");
  const [smvSubClassification, setSmvSubClassification] = useState(""); // e.g. "R-1"
  const [smvLocation, setSmvLocation] = useState("");                   // full location text

  // STEP 3 OF LEARNING: Deriving data — no useEffect needed here.
  // Whenever `municipality` or `classification` changes, React re-renders,
  // so these lines just run again and produce the correct rows.
  //
  // municipalityData keys are lowercase ("bontoc"), so we call .toLowerCase().
  // The `??` operator means "use [] if the left side is null/undefined".
  const munKey = municipality.toLowerCase();
  const catKey = classification as SmvCategory;
  const smvRows: SmvRow[] = municipalityData[munKey]?.[catKey] ?? [];

  // The currently selected row object (or null if nothing is selected)
  const selectedRow = selectedIndex !== "" ? smvRows[selectedIndex] : null;

  // STEP 4 OF LEARNING: useEffect for loading data.
  // useEffect runs after the component renders.
  // The second argument `[draftId]` means "only re-run when draftId changes".
  useEffect(() => {
    if (!draftId) return;

    const loadDraft = async () => {
      try {
        const res = await fetch(`/api/faas/land-improvements/${draftId}`);
        if (!res.ok) return;
        const result = await res.json();
        if (!result.success || !result.data) return;

        const data = result.data;

        // Pull the values saved in earlier steps
        if (data.location_municipality) setMunicipality(data.location_municipality);
        if (data.classification) setClassification(data.classification);

        // If the user already filled this step, restore their selection
        if (data.smv_sub_classification) setSmvSubClassification(data.smv_sub_classification);
        if (data.smv_location) setSmvLocation(data.smv_location);
      } catch (err) {
        console.error("Failed to load draft for step 4:", err);
      }
    };

    loadDraft();
  }, [draftId]);

  // Restore the dropdown index after smvRows and smvSubClassification are both ready.
  useEffect(() => {
    if (!smvSubClassification || smvRows.length === 0) return;
    const idx = smvRows.findIndex((r) => r.subClassification === smvSubClassification);
    if (idx !== -1) setSelectedIndex(idx);
  }, [smvSubClassification, smvRows.length]);

  // STEP 5 OF LEARNING: onChange handler.
  // When the user picks a row from the dropdown:
  //   - Parse the index from the select value
  //   - Use that index to look up the row in smvRows
  //   - Auto-fill the related state variables
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "") {
      setSelectedIndex("");
      setSmvSubClassification("");
      setSmvLocation("");
      return;
    }
    const idx = parseInt(val, 10);
    setSelectedIndex(idx);
    const row = smvRows[idx];
    setSmvSubClassification(row.subClassification); // auto-fill sub-classification
    setSmvLocation(row.location);                   // auto-fill location description
  };

  // useSaveDraft: reuses the same pattern as other steps for the Save Draft button.
  const { handleSave, isSaving } = useSaveDraft({
    getFormData: () => ({
      smv_sub_classification: smvSubClassification,
      smv_location: smvLocation,
    }),
    draftId,
    apiEndpoint: "/api/faas/land-improvements",
  });

  // STEP 6 OF LEARNING: handleNext — save and navigate.
  // We use useCallback so the function is not recreated on every render
  // (it only changes when one of the values in the dependency array changes).
  const handleNext = useCallback(async () => {
    if (!draftId) return;
    await handleSave();
    router.push(`/land-other-improvements/fill/step-3${draftId ? `?id=${draftId}` : ""}`);
    // TODO: change step-3 above to the next step once it exists (e.g. step-5)
  }, [draftId, handleSave, router]);

  // ─── Render ────────────────────────────────────────────────────────────────
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
                <BreadcrumbLink href="/land-other-improvements/dashboard">
                  Land &amp; Other Improvements Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Unit Market Value</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-3xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Fill-up Form: Unit Market Value</h1>
                <p className="text-sm text-muted-foreground">
                  Select the applicable SMV row for this property.
                </p>
              </div>
            </header>

            <div className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">SMV Lookup</h2>

                {/* Context info pulled from earlier steps */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted rounded-md text-sm">
                  <div>
                    Municipality:{" "}
                    <span className="font-medium capitalize">{municipality || "—"}</span>
                  </div>
                  <div>
                    Classification:{" "}
                    <span className="font-medium capitalize">{classification || "—"}</span>
                  </div>
                </div>

                {/* SMV row dropdown */}
                {smvRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    {municipality && classification
                      ? `No SMV data found for ${municipality} / ${classification}.`
                      : "Municipality or classification not yet set. Go back to steps 1 and 3."}
                  </p>
                ) : (
                  <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label">Select SMV Location</Label>
                    <div className="relative">
                      <select
                        value={selectedIndex}
                        onChange={handleSelect}
                        className="rpfaas-fill-input appearance-none w-full"
                      >
                        <option value="">— Select a row —</option>
                        {smvRows.map((row, i) => (
                          <option key={i} value={i}>
                            {row.subClassification} — {row.location.slice(0, 70)}
                            {row.location.length > 70 ? "…" : ""}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Auto-filled preview card */}
                {selectedRow && (
                  <div className="mt-4 p-4 border border-border rounded-md space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="font-medium w-40 shrink-0">Sub-Classification:</span>
                      <span>{smvSubClassification}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium w-40 shrink-0">Location:</span>
                      <span className="text-muted-foreground">{smvLocation}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium w-40 shrink-0">2006 Unit Value:</span>
                      <span>₱{selectedRow.year2006}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium w-40 shrink-0">2012 Unit Value:</span>
                      <span>₱{selectedRow.year2012}</span>
                    </div>
                  </div>
                )}
              </section>

              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                <div className="rpfaas-fill-actions flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(`/land-other-improvements/fill/step-3${draftId ? `?id=${draftId}` : ""}`)
                    }
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
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Draft"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSaving}
                    className="rpfaas-fill-button rpfaas-fill-button-primary"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default function LandImprovementsStep4() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandImprovementsStep4Content />
    </Suspense>
  );
}
