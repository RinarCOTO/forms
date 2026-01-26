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

const BuildingStructureFormFillPage2 = () => {
  const router = useRouter();

  const FORM_NAME = "building_other_structure_fill_p2";

  const [owner, setOwner] = useState("");
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
                <BreadcrumbPage>General Description</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-3xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Fill-up Form: General Description</h1>
              </div>
            </header>

            {/* single-column form container */}
            <form
              id={`form_${FORM_NAME}`}
              data-form-name={FORM_NAME}
              onSubmit={handleSubmit}
              className="rpfaas-fill-form rpfaas-fill-form-single space-y-6"
            >
              <input type="hidden" name="formName" value={FORM_NAME} />
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">General Description</h2>
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="rpfaas-fill-label" htmlFor="type_of_building_p2">
                        Type of Building
                      </Label>
                      <div className="relative group">
                        <select
                          id="type_of_building_p2"
                          value={addressBarangay}
                          onChange={(e) => setAddressBarangay(e.target.value)}
                          className="rpfaas-fill-input appearance-none"
                        >
                          <option value="">Select Type of Bldg</option>
                          <option value="residential">Residential Building</option>
                          <option value="commercial">Commercial Building</option>
                          <option value="industrial">Industrial Buildings</option>
                          <option value="agricultural">Agricultural Structures</option>
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground transition-transform transform group-focus-within:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="rpfaas-fill-label" htmlFor="structural_type_p2">
                        Structural Type
                      </Label>
                      <div className="relative group">
                        <select
                          id="structural_type_p2"
                          value={addressMunicipality}
                          onChange={(e) => setAddressMunicipality(e.target.value)}
                          className="rpfaas-fill-input appearance-none"
                        >
                          <option value="">Select Structural Type</option>
                          <option value="type_a">Type A</option>
                          <option value="type_b">Type B</option>
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground transition-transform transform group-focus-within:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    <div className="rpfaas-fill-field">
                      <Label className="rpfaas-fill-label" htmlFor="building_permit_no_p2">
                        Building Permit No.
                      </Label>
                      <Input
                        id="building_permit_no_p2"
                        type="text"
                        className="rpfaas-fill-input"
                      />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="rpfaas-fill-field">
                      <Label className="rpfaas-fill-label" htmlFor="cct_p2">
                        Condominium Certificate of Title (CCT)
                      </Label>
                      <Input
                        id="cct_p2"
                        type="text"
                        className="rpfaas-fill-input"
                      />
                    </div>

                    <div className="rpfaas-fill-field">
                      <Label className="rpfaas-fill-label" htmlFor="completion_issued_on_p2">
                        Certificate of Completion Issued on
                      </Label>
                      <Input
                        id="completion_issued_on_p2"
                        type="date"
                        className="rpfaas-fill-input"
                      />
                    </div>

                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="rpfaas-fill-field">
                      <Label className="rpfaas-fill-label" htmlFor="date_constructed_p2">
                        Date Constructed/Completed
                      </Label>
                      <Input
                        id="date_constructed_p2"
                        type="date"
                        className="rpfaas-fill-input"
                      />
                    </div>

                    <div className="rpfaas-fill-field">
                      <Label className="rpfaas-fill-label" htmlFor="date_occupied_p2">
                        Date Occupied
                      </Label>
                      <Input
                        id="date_occupied_p2"
                        type="date"
                        className="rpfaas-fill-input"
                      />
                    </div>
                </div>
              </section>
              <section className="rpfaas-fill-section ">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="rpfaas-fill-label" htmlFor="location_street">
                            Building Age
                            </Label>
                            <Input
                            id="location_street"
                            type="number"
                            value={adminCareOf}
                            onChange={(e) => setAdminCareOf(e.target.value)}
                            className="rpfaas-fill-input"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="rpfaas-fill-label" htmlFor="location_street">
                                Number of Storey
                            </Label>
                            <Input
                                id="location_street"
                                type="number"
                                value={adminCareOf}
                                onChange={(e) => setAdminCareOf(e.target.value)}
                                min={0}
                                max={60}
                                className="rpfaas-fill-input"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="rpfaas-fill-labe-sub" htmlFor="location_street">
                                1<sup>st</sup>Floor
                            </Label>
                            <Input
                                id="location_street"
                                type="number"
                                value={adminCareOf}
                                onChange={(e) => setAdminCareOf(e.target.value)}
                                min={0}
                                max={60}
                                className="rpfaas-fill-input"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="rpfaas-fill-labe-sub" htmlFor="location_street">
                                2<sup>nd</sup>Floor
                            </Label>
                            <Input
                                id="location_street"
                                type="number"
                                value={adminCareOf}
                                onChange={(e) => setAdminCareOf(e.target.value)}
                                min={0}
                                max={60}
                                className="rpfaas-fill-input"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="rpfaas-fill-labe-sub" htmlFor="location_street">
                                3<sup>rd</sup>Floor
                            </Label>
                            <Input
                                id="location_street"
                                type="number"
                                value={adminCareOf}
                                onChange={(e) => setAdminCareOf(e.target.value)}
                                min={0}
                                max={60}
                                className="rpfaas-fill-input"
                            />
                        </div>
                    </div>
              </section>
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">LAND REFERENCE</h2>
                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="land_owner_p2">
                    Land Owner
                  </Label>
                  <Input id="land_owner_p2" type="text" value={owner} onChange={(e) => setOwner(e.target.value.toUpperCase())} className="rpfaas-fill-input" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label" htmlFor="td_arp_no_p2">
                      TD/ARP No.
                    </Label>
                    <Input id="td_arp_no_p2" type="number" className="rpfaas-fill-input" />
                  </div>

                  <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label" htmlFor="land_area_p2">
                      Area
                    </Label>
                    <Input id="land_area_p2" type="number" className="rpfaas-fill-input" />
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label" htmlFor="total_floor_area_land_p2">
                      TOTAL FLOOR AREA
                    </Label>
                    <Input id="total_floor_area_land_p2" type="number" className="rpfaas-fill-input" />
                  </div>
                </div>

              </section>

              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                <div className="rpfaas-fill-actions flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/building-other-structure/fill/step-1")}
                    className="rpfaas-fill-button rpfaas-fill-button-secondary"
                  >
                    Previous
                  </Button>

                  <Button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/building-other-structure/fill/step-3"
                      )
                    }
                    className="rpfaas-fill-button rpfaas-fill-button-primary"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default BuildingStructureFormFillPage2;
