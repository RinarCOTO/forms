"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { checkIfDataIsApplied } from "@/lib/utils";
import "@/app/styles/form-fill.css";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Loader2 } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";

const LandOtherImprovementFormFillPage2 = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftId = searchParams.get("id");
    const [isSaving, setIsSaving] = useState(false);

    const FORM_NAME = "land-other-improvements-fill-2";

    useEffect(() => {
        const isDataApplied = checkIfDataIsApplied();
        if (isDataApplied) {
            router.push("/error-page");
        }
    }, []);
      const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.push("/building-other-structure");
      };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-m1 -1"/>
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/land-other-improvements/dashboard">Land Other Improvements Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Property Boundaries</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="rpfaas-fill max-w-3xl mx-auto">
                        <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="rpfaas-fill-title">Fill-up form: Property Boundaries</h1>
                            </div>
                        </header>
                        <form 
                        id={`form_${FORM_NAME}`}
                        data-form-name={FORM_NAME}
                        onSubmit={handleSubmit}
                        ></form>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default LandOtherImprovementFormFillPage2;
