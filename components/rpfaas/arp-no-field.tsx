"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ArpNoFieldProps {
  value: string;
  onChange: (v: string) => void;
}

export function ArpNoField({ value, onChange }: ArpNoFieldProps) {
  return (
    <div className="space-y-1" data-comment-field="arp_no">
      <Label className="rpfaas-fill-label">ARP No.</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="00-0000-00000"
        className="rpfaas-fill-input font-mono"
      />
    </div>
  );
}
