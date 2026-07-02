"use client";

const MEMORANDA_PREFIX_PATTERN =
  /^(NEW|TRANSFER|SUBDIVISION|CONSOLIDATION|PHYSICAL CHANGE|REASSESSMENT|DEMOLITION|GENERAL REVISION|DEPRECIATION)(\s*[-:]\s*)([\s\S]*)$/i;

export function MemorandaText({ value }: { value?: string | null }) {
  const text = value ?? "";
  const match = text.match(MEMORANDA_PREFIX_PATTERN);

  if (!match) return <>{text}</>;

  const [, prefix, separator, rest] = match;
  return (
    <>
      <strong>{prefix.toUpperCase()}</strong>
      {separator}
      {rest}
    </>
  );
}
