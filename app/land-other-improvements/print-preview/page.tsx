"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { ArrowLeft, Edit, Printer, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRINT_ALLOWED_ROLES = [
  "provincial_assessor",
  "assistant_provincial_assessor",
  "super_admin",
  "municipal_assessor",
];

function PrintPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get("id");
  const previewUrl = formId
    ? `/land-other-improvements/fill/preview-form?id=${formId}&print=1&embed=1`
    : null;

  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [canPrint, setCanPrint] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!formId) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/print/land-improvements/${formId}`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RPFAAS-Land-${formId}-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!formId) return;
    fetch(`/api/faas/land-improvements/${formId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data?.status) setFormStatus(result.data.status);
      })
      .catch(() => {});
  }, [formId]);

  useEffect(() => {
    fetch("/api/users/permissions")
      .then((r) => r.json())
      .then((d) => {
        if (d?.role && PRINT_ALLOWED_ROLES.includes(d.role)) setCanPrint(true);
      })
      .catch(() => {});
  }, []);

  // Always block browser printing — users must use the Download PDF button (server-generated)
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "print-blocked";
    style.textContent = `@media print { body { display: none !important; } }`;
    document.head.appendChild(style);
    return () => document.getElementById("print-blocked")?.remove();
  }, []);

  return (
    <div className="flex flex-col" style={{ width: "100vw", minHeight: "100vh", background: "#fff" }}>
      <div className="print:hidden flex items-center justify-between gap-3 border-b bg-white px-4 py-2 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/land-other-improvements/dashboard")}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {formId && formStatus !== "approved" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/land-other-improvements/fill/step-1?id=${formId}`)}
              className="gap-1.5"
            >
              <Edit className="h-4 w-4" />
              Edit Form
            </Button>
          )}
          {formStatus === "approved" && (
            <span className="text-xs text-muted-foreground px-2">
              Approved — editing locked
            </span>
          )}
          {formStatus === "approved" && canPrint && (
            <>
              <Button
                size="sm"
                onClick={() => { window.open(`/api/print/land-improvements/${formId}`, '_blank'); }}
                className="gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="gap-1.5"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isExporting ? 'Exporting…' : 'Export'}
              </Button>
            </>
          )}
        </div>
      </div>

      {previewUrl && (
        <iframe
          key={previewUrl}
          src={previewUrl}
          title="Print Preview"
          className="flex-1 border-none"
          style={{ width: "100%", minHeight: "calc(100vh - 49px)" }}
          allowFullScreen
        />
      )}
    </div>
  );
}

export default function PrintPreviewPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintPreviewPage />
    </Suspense>
  );
}
