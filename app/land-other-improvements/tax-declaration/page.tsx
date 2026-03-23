"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import "@/app/styles/forms-fill.css";
import TaxDeclarationLand from "@/app/components/forms/RPFAAS/tax_declaration_land";

function TaxDeclarationPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    fetch(`/api/faas/land-improvements/${id}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data) setData(result.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 print:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/land-other-improvements">
                  Land &amp; Other Improvements
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/land-other-improvements/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Tax Declaration</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto print:p-0">
          <div className="rpfaas-fill mx-auto max-w-4xl print:max-w-none">

            {/* Page title row */}
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6 print:hidden">
              <div>
                <h1 className="rpfaas-fill-title">Tax Declaration</h1>
                <p className="text-sm text-muted-foreground">
                  Official tax declaration for this land property.
                </p>
              </div>
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="hidden sm:flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </header>

            {/* Form card */}
            <div className="bg-white shadow-sm border p-6 mb-6 print:p-0 print:m-0 print:border-0 print:shadow-none" id="print-area">
              <div className="border p-2 bg-white overflow-x-auto print:p-0 print:border-0">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : data ? (
                  <TaxDeclarationLand data={data} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">No data found.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function TaxDeclarationPageWrapper() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <TaxDeclarationPage />
    </Suspense>
  );
}
