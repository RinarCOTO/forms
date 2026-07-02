"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { clearLandImprovementDraftStorage } from "@/utils/form-draft-storage";

export function useLandImprovementPreviewActions(draftId: string | null | undefined) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveDraft = useCallback(async () => {
    if (!draftId) return;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/faas/land-improvements/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });

      if (response.ok) {
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
