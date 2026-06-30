"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TdNoFieldProps {
  value: string;
  onChange: (v: string) => void;
}

export function TdNoField({ value, onChange }: TdNoFieldProps) {
  return (
    <div className="space-y-1" data-comment-field="td_no">
      <Label className="rpfaas-fill-label">Tax Declaration No. (TD No.)</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter TD number"
        className="rpfaas-fill-input font-mono"
      />
    </div>
  );
}
