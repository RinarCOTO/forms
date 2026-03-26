"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

function PrintPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get("id");
  const previewUrl = formId
    ? `/building-other-structure/fill/preview-form?id=${formId}&print=1&embed=1`
    : null;

  return (
    <div className="flex flex-col" style={{ width: "100vw", minHeight: "100vh", background: "#fff" }}>
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
