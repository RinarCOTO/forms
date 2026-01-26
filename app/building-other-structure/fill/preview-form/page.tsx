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
import Link from "next/link";
import { useRef, useState, useCallback } from "react";

export default function PreviewFormPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<string | number>('100vh'); // Initial height

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      // Set a timeout to ensure content has rendered and styles are applied
      setTimeout(() => {
        const height = iframe.contentWindow?.document.body.scrollHeight;
        if (height) {
          setIframeHeight(`${height + 50}px`); // Add some buffer
        }
      }, 500); // 500ms delay
    }
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Print Preview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-5xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Print Preview</h1>
                <p className="text-sm text-muted-foreground">Review the form before printing.</p>
              </div>
              <div className="hidden sm:flex">
                <Button onClick={handlePrint} className="rpfaas-fill-button rpfaas-fill-button-primary">Print</Button>
              </div>
            </header>

            <div className="bg-white shadow-sm border p-6" id="print-area">
              {/* Print preview container: render the printable form content here */}
              <div className="preview-container">
                <div className="mb-2 text-sm text-muted-foreground">
                  Route: <Link href="/building-other-structure" className="text-blue-600 hover:underline">/building-other-structure</Link>
                </div>
                <div className="border p-2 bg-white">
                  <iframe
                  ref={iframeRef}
                  src="/building-other-structure"
                  title="Building Structure Preview"
                  className="w-full border"
                  style={{ height: iframeHeight }}
                  onLoad={handleIframeLoad}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                  The route content is loaded in the iframe above. Open the link to view standalone or use Print for this preview.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end sm:hidden">
              <Button onClick={handlePrint} className="rpfaas-fill-button rpfaas-fill-button-primary">Print</Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
