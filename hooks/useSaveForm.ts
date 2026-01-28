/**
 * Custom Hook for Form Saving
 * Provides save functionality for multi-step forms
 */

import { useState, useCallback, useEffect } from 'react';
import {
  saveDraftToLocal,
  loadDraftFromLocal,
  getDraftMetadata,
  clearDraft,
  saveFormToDatabase,
  updateFormInDatabase,
  formatLastSaved,
  FormData,
} from '@/lib/formStorage';

interface UseSaveFormOptions {
  formType: string;
  step: number;
  autoSaveInterval?: number; // in milliseconds, 0 to disable
}

interface UseSaveFormReturn {
  isSaving: boolean;
  lastSaved: string | null;
  savedFormId: string | null;
  saveDraft: (data: FormData) => void;
  saveToDatabaseAsDraft: (data: FormData) => Promise<void>;
  saveToDatabaseAsSubmitted: (data: FormData) => Promise<void>;
  loadDraft: () => FormData | null;
  clearCurrentDraft: () => void;
  saveError: string | null;
}

export function useSaveForm({
  formType,
  step,
  autoSaveInterval = 0,
}: UseSaveFormOptions): UseSaveFormReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [savedFormId, setSavedFormId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load last saved timestamp on mount
  useEffect(() => {
    const metadata = getDraftMetadata(formType, step);
    if (metadata?.lastSaved) {
      setLastSaved(metadata.lastSaved);
    }

    // Try to get formId from localStorage
    const storedFormId = localStorage.getItem(`formId_${formType}`);
    if (storedFormId) {
      setSavedFormId(storedFormId);
    }
  }, [formType, step]);

  // Save draft to localStorage only
  const saveDraft = useCallback(
    (data: FormData) => {
      try {
        saveDraftToLocal(formType, step, data);
        setLastSaved(new Date().toISOString());
        setSaveError(null);
      } catch (error) {
        setSaveError('Failed to save draft locally');
        console.error('Error saving draft:', error);
      }
    },
    [formType, step]
  );

  // Save to database as draft
  const saveToDatabaseAsDraft = useCallback(
    async (data: FormData) => {
      setIsSaving(true);
      setSaveError(null);

      try {
        let result;

        if (savedFormId) {
          // Update existing record
          result = await updateFormInDatabase(formType, savedFormId, data, 'draft');
        } else {
          // Create new record
          result = await saveFormToDatabase(formType, data, 'draft');
          if (result.formId) {
            setSavedFormId(result.formId);
            localStorage.setItem(`formId_${formType}`, result.formId);
          }
        }

        if (result.success) {
          // Also save to localStorage
          saveDraftToLocal(formType, step, data);
          setLastSaved(new Date().toISOString());
        } else {
          setSaveError(result.error || 'Failed to save to database');
        }
      } catch (error) {
        setSaveError('Failed to save to database');
        console.error('Error saving to database:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [formType, step, savedFormId]
  );

  // Save to database as submitted (final save)
  const saveToDatabaseAsSubmitted = useCallback(
    async (data: FormData) => {
      setIsSaving(true);
      setSaveError(null);

      try {
        let result;

        if (savedFormId) {
          result = await updateFormInDatabase(formType, savedFormId, data, 'submitted');
        } else {
          result = await saveFormToDatabase(formType, data, 'submitted');
        }

        if (result.success) {
          // Clear drafts after successful submission
          clearDraft(formType);
          setLastSaved(new Date().toISOString());
          
          // Clear the formId from storage since form is submitted
          localStorage.removeItem(`formId_${formType}`);
          setSavedFormId(null);
        } else {
          setSaveError(result.error || 'Failed to submit form');
        }
      } catch (error) {
        setSaveError('Failed to submit form');
        console.error('Error submitting form:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [formType, savedFormId]
  );

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    return loadDraftFromLocal(formType, step);
  }, [formType, step]);

  // Clear current draft
  const clearCurrentDraft = useCallback(() => {
    clearDraft(formType, step);
    setLastSaved(null);
  }, [formType, step]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveInterval > 0) {
      // Auto-save is currently not implemented but can be added
      // Would need to watch form data changes
      console.log('Auto-save enabled with interval:', autoSaveInterval);
    }
  }, [autoSaveInterval]);

  return {
    isSaving,
    lastSaved,
    savedFormId,
    saveDraft,
    saveToDatabaseAsDraft,
    saveToDatabaseAsSubmitted,
    loadDraft,
    clearCurrentDraft,
    saveError,
  };
}
