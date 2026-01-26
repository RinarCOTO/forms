"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import "@/app/styles/forms-fill.css";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

const SamplePage2 = () => {
  const router = useRouter();
  const [fieldA, setFieldA] = useState("");
  const [fieldB, setFieldB] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push("/building-other-structure");
  };

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
                <BreadcrumbPage>Sample Page</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-3xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Sample: Page 2 Layout (Reference)</h1>
                <p className="text-sm text-muted-foreground">A minimal reference page that mirrors the layout of page 2.</p>
              </div>
              <Link href="/building-other-structure" className="rpfaas-fill-link text-sm underline underline-offset-4">Go to printable form</Link>
            </header>

            <form onSubmit={handleSubmit} className="rpfaas-fill-form space-y-6">
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Simple Fields</h2>

                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="fieldA">Field A</Label>
                  <Input id="fieldA" value={fieldA} onChange={(e) => setFieldA(e.target.value)} className="rpfaas-fill-input" />
                </div>

                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="fieldB">Field B</Label>
                  <Input id="fieldB" value={fieldB} onChange={(e) => setFieldB(e.target.value)} className="rpfaas-fill-input" />
                </div>
              </section>

              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                <div className="rpfaas-fill-actions flex gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => router.push("/building-other-structure/fill")} className="rpfaas-fill-button rpfaas-fill-button-secondary">Previous</Button>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => { setFieldA(""); setFieldB(""); }} className="rpfaas-fill-button rpfaas-fill-button-secondary">Clear</Button>
                    <Button type="button" onClick={() => router.push("/building-other-structure") } className="rpfaas-fill-button rpfaas-fill-button-primary">Next</Button>
                    <Button type="submit" className="rpfaas-fill-button rpfaas-fill-button-primary">Continue to print page</Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SamplePage2;
