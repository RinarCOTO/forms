"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import "@/app/styles/forms-fill.css";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Printer } from "lucide-react";
import TaxDeclarationLand from "@/app/components/forms/RPFAAS/tax_declaration_land";

function LandTaxDecPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetch(`/api/faas/land-improvements/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 print:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/tax-declaration">Tax Declarations</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Land &amp; Improvements</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto print:p-0">
          <div className="rpfaas-fill max-w-4xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6 print:hidden">
              <div>
                <h1 className="rpfaas-fill-title">Tax Declaration — Land &amp; Improvements</h1>
                <p className="text-sm text-muted-foreground">Print or review the approved tax declaration.</p>
              </div>
              <Button onClick={() => window.print()} variant="outline" className="hidden sm:flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </header>

            <div className="bg-white shadow-sm border p-6" id="print-area">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : data ? (
                <TaxDeclarationLand data={data as Parameters<typeof TaxDeclarationLand>[0]["data"]} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No record found.</p>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function LandTaxDecPageWrapper() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <LandTaxDecPage />
    </Suspense>
  );
}
