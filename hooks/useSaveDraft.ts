"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseSaveDraftOptions {
  /** A function that returns the current form data to save */
  getFormData: () => Record<string, unknown>;
  /** The draft ID from URL params (pass `searchParams.get("id")`) */
  draftId: string | null;
  /** The base API endpoint, e.g. "/api/forms/land-other-improvements" */
  apiEndpoint: string;
  /** Optional callback fired after a successful save */
  onSaved?: (id: string) => void;
}

interface UseSaveDraftReturn {
  handleSave: () => Promise<void>;
  isSaving: boolean;
  lastSaved: string | null;
  saveError: string | null;
}

export function useSaveDraft({
  getFormData,
  draftId,
  apiEndpoint,
  onSaved,
}: UseSaveDraftOptions): UseSaveDraftReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const formData = { ...getFormData(), status: "draft" };
      const currentDraftId = draftId || localStorage.getItem("draft_id");

      let response: Response;

      if (currentDraftId) {
        response = await fetch(`${apiEndpoint}/${currentDraftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) {
          localStorage.setItem("draft_id", result.data.id.toString());
          onSaved?.(result.data.id.toString());
        }
        setLastSaved(new Date().toISOString());
        toast.success("Saved", { description: "Your progress has been saved." });
      } else {
        let message = `Server error (${response.status})`;
        try {
          const error = await response.json();
          message = error.message || error.error || message;
        } catch { /* ignore parse error */ }
        setSaveError(message);
        toast.error("Failed to save", { description: message });
      }
    } catch (error) {
      const message = "Error saving. Please try again.";
      setSaveError(message);
      console.error("Error saving:", error);
      toast.error("Error saving", { description: message });
    } finally {
      setIsSaving(false);
    }
  }, [getFormData, draftId, apiEndpoint, onSaved]);

  return { handleSave, isSaving, lastSaved, saveError };
}
