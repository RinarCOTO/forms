"use client";

import { Input } from "@/components/ui/input";

function formatPin(value: string): string {
  // Keep only digits and B (extension prefix)
  const clean = value.replace(/[^0-9Bb]/g, '').toUpperCase();
  const bIdx = clean.indexOf('B');
  const digits = bIdx === -1 ? clean : clean.slice(0, bIdx);
  const extDigits = bIdx !== -1 ? clean.slice(bIdx + 1).replace(/\D/g, '').slice(0, 3) : null;

  // Segments: 3-2-3-2-3
  const sizes = [3, 2, 3, 2, 3];
  const parts: string[] = [];
  let pos = 0;
  for (const size of sizes) {
    const chunk = digits.slice(pos, pos + size);
    if (!chunk) break;
    parts.push(chunk);
    pos += size;
  }

  let result = parts.join('-');
  if (extDigits !== null) result += (result ? '-' : '') + 'B' + extDigits;
  return result;
}

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function PinInput({
  value,
  onChange,
  placeholder = "046-20-001-01-005-B001",
  maxLength = 22,
  className,
}: PinInputProps) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(formatPin(e.target.value))}
      placeholder={placeholder}
      className={`rpfaas-fill-input font-mono${className ? ` ${className}` : ''}`}
      maxLength={maxLength}
    />
  );
}
