"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  clearMachineryDraftStorage,
  collectStepDraftFields,
  getStoredFaasDraftId,
  setStoredFaasDraftId,
} from "@/utils/form-draft-storage";

interface SuccessModalState {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
}

export function useMachineryPreviewActions(draftId: string | null | undefined) {
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
      const currentDraftId = draftId ?? getStoredFaasDraftId(localStorage, "machinery");

      const response = currentDraftId
        ? await fetch(`/api/faas/machinery/${currentDraftId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          })
        : await fetch("/api/faas/machinery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

      if (response.ok) {
        const result = await response.json().catch(() => null);
        const savedId = result?.data?.id?.toString() ?? result?.id?.toString();
        if (savedId) setStoredFaasDraftId(localStorage, "machinery", savedId);
        clearMachineryDraftStorage(localStorage);
        setSuccessModal({
          open: true,
          title: `Draft ${currentDraftId ? "updated" : "saved"}`,
          description: "Your draft has been saved successfully.",
          onConfirm: () => router.push("/machinery/dashboard"),
        });
      } else {
        const error = await response.json();
        toast.error("Failed to save: " + (error.message ?? "Unknown error"));
      }
    } catch {
      toast.error("Error saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [draftId, router]);

  const handleSubmit = useCallback(async () => {
    if (!draftId) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/faas/machinery/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      });

      if (response.ok) {
        clearMachineryDraftStorage(localStorage);
        setConfirmSubmitOpen(false);
        setSuccessModal({
          open: true,
          title: "Form submitted!",
          description: "Your form has been submitted for review.",
          onConfirm: () => router.push("/machinery/dashboard"),
        });
      } else {
        const error = await response.json();
        toast.error("Failed to submit: " + (error.message ?? "Unknown error"));
      }
    } catch {
      toast.error("Error submitting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [draftId, router]);

  return {
    confirmSubmitOpen,
    handleSaveDraft,
    handleSubmit,
    isSaving,
    isSubmitting,
    setConfirmSubmitOpen,
    successModal,
  };
}
