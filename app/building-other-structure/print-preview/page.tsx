"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Edit, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

function PrintPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formId, setFormId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setFormId(id);
      setPreviewUrl(`/building-other-structure/fill/preview-form?id=${id}&print=1`);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col" style={{ width: "100vw", minHeight: "100vh", background: "#fff" }}>
      {/* Navigation bar — lives in the parent window, always updates the browser URL */}
      <div className="print:hidden flex items-center justify-between gap-3 border-b bg-white px-4 py-2 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/building-other-structure/dashboard")}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {formId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/building-other-structure/fill/step-1?id=${formId}`)}
              className="gap-1.5"
            >
              <Edit className="h-4 w-4" />
              Edit Form
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Form content in iframe */}
      {previewUrl ? (
        <iframe
          src={previewUrl}
          title="Print Preview"
          className="flex-1 border-none"
          style={{ width: "100%", minHeight: "calc(100vh - 49px)" }}
          allowFullScreen
        />
      ) : null}
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
