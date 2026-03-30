"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { ArrowLeft, Edit, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRINT_ALLOWED_ROLES = [
  "provincial_assessor",
  "assistant_provincial_assessor",
  "super_admin",
  "municipal_tax_mapper",
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
            <Button
              size="sm"
              onClick={() => { window.location.href = `/api/print/land-improvements/${formId}`; }}
              className="gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Download PDF
            </Button>
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
