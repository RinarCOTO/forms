"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

const BUILDING_SMV_SECTIONS = [
  {
    label: "Building Types",
    href: "/sources/building/building-types",
  },
  {
    label: "Depreciation Table",
    href: "/sources/building/depreciation-table",
  },
  {
    label: "Deductions & Additionals",
    href: "/sources/building/deductions",
  },
];

export default function SmvBuildingOtherStructuresDashboard() {
  const router = useRouter();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>SMV - Building &amp; Structures</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Schedule of Market Value - Building &amp; Structures</CardTitle>
                <CardDescription>Select a building source table</CardDescription>
              </CardHeader>
              <CardContent className="divide-y rounded-md border p-0">
                {BUILDING_SMV_SECTIONS.map((section) => (
                  <button
                    key={section.href}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-primary/10"
                    onClick={() => router.push(section.href)}
                  >
                    <span className="font-medium">{section.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
