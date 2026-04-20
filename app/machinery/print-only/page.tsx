"use client";

import "@/app/components/forms/RPFAAS/faas_table_forms.css";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MachineryForm, { MachineryFormData } from "@/app/components/forms/RPFAAS/machinery";

function PrintOnlyPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<MachineryFormData | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/faas/machinery/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data) setData(result.data);
      })
      .catch(() => {});
  }, [id]);

  if (!data) return <div style={{ padding: "2rem" }}>Loading…</div>;

  return (
    <>
      <style>{`html, body { background: white !important; margin: 0; padding: 0; }`}</style>
      <div style={{ background: "white", padding: "3mm" }}>
        <MachineryForm data={data} />
      </div>
    </>
  );
}

export default function PrintOnlyPageWrapper() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <PrintOnlyPage />
    </Suspense>
  );
}
