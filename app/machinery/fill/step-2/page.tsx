"use client";

// React & Next.js
import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Styles
import "@/app/styles/forms-fill.css";

// Third-party
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

// UI components
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { FormLockBanner } from "@/components/ui/form-lock-banner";
import { FormSection } from "@/components/ui/form-section";
import { StepPagination } from "@/components/ui/step-pagination";

// Hooks
import { useFormLock } from "@/hooks/useFormLock";

// RPFAAS components
import {
  MachineryItemCard,
  MachineryItemData,
  createEmptyItem,
} from "@/app/machinery/components/machinery-item-card";

// Constants
import { MACHINERY_STEPS } from "@/app/machinery/fill/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ItemWithKey = MachineryItemData & { _key: number };

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function MachineryStep2Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  const { checking: lockChecking, locked, lockedBy } = useFormLock("machinery", draftId);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isInitializedRef = useRef(false);

  const [items, setItems] = useState<ItemWithKey[]>([
    { _key: 1, ...createEmptyItem() },
  ]);

  // ── Load existing items from draft ──
  useEffect(() => {
    if (!draftId) { isInitializedRef.current = true; return; }
    const load = async () => {
      try {
        const res = await fetch(`/api/faas/machinery/${draftId}`);
        if (!res.ok) return;
        const result = await res.json();
        if (result.success && result.data?.appraisal_items) {
          const loaded = result.data.appraisal_items as MachineryItemData[];
          if (loaded.length > 0) {
            setItems(loaded.map((item, i) => ({ _key: i + 1, ...item })));
          }
        }
      } catch {
        // Non-fatal — start with blank items
      } finally {
        isInitializedRef.current = true;
      }
    };
    load();
  }, [draftId]);

  // ── Item handlers ──
  const addItem = useCallback(() => {
    setItems(prev => [...prev, { _key: Date.now(), ...createEmptyItem() }]);
    setIsDirty(true);
  }, []);

  const removeItem = useCallback((key: number) => {
    setItems(prev => prev.filter(item => item._key !== key));
    setIsDirty(true);
  }, []);

  const handleItemChange = useCallback(
    (index: number, field: keyof MachineryItemData, value: string) => {
      setItems(prev =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      );
      if (isInitializedRef.current) setIsDirty(true);
    },
    []
  );

  // ── Save logic ──
  const saveItems = useCallback(async (): Promise<boolean> => {
    const currentDraftId = draftId || localStorage.getItem("draft_id");
    if (!currentDraftId) {
      toast.error("No draft found. Go back to step 1 and save first.");
      return false;
    }
    const payload = items.map(({ _key, ...data }) => data);
    try {
      const res = await fetch(`/api/faas/machinery/${currentDraftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appraisal_items: payload }),
      });
      if (res.ok) return true;
      const error = await res.json();
      toast.error("Failed to save: " + (error.message ?? "Unknown error"));
    } catch {
      toast.error("Error saving. Please try again.");
    }
    return false;
  }, [draftId, items]);

  const handleNext = useCallback(async () => {
    setIsSaving(true);
    const ok = await saveItems();
    if (ok) {
      setIsDirty(false);
      const id = draftId || localStorage.getItem("draft_id");
      router.push(`/machinery/fill/step-3${id ? `?id=${id}` : ""}`);
    }
    setIsSaving(false);
  }, [saveItems, draftId, router]);

  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    const ok = await saveItems();
    if (ok) { setIsDirty(false); toast.success("Draft saved successfully."); }
    setIsSavingDraft(false);
  }, [saveItems]);

  return (
    <FormFillLayout
      breadcrumbParent={{ label: "Machinery", href: "#" }}
      pageTitle="Step 2: Property Appraisal"
      sidePanel={null}
    >
      <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="rpfaas-fill-title">Fill-up Form: RPFAAS - Machinery</h1>
          <p className="text-sm text-muted-foreground">Enter machinery appraisal details below.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveDraft}
          disabled={isSavingDraft || isSaving || locked || lockChecking}
          className="shrink-0"
        >
          {isSavingDraft ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Draft"}
        </Button>
      </header>

      <FormLockBanner locked={locked} lockedBy={lockedBy} />

      <form className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">
        <FormSection title="Property Appraisal">
          <div className="space-y-4">
            {items.map((item, index) => (
              <ErrorBoundary
                key={item._key}
                fallback={<p className="text-sm text-destructive">Failed to load this machinery item.</p>}
              >
                <MachineryItemCard
                  index={index}
                  item={item}
                  onChange={(field, value) => handleItemChange(index, field, value)}
                  onRemove={() => removeItem(item._key)}
                />
              </ErrorBoundary>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={addItem}
            disabled={locked || lockChecking}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Machinery Item
          </Button>
        </FormSection>

        <StepPagination
          currentStep={2}
          draftId={draftId}
          isDirty={isDirty}
          onNext={handleNext}
          isNextLoading={isSaving}
          isNextDisabled={isSaving || isSavingDraft || locked || lockChecking}
          basePath="machinery"
          steps={MACHINERY_STEPS}
        />
      </form>
    </FormFillLayout>
  );
}

export default function MachineryStep2Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <MachineryStep2Content />
    </Suspense>
  );
}
