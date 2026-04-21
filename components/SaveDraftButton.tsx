"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Save } from "lucide-react";

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

interface Props {
  onClick: () => void;
  isSaving: boolean;
  disabled?: boolean;
}

export function SaveDraftButton({ onClick, isSaving, disabled }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClick}
          disabled={isSaving || disabled}
          className="shrink-0 gap-2"
        >
          {isSaving
            ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
            : <><Save className="h-4 w-4" />Save Draft</>
          }
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-1.5">
        <span>Save draft</span>
        <kbd className="rounded border border-white/20 bg-white/10 px-1 py-0.5 font-mono text-[10px]">
          {isMac ? "⌘" : "Ctrl"}
        </kbd>
        <kbd className="rounded border border-white/20 bg-white/10 px-1 py-0.5 font-mono text-[10px]">S</kbd>
      </TooltipContent>
    </Tooltip>
  );
}
