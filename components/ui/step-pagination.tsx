"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


interface StepPaginationProps {
  currentStep: number;
  draftId: string | null;
  isDirty: boolean;
  /** Called when the Next/Preview button is clicked */
  onNext: () => void;
  /** Label for the right action button (default "Next") */
  nextLabel?: React.ReactNode;
  isNextLoading?: boolean;
  isNextDisabled?: boolean;
  /** Base path for step URLs, e.g. "building-other-structure" */
  basePath?: string;
  /** Step definitions to render */
  steps: readonly { step: number; label: string }[];
  /** localStorage key used to read the draft id (default "draft_id") */
  draftStorageKey?: string;
}

export function StepPagination({
  currentStep,
  draftId,
  isDirty,
  onNext,
  nextLabel = "Next",
  isNextLoading = false,
  isNextDisabled = false,
  basePath = "building-other-structure",
  steps = [],
  draftStorageKey = "draft_id",
}: StepPaginationProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  // Read localStorage after mount so we can include it in href attributes
  const [localId, setLocalId] = useState<string | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem(draftStorageKey);
    if (stored) setLocalId(stored);
  }, [draftStorageKey]);

  const effectiveId = draftId ?? localId;

  const stepHref = (step: number) =>
    `/${basePath}/fill/step-${step}${effectiveId ? `?id=${effectiveId}` : ""}`;

  const navigateTo = useCallback(
    (step: number) => {
      router.push(stepHref(step));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveId, router]
  );

  const handleStepClick = useCallback(
    (e: React.MouseEvent, step: number) => {
      if (step === currentStep) {
        e.preventDefault();
        return;
      }
      if (isDirty) {
        e.preventDefault();
        setPendingStep(step);
        setShowModal(true);
      }
      // Not dirty → let the <Link> navigate naturally (href takes effect)
    },
    [currentStep, isDirty]
  );

  const handleLeave = useCallback(() => {
    setShowModal(false);
    if (pendingStep !== null) navigateTo(pendingStep);
  }, [pendingStep, navigateTo]);

  const handleStay = useCallback(() => {
    setShowModal(false);
    setPendingStep(null);
  }, []);

  const hasPrev = currentStep > 1;

  return (
    <>
      <div className="border-t border-border pt-4 mt-6 flex items-center justify-between gap-4">
        {/* Left: Previous */}
        <div className="w-28 flex justify-start">
          {hasPrev && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              asChild
            >
              <Link
                href={stepHref(currentStep - 1)}
                onClick={(e) => handleStepClick(e, currentStep - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            </Button>
          )}
        </div>

        {/* Center: Step number links */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium tracking-wide">
            Step {currentStep} of {steps.length}
          </span>
        <nav className="flex items-center gap-2" aria-label="Form steps">
          {steps.map(({ step, label }) => {
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            return (
              <Link
                key={step}
                href={stepHref(step)}
                onClick={(e) => handleStepClick(e, step)}
                title={label}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-primary text-primary-foreground cursor-default shadow-sm"
                    : isCompleted
                    ? "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                )}
              >
                {step}
                <span className="sr-only">{label}</span>
              </Link>
            );
          })}
        </nav>
        </div>

        {/* Right: Next / Preview */}
        <div className="w-28 flex justify-end">
          <Button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || isNextLoading}
            size="sm"
            className="gap-1"
          >
            {isNextLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) handleStay();
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes on this page. If you leave now, your
              changes will be lost and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleStay}>
              Stay on page
            </Button>
            <Button variant="destructive" onClick={handleLeave}>
              Leave anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
