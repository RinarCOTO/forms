"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ArpNoFieldProps {
  arpPrefix: string;
  arpSeq: string;
  onArpSeqChange: (v: string) => void;
}

export function ArpNoField({ arpPrefix, arpSeq, onArpSeqChange }: ArpNoFieldProps) {
  return (
    <div className="space-y-1" data-comment-field="arp_no">
      <Label className="rpfaas-fill-label">ARP No.</Label>
      <div
        className="flex items-center font-mono h-9 border border-input rounded-md overflow-hidden"
        style={{ background: 'var(--surface)' }}
      >
        <span className="pl-3 pr-1 text-sm shrink-0 select-none" style={{ color: 'var(--text)' }}>
          {arpPrefix ? `${arpPrefix}-` : "__-____-"}
        </span>
        <Input
          value={arpSeq}
          onChange={(e) => onArpSeqChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="00000"
          className="border-0 shadow-none focus-visible:ring-0 bg-transparent font-mono h-full py-0 pr-3 pl-0"
          maxLength={5}
          disabled={!arpPrefix}
          style={{ color: 'var(--text)' }}
        />
      </div>
    </div>
  );
}
