"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import { ArrowLeft, Edit, History, ArrowRight, User, Clock, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const HISTORY_ALLOWED_ROLES = [
  "provincial_assessor",
  "assistant_provincial_assessor",
  "admin",
  "super_admin",
];

const PRINT_ALLOWED_ROLES = [
  "provincial_assessor",
  "assistant_provincial_assessor",
  "super_admin",
  "municipal_tax_mapper",
];

interface HistoryEntry {
  id: string;
  from_label: string;
  to_label: string;
  actor_name: string;
  actor_role_label: string;
  note: string | null;
  created_at: string;
}

function PrintPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get("id");
  const previewUrl = formId
    ? `/building-other-structure/fill/preview-form?id=${formId}&print=1&embed=1`
    : null;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [canViewHistory, setCanViewHistory] = useState(false);
  const [canPrint, setCanPrint] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!formId) return;
    fetch(`/api/faas/building-structures/${formId}`)
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
        if (d?.role && HISTORY_ALLOWED_ROLES.includes(d.role)) setCanViewHistory(true);
        if (d?.role && PRINT_ALLOWED_ROLES.includes(d.role)) setCanPrint(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!formId || !canViewHistory) return;
    setHistoryLoading(true);
    fetch(`/api/faas/building-structures/${formId}/history`)
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setHistory(result.data);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [formId, canViewHistory]);

  return (
    <div className="flex flex-col" style={{ width: "100vw", minHeight: "100vh", background: "#fff" }}>
      {/* Top bar */}
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
          {formId && formStatus !== "approved" && (
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
          {formStatus === "approved" && (
            <span className="text-xs text-muted-foreground px-2">
              Approved — editing locked
            </span>
          )}
          {formStatus === "approved" && canPrint && (
            <Button
              size="sm"
              onClick={() => { window.location.href = `/api/print/building-structures/${formId}`; }}
              className="gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Body — iframe + optional activity log panel */}
      <div className={`flex flex-1 min-h-0 ${canViewHistory ? "gap-0" : ""}`}>
        {previewUrl && (
          <iframe
            ref={iframeRef}
            key={previewUrl}
            src={previewUrl}
            title="Print Preview"
            className="flex-1 border-none"
            style={{ minHeight: "calc(100vh - 49px)" }}
            allowFullScreen
          />
        )}

        {/* Activity Log Panel */}
        {canViewHistory && (
          <div className="w-80 shrink-0 border-l border-border bg-card print:hidden overflow-y-auto" style={{ maxHeight: "calc(100vh - 49px)" }}>
            <div className="sticky top-0 bg-accent border-b border-border px-4 py-3 z-10">
              <div className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
                <History className="h-4 w-4 text-primary" />
                Activity Log
              </div>
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-4">No activity recorded yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {history.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 space-y-1.5 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="text-muted-foreground">{entry.from_label}</span>
                      <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-foreground font-semibold">{entry.to_label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                      <User className="h-3 w-3 shrink-0" />
                      <span>{entry.actor_name}</span>
                      <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">{entry.actor_role_label}</span>
                    </div>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                        {entry.note}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
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
