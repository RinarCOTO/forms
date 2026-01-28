/**
 * SaveButton Component
 * Reusable button for saving form drafts with status indicators
 */

import { Button } from "@/components/ui/button";
import { formatLastSaved } from "@/lib/formStorage";
import { Loader2, Save, Check } from "lucide-react";

interface SaveButtonProps {
  onSave: () => void;
  isSaving: boolean;
  lastSaved?: string | null;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
  showLastSaved?: boolean;
}

export function SaveButton({
  onSave,
  isSaving,
  lastSaved,
  variant = "outline",
  className = "",
  showLastSaved = true,
}: SaveButtonProps) {
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={variant}
        onClick={onSave}
        disabled={isSaving}
        className={className}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </>
        )}
      </Button>
      
      {showLastSaved && lastSaved && !isSaving && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Check className="h-3 w-3 text-green-600" />
          Saved {formatLastSaved(lastSaved)}
        </span>
      )}
    </div>
  );
}

interface SaveStatusProps {
  lastSaved?: string | null;
  isSaving: boolean;
  error?: string | null;
}

export function SaveStatus({ lastSaved, isSaving, error }: SaveStatusProps) {
  if (error) {
    return (
      <div className="text-xs text-red-600 flex items-center gap-1">
        ⚠️ {error}
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving...
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Check className="h-3 w-3 text-green-600" />
        Saved {formatLastSaved(lastSaved)}
      </div>
    );
  }

  return null;
}
