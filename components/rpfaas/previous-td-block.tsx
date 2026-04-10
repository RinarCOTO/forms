"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PreviousTdBlockProps {
  previousTdNo: string;
  onPreviousTdNoChange: (v: string) => void;
  previousOwner: string;
  onPreviousOwnerChange: (v: string) => void;
  previousAv: string;
  previousMv: string;
  previousArea: string;
  areaLabel?: string;
}

export function PreviousTdBlock({
  previousTdNo,
  onPreviousTdNoChange,
  previousOwner,
  onPreviousOwnerChange,
  previousAv,
  previousMv,
  previousArea,
  areaLabel = "Prev. Area",
}: PreviousTdBlockProps) {
  return (
    <>
      <div className="space-y-1">
        <Label className="rpfaas-fill-label">Previous TD No.</Label>
        <Input
          value={previousTdNo}
          onChange={(e) => onPreviousTdNoChange(e.target.value)}
          placeholder="e.g. 02-0001-00123"
          className="rpfaas-fill-input"
        />
      </div>
      <div className="space-y-1">
        <Label className="rpfaas-fill-label">Previous Owner</Label>
        <Input
          value={previousOwner}
          onChange={(e) => onPreviousOwnerChange(e.target.value)}
          placeholder="Auto-filled from TD lookup"
          className="rpfaas-fill-input"
        />
      </div>
      {(previousAv || previousMv || previousArea) && (
        <div className="col-span-2 grid grid-cols-3 gap-3 rounded-md border border-dashed px-3 py-2 bg-muted/40 text-xs">
          <div>
            <div className="text-muted-foreground mb-0.5">Prev. Assessed Value</div>
            <div className="font-semibold">{previousAv ? `₱${parseFloat(previousAv).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">Prev. Market Value</div>
            <div className="font-semibold">{previousMv ? `₱${parseFloat(previousMv).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">{areaLabel}</div>
            <div className="font-semibold">{previousArea ? `${parseFloat(previousArea).toLocaleString("en-PH")} sqm` : "—"}</div>
          </div>
        </div>
      )}
    </>
  );
}
