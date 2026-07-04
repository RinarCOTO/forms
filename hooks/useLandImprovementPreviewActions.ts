"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearLandImprovementDraftStorage,
  collectStepDraftFields,
  getStoredFaasDraftId,
  setStoredFaasDraftId,
} from "@/utils/form-draft-storage";

export function useLandImprovementPreviewActions(draftId: string | null | undefined) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);

    try {
      const formData = collectStepDraftFields(localStorage);
      formData.status = "draft";
      const currentDraftId = draftId ?? getStoredFaasDraftId(localStorage, "land");

      const response = currentDraftId
        ? await fetch(`/api/faas/land-improvements/${currentDraftId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          })
        : await fetch("/api/faas/land-improvements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

      if (response.ok) {
        const result = await response.json().catch(() => null);
        const savedId = result?.data?.id?.toString() ?? result?.id?.toString();
        if (savedId) setStoredFaasDraftId(localStorage, "land", savedId);
        alert("Draft saved successfully!");
        clearLandImprovementDraftStorage(localStorage);
        router.push("/land-other-improvements/dashboard");
      } else {
        const error = await response.json();
        alert("Failed to save: " + (error.message ?? "Unknown error"));
      }
    } catch {
      alert("Error saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [draftId, router]);

  const handleSubmit = useCallback(async () => {
    if (!draftId) {
      alert("No form ID found. Please go back and save first.");
      return;
    }

    if (!confirm("Submit this form for LAOO review? You will not be able to edit it until the LAOO returns it.")) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/faas/land-improvements/${draftId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        clearLandImprovementDraftStorage(localStorage);
        router.push("/land-other-improvements/dashboard");
      } else {
        const error = await response.json();
        alert("Failed to submit: " + (error.message ?? "Unknown error"));
      }
    } catch {
      alert("Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [draftId, router]);

  return {
    handleSaveDraft,
    handleSubmit,
    isSaving,
    isSubmitting,
  };
}
