"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, FormEvent } from "react";
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

const BuildingOtherStructureFillPage1 = () => {
  const router = useRouter();

  const FORM_NAME = "building_other_structure_fill";

  const [owner, setOwner] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem("rpfaas_owner_name", owner);
    } catch (e) {
      // ignore
    }
  }, [owner]);
  // Address dropdowns (primary address)
  const [addressBarangay, setAddressBarangay] = useState("");
  const [addressMunicipality, setAddressMunicipality] = useState("");
  const [addressProvince, setAddressProvince] = useState("");
  const [adminCareOf, setAdminCareOf] = useState("");
  // Admin location dropdowns
  const [barangay, setBarangay] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [province, setProvince] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push("/building-other-structure");
  };

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* TOP APP BAR WITH BREADCRUMB */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-3xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">
                  Fill-up Form: RPFAAS - Building &amp; Other Structures
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter the details below. You can generate the printable version
                  afterwards.
                </p>
              </div>
            </header>

            {/* single-column form container */}
            <form
              id={`form_${FORM_NAME}_p1`}
              data-form-name={FORM_NAME}
              onSubmit={handleSubmit}
              className="rpfaas-fill-form rpfaas-fill-form-single space-y-6"
            >
              <input type="hidden" name="formName" value={FORM_NAME} />

              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Owner Information</h2>

                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="bofs_owner_name_p1">
                    Owner
                  </Label>
                  <Input
                    id="bofs_owner_name_p1"
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="rpfaas-fill-input"
                  />
                </div>

                <div className="rpfaas-fill-field">
                  <Label className="rpfaas-fill-label">Address</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="rpfaas-fill-labe-sub" htmlFor="bofs_owner_address_barangay_p1">
                        Barangay / Sitio
                      </Label>
                      <div className="relative">
                        <select
                          id="bofs_owner_address_barangay_p1"
                          value={addressBarangay}
                          onChange={(e) => setAddressBarangay(e.target.value)}
                          className="rpfaas-fill-input appearance-none"
                        >
                          <option value="">Select barangay/sitio</option>
                          <option value="Barangay 1">Barangay 1</option>
                          <option value="Barangay 2">Barangay 2</option>
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="rpfaas-fill-label-sub" htmlFor="bofs_owner_address_municipality_p1">
                        Municipality
                      </Label>
                      <div className="relative">
                        <select
                          id="bofs_owner_address_municipality_p1"
                          value={addressMunicipality}
                          onChange={(e) => setAddressMunicipality(e.target.value)}
                          className="rpfaas-fill-input appearance-none"
                        >
                          <option value="">Select municipality</option>
                          <option value="Municipality A">Municipality A</option>
                          <option value="Municipality B">Municipality B</option>
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="rpfaas-fill-label-sub" htmlFor="bofs_owner_address_province_p1">
                        Province
                      </Label>
                      <div className="relative">
                        <select
                          id="bofs_owner_address_province_p1"
                          value={addressProvince}
                          onChange={(e) => setAddressProvince(e.target.value)}
                          className="rpfaas-fill-input appearance-none"
                        >
                          <option value="">Select province</option>
                          <option value="Province X">Province X</option>
                          <option value="Province Y">Province Y</option>
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="bofs_owner_admin_careof_p1">
                    Administration/Care of
                  </Label>
                  <Input
                    id="bofs_owner_admin_careof_p1"
                    type="text"
                    value={adminCareOf}
                    onChange={(e) => setAdminCareOf(e.target.value)}
                    className="rpfaas-fill-input"
                  />
                </div>

                <div className="rpfaas-fill-field">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="rpfaas-fill-label-sub" htmlFor="bofs_admin_barangay_p1">
                        Barangay / Sitio
                      </Label>
                      <div className="relative">
                        <select
                          id="bofs_admin_barangay_p1"
                          value={barangay}
                          onChange={(e) => setBarangay(e.target.value)}
                          className="rpfaas-fill-input appearance-none"
                        >
                          <option value="">Select barangay/sitio</option>
                          <option value="Barangay 1">Barangay 1</option>
                          <option value="Barangay 2">Barangay 2</option>
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="rpfaas-fill-label-sub" htmlFor="bofs_admin_municipality_p1">
                        Municipality
                      </Label>
                      <div className="relative">
                        <select
                          id="bofs_admin_municipality_p1"
                          value={municipality}
                          onChange={(e) => setMunicipality(e.target.value)}
                          className="rpfaas-fill-input appearance-none"
                        >
                          <option value="">Select municipality</option>
                          <option value="Municipality A">Municipality A</option>
                          <option value="Municipality B">Municipality B</option>
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="rpfaas-fill-label-sub" htmlFor="bofs_admin_province_p1">
                        Province
                      </Label>
                      <div className="relative">
                        <select
                          id="bofs_admin_province_p1"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          className="rpfaas-fill-input appearance-none"
                        >
                          <option value="">Select province</option>
                          <option value="Province X">Province X</option>
                          <option value="Province Y">Province Y</option>
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Location Property</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label" htmlFor="bofs_location_street_p1">
                      No/Street/Sitio
                    </Label>
                    <Input
                      id="bofs_location_street_p1"
                      type="text"
                      value={adminCareOf}
                      onChange={(e) => setAdminCareOf(e.target.value)}
                      className="rpfaas-fill-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label-sub" htmlFor="bofs_location_municipality_p1">
                      Municipality
                    </Label>
                    <div className="relative">
                      <select
                        id="bofs_location_municipality_p1"
                        value={addressMunicipality}
                        onChange={(e) => setAddressMunicipality(e.target.value)}
                        className="rpfaas-fill-input appearance-none"
                      >
                        <option value="">Select municipality</option>
                        <option value="Municipality A">Municipality A</option>
                        <option value="Municipality B">Municipality B</option>
                      </select>
                      <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label-sub" htmlFor="bofs_location_barangay_p1">
                      Barangay
                    </Label>
                    <div className="relative">
                      <select
                        id="bofs_location_barangay_p1"
                        value={addressBarangay}
                        onChange={(e) => setAddressBarangay(e.target.value)}
                        className="rpfaas-fill-input appearance-none"
                      >
                        <option value="">Select barangay/sitio</option>
                        <option value="Barangay 1">Barangay 1</option>
                        <option value="Barangay 2">Barangay 2</option>
                      </select>
                      <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label-sub" htmlFor="bofs_location_province_p1">
                      Province
                    </Label>
                    <div className="relative">
                      <select
                        id="bofs_location_province_p1"
                        value={addressProvince}
                        onChange={(e) => setAddressProvince(e.target.value)}
                        className="rpfaas-fill-input appearance-none"
                      >
                        <option value="">Select province</option>
                        <option value="Province X">Province X</option>
                        <option value="Province Y">Province Y</option>
                      </select>
                      <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </section>

              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                <div className="rpfaas-fill-actions flex gap-2 justify-between items-center">
                  <div className="flex gap-2">
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => router.push("/building-other-structure/fill/page-2")}
                      className="rpfaas-fill-button rpfaas-fill-button-primary"
                    >
                      Next
                    </Button>
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

export default BuildingOtherStructureFillPage1;
