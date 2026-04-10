"use client";

import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export interface TransactionCode {
  code: string;
  label: string;
  description: string;
}

interface TransactionCodeSelectProps {
  value: string;
  onChange: (v: string) => void;
  codes: TransactionCode[];
}

export function TransactionCodeSelect({ value, onChange, codes }: TransactionCodeSelectProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Label className="rpfaas-fill-label">Transaction Code</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {value
              ? codes.find(t => t.code === value)?.description
              : "Select a code to see its description."}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rpfaas-fill-input appearance-none"
        >
          <option value="">Select transaction code</option>
          {codes.map(t => (
            <option key={t.code} value={t.code}>{t.label}</option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>
    </div>
  );
}
