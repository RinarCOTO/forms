"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  clearBuildingStructureDraftStorage,
  collectStepDraftFields,
  getStoredFaasDraftId,
} from "@/utils/form-draft-storage";

interface SuccessModalState {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
}

export function useBuildingStructurePreviewActions(draftId: string | null | undefined) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<SuccessModalState>({
    open: false,
    title: "",
    onConfirm: () => {},
  });
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);

    try {
      const formData = collectStepDraftFields(localStorage);
      formData.status = "draft";
      const currentDraftId = draftId ?? getStoredFaasDraftId(localStorage, "building");

      const response = currentDraftId
        ? await fetch(`/api/faas/building-structures/${currentDraftId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          })
        : await fetch("/api/faas/building-structures", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

      if (response.ok) {
        clearBuildingStructureDraftStorage(localStorage);
        setSuccessModal({
          open: true,
          title: `Draft ${currentDraftId ? "updated" : "saved"}`,
          description: "Your draft has been saved successfully.",
          onConfirm: () => router.push("/building-other-structure/dashboard"),
        });
      } else {
        const error = await response.json();
        toast.error("Failed to save draft: " + (error.message ?? "Unknown error"));
      }
    } catch {
      toast.error("Error saving draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [draftId, router]);

  const handleSubmit = useCallback(() => {
    const currentDraftId = draftId ?? getStoredFaasDraftId(localStorage, "building");
    if (!currentDraftId) {
      toast.error("No form ID found. Please save as draft first.");
      return;
    }

    setConfirmSubmitOpen(true);
  }, [draftId]);

  const handleConfirmSubmit = useCallback(async () => {
    const currentDraftId = draftId ?? getStoredFaasDraftId(localStorage, "building");
    setConfirmSubmitOpen(false);
    setIsSubmitting(true);

    try {
      const submitResponse = await fetch(
        `/api/faas/building-structures/${currentDraftId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (submitResponse.ok) {
        clearBuildingStructureDraftStorage(localStorage);
        setSuccessModal({
          open: true,
          title: "Form submitted",
          description: "Your form has been submitted for Municipal Assessor review.",
          onConfirm: () => router.push("/building-other-structure/dashboard"),
        });
      } else {
        const error = await submitResponse.json();
        toast.error("Failed to submit: " + (error.message ?? "Unknown error"));
      }
    } catch {
      toast.error("Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [draftId, router]);

  return {
    confirmSubmitOpen,
    handleConfirmSubmit,
    handleSaveDraft,
    handleSubmit,
    isSaving,
    isSubmitting,
    setConfirmSubmitOpen,
    setSuccessModal,
    successModal,
  };
}
