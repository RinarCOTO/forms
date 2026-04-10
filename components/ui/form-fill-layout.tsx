"use client";

import React from "react";
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

type Props = {
  breadcrumbParent: { label: string; href: string };
  pageTitle: React.ReactNode;
  children: React.ReactNode;
  /** Defaults to "rpfaas-fill max-w-3xl mx-auto" */
  contentClassName?: string;
  /** Rendered inside SidebarProvider but outside SidebarInset (e.g. ReviewCommentsFloat) */
  sidePanel?: React.ReactNode;
};

export function FormFillLayout({
  breadcrumbParent,
  pageTitle,
  children,
  contentClassName = "rpfaas-fill max-w-3xl mx-auto",
  sidePanel,
}: Props) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={breadcrumbParent.href}>
                  {breadcrumbParent.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className={contentClassName}>{children}</div>
        </div>
      </SidebarInset>
      {sidePanel}
    </SidebarProvider>
  );
}
