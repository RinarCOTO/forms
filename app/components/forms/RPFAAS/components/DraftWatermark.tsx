"use client";

export function DraftWatermark({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="rpfaas-draft-watermark" aria-hidden="true">
      DRAFT
    </div>
  );
}
