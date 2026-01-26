"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";
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
  const [dateConstructed, setDateConstructed] = useState<number | "">("");
  const [buildingAge, setBuildingAge] = useState<number | "">("");
  const [numberOfStoreys, setNumberOfStoreys] = useState<number | "">(1);
  const [floorAreas, setFloorAreas] = useState<(number | "")[]>([""]);
  const [totalFloorArea, setTotalFloorArea] = useState<number | "">("");

  useEffect(() => {
    if (dateConstructed) {
      const currentYear = new Date().getFullYear();
      setBuildingAge(currentYear - dateConstructed);
    } else {
      setBuildingAge("");
    }
  }, [dateConstructed]);

  useEffect(() => {
    const total = floorAreas.reduce((acc: number, area) => acc + (Number(area) || 0), 0);
    setTotalFloorArea(total > 0 ? total : "");
  }, [floorAreas]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("type_of_building_p2", addressBarangay);
      localStorage.setItem("structural_type_p2", addressMunicipality);
      // Assuming building_permit_no_p2, cct_p2, completion_issued_on_p2, date_occupied_p2 have state
      localStorage.setItem("date_constructed_p2", dateConstructed.toString());
      localStorage.setItem("building_age_p2", buildingAge.toString());
      localStorage.setItem("number_of_storey_p2", numberOfStoreys.toString());
      localStorage.setItem("floor_areas_p2", JSON.stringify(floorAreas));
      localStorage.setItem("total_floor_area_p2", totalFloorArea.toString());
      localStorage.setItem("land_owner_p2", owner);
      // Assuming td_arp_no_p2, land_area_p2 have state
    } catch (error) {
      console.error("Failed to save to localStorage", error);
    }
  }, [addressBarangay, addressMunicipality, dateConstructed, buildingAge, numberOfStoreys, floorAreas, totalFloorArea, owner]);


  const handleDateConstructedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value ? parseInt(e.target.value, 10) : "";
    setDateConstructed(year);
  };

  const handleNumberOfStoreysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const storeys = e.target.value ? parseInt(e.target.value, 10) : "";
    setNumberOfStoreys(storeys);
    if (typeof storeys === 'number' && storeys > 0) {
      setFloorAreas(Array(storeys).fill(""));
    } else {
      setFloorAreas([]);
    }
  };

  const handleFloorAreaChange = (index: number, value: string) => {
    const newFloorAreas = [...floorAreas];
    newFloorAreas[index] = value ? parseFloat(value) : "";
    setFloorAreas(newFloorAreas);
  };

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
                          onChange={(e) => {
                            setAddressBarangay(e.target.value);
                            localStorage.setItem("type_of_building_p2", e.target.value);
                          }}
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
                          onChange={(e) => {
                            setAddressMunicipality(e.target.value);
                            localStorage.setItem("structural_type_p2", e.target.value);
                          }}
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
                        onChange={(e) => localStorage.setItem("building_permit_no_p2", e.target.value)}
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
                        onChange={(e) => localStorage.setItem("cct_p2", e.target.value)}
                      />
                    </div>

                    <div className="rpfaas-fill-field">
                      <Label className="rpfaas-fill-label" htmlFor="completion_issued_on_p2">
                        Certificate of Completion Issued on
                      </Label>
                      <div className="relative group">
                        <select
                          id="completion_issued_on_p2"
                          className="rpfaas-fill-input appearance-none"
                          onChange={(e) => localStorage.setItem("completion_issued_on_p2", e.target.value)}
                        >
                          <option value="">Select Year</option>
                          {Array.from({ length: 2026 - 1900 + 1 }, (_, i) => 1900 + i).reverse().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground transition-transform transform group-focus-within:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="rpfaas-fill-field">
                      <Label className="rpfaas-fill-label" htmlFor="date_constructed_p2">
                        Date Constructed/Completed
                      </Label>
                      <div className="relative group">
                        <select
                          id="date_constructed_p2"
                          className="rpfaas-fill-input appearance-none"
                          onChange={handleDateConstructedChange}
                        >
                          <option value="">Select Year</option>
                          {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => 1900 + i).reverse().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground transition-transform transform group-focus-within:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    <div className="rpfaas-fill-field">
                      <Label className="rpfaas-fill-label" htmlFor="date_occupied_p2">
                        Date Occupied
                      </Label>
                      <div className="relative group">
                        <select
                          id="date_occupied_p2"
                          className="rpfaas-fill-input appearance-none"
                          onChange={(e) => localStorage.setItem("date_occupied_p2", e.target.value)}
                        >
                          <option value="">Select Year</option>
                          {Array.from({ length: 2026 - 1900 + 1 }, (_, i) => 1900 + i).reverse().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground transition-transform transform group-focus-within:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                </div>
              </section>
              <section className="rpfaas-fill-section ">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="rpfaas-fill-label" htmlFor="building_age_p2">
                            Building Age
                            </Label>
                            <Input
                            id="building_age_p2"
                            type="number"
                            value={buildingAge}
                            readOnly
                            className="rpfaas-fill-input bg-gray-100"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="rpfaas-fill-label" htmlFor="number_of_storey_p2">
                                Number of Storey
                            </Label>
                            <Input
                                id="number_of_storey_p2"
                                type="number"
                                value={numberOfStoreys}
                                onChange={handleNumberOfStoreysChange}
                                min={0}
                                className="rpfaas-fill-input"
                            />
                        </div>
                    </div>
                    {Array.from({ length: typeof numberOfStoreys === 'number' ? numberOfStoreys : 0 }).map((_, index) => (
                        <div className="grid grid-cols-3 gap-3" key={index}>
                            <div className="space-y-1">
                                <Label className="rpfaas-fill-labe-sub" htmlFor={`floor_${index + 1}`}>
                                    {index + 1}<sup>{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}</sup> Floor
                                </Label>
                                <div className="relative">
                                    <Input
                                        id={`floor_${index + 1}`}
                                        type="number"
                                        value={floorAreas[index]}
                                        onChange={(e) => handleFloorAreaChange(index, e.target.value)}
                                        className="rpfaas-fill-input pr-12"
                                    />
                                    <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                                    sqm
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
              </section>
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">LAND REFERENCE</h2>
                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="land_owner_p2">
                    Land Owner
                  </Label>
                  <Input id="land_owner_p2" type="text" value={owner} onChange={(e) => {
                    setOwner(e.target.value.toUpperCase());
                    localStorage.setItem("land_owner_p2", e.target.value.toUpperCase());
                  }} className="rpfaas-fill-input" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label" htmlFor="td_arp_no_p2">
                      TD/ARP No.
                    </Label>
                    <Input id="td_arp_no_p2" type="number" className="rpfaas-fill-input" onChange={(e) => localStorage.setItem("td_arp_no_p2", e.target.value)} />
                  </div>

                  <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label" htmlFor="land_area_p2">
                      Area
                    </Label>
                    <div className="relative">
                    <Input id="land_area_p2" type="number" className="rpfaas-fill-input" onChange={(e) => localStorage.setItem("land_area_p2", e.target.value)} />
                      <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                        sqm
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label" htmlFor="total_floor_area_land_p2">
                      TOTAL FLOOR AREA
                    </Label>
                    <div className="relative">
                      <Input 
                        id="total_floor_area_land_p2" 
                        type="number" 
                        className="rpfaas-fill-input bg-gray-100 pr-12"
                        value={totalFloorArea}
                        readOnly
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                        sqm
                      </span>
                    </div>
                  </div>
                </div>

              </section>

              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                <div className="rpfaas-fill-actions flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/building-other-structure/fill")}
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
