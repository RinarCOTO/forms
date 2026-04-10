"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TitleNoFieldProps {
  titleType: string;
  onTitleTypeChange: (v: string) => void;
  titleNo: string;
  onTitleNoChange: (v: string) => void;
  includeCCT?: boolean;
}

export function TitleNoField({
  titleType,
  onTitleTypeChange,
  titleNo,
  onTitleNoChange,
  includeCCT = false,
}: TitleNoFieldProps) {
  return (
    <div className="space-y-1" data-comment-field="oct_tct_cloa_no">
      <Label className="rpfaas-fill-label">OCT/TCT/CLOA No.</Label>
      <div className="flex gap-2">
        <div className="relative w-36 shrink-0">
          <select
            value={titleType}
            onChange={(e) => { onTitleTypeChange(e.target.value); if (e.target.value === 'None') onTitleNoChange(''); }}
            className="rpfaas-fill-input appearance-none w-full"
          >
            <option value="">Select type</option>
            <option value="OCT">OCT</option>
            <option value="TCT">TCT</option>
            <option value="CLOA">CLOA</option>
            {includeCCT && <option value="CCT">CCT</option>}
            <option value="None">None</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
        {titleType && titleType !== 'None' && (
          <Input
            value={titleNo}
            onChange={(e) => onTitleNoChange(e.target.value)}
            placeholder="e.g. T-123456"
            className="rpfaas-fill-input flex-1"
          />
        )}
      </div>
    </div>
  );
}
