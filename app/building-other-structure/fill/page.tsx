"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
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
import { DUMMY_PROVINCES, DUMMY_MUNICIPALITIES, DUMMY_BARANGAYS } from "@/app/components/forms/RPFAAS/constants/locations";

// --- Utility Types ---
type LocationOption = { code: string; name: string };

function safeSetLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch { /* ignore */ }
}

// --- Custom Hook for Cascading Locations (Using Dummy Data) ---
function useLocationSelect(storagePrefix: string, initialProvinceCode = "") {
  const [provinceCode, setProvinceCode] = useState(initialProvinceCode);
  const [municipalityCode, setMunicipalityCode] = useState("");
  const [barangayCode, setBarangayCode] = useState("");

  const [municipalities, setMunicipalities] = useState<LocationOption[]>([]);
  const [barangays, setBarangays] = useState<LocationOption[]>([]);

  // 1. Filter Municipalities when Province changes
  useEffect(() => {
    // Reset child selections
    setMunicipalityCode("");
    setBarangayCode("");
    
    if (!provinceCode) {
      setMunicipalities([]);
      return;
    }

    // SIMULATE API CALL: Filter the dummy list based on provinceCode
    const filtered = DUMMY_MUNICIPALITIES.filter(m => m.provinceCode === provinceCode);
    setMunicipalities(filtered);

  }, [provinceCode]);

  // 2. Filter Barangays when Municipality changes
  useEffect(() => {
    // Reset child selection
    setBarangayCode("");

    if (!municipalityCode) {
      setBarangays([]);
      return;
    }

    // SIMULATE API CALL: Filter the dummy list based on municipalityCode
    const filtered = DUMMY_BARANGAYS.filter(b => b.municipalityCode === municipalityCode);
    setBarangays(filtered);

  }, [municipalityCode]);

  // 3. Persist to Local Storage
  useEffect(() => {
    safeSetLS(`${storagePrefix}_province_code`, provinceCode);
    safeSetLS(`${storagePrefix}_municipality_code`, municipalityCode);
    safeSetLS(`${storagePrefix}_barangay_code`, barangayCode);
  }, [provinceCode, municipalityCode, barangayCode, storagePrefix]);

  return {
    provinceCode, setProvinceCode,
    municipalityCode, setMunicipalityCode,
    barangayCode, setBarangayCode,
    municipalities,
    barangays
  };
}

const FORM_NAME = "building_other_structure_fill";

export default function BuildingOtherStructureFillPage() {
  const router = useRouter();

  // Basic Fields
  const [ownerName, setOwnerName] = useState("");
  const [adminCareOf, setAdminCareOf] = useState("");
  const [propertyStreet, setPropertyStreet] = useState("");

  // --- Use Custom Hooks for the 3 Address Sections ---
  const ownerLoc = useLocationSelect("rpfaas_owner_address");
  const adminLoc = useLocationSelect("rpfaas_admin");
  const propLoc  = useLocationSelect("rpfaas_location", DUMMY_PROVINCES[0].code);

  // Simple string persistence
  useEffect(() => safeSetLS("rpfaas_owner_name", ownerName), [ownerName]);
  useEffect(() => safeSetLS("rpfaas_admin_careof", adminCareOf), [adminCareOf]);
  useEffect(() => safeSetLS("rpfaas_location_street", propertyStreet), [propertyStreet]);

  const handleSave = () => {
    // This function will explicitly save all data to localStorage.
    // Note: The useEffect hooks already save data on change, but this provides an explicit save action.
    safeSetLS("rpfaas_owner_name", ownerName);
    safeSetLS("rpfaas_admin_careof", adminCareOf);
    safeSetLS("rpfaas_location_street", propertyStreet);
    
    // Save location data
    safeSetLS("rpfaas_owner_address_province_code", ownerLoc.provinceCode);
    safeSetLS("rpfaas_owner_address_municipality_code", ownerLoc.municipalityCode);
    safeSetLS("rpfaas_owner_address_barangay_code", ownerLoc.barangayCode);

    safeSetLS("rpfaas_admin_province_code", adminLoc.provinceCode);
    safeSetLS("rpfaas_admin_municipality_code", adminLoc.municipalityCode);
    safeSetLS("rpfaas_admin_barangay_code", adminLoc.barangayCode);

    safeSetLS("rpfaas_location_province_code", propLoc.provinceCode);
    safeSetLS("rpfaas_location_municipality_code", propLoc.municipalityCode);
    safeSetLS("rpfaas_location_barangay_code", propLoc.barangayCode);

    // You can add a notification here to confirm saving, e.g., using a toast library
    alert("Form data saved!");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push("/building-other-structure");
  };

  // Reusable Select Component
  const LocationSelect = ({ 
    label, value, onChange, options, disabled, placeholder 
  }: { 
    label: string, value: string, onChange: (val: string) => void, options: LocationOption[], disabled?: boolean, placeholder: string 
  }) => (
    <div className="space-y-1">
      <Label className="rpfaas-fill-label-sub">{label}</Label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rpfaas-fill-input appearance-none"
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.code} value={opt.code}>{opt.name}</option>
          ))}
        </select>
        {/* Chevron Icon */}
        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );

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
                <BreadcrumbPage>Step 1: Enter Owner and Property Location Details.</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-3xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Fill-up Form: RPFAAS - Building &amp; Other Structures</h1>
                <p className="text-sm text-muted-foreground">Enter the details below. You can generate the printable version afterwards.</p>
              </div>
            </header>

            <form id={`form_${FORM_NAME}_main`} onSubmit={handleSubmit} className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">
              
              {/* OWNER SECTION */}
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Owner Information</h2>
                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label">Owner</Label>
                  <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="rpfaas-fill-input" />
                </div>
                
                <div className="rpfaas-fill-field">
                  <Label className="rpfaas-fill-label">Address</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <LocationSelect
                      label="Province"
                      value={ownerLoc.provinceCode}
                      onChange={ownerLoc.setProvinceCode}
                      options={DUMMY_PROVINCES}
                      placeholder="Select Province"
                    />
                    <LocationSelect
                      label="Municipality"
                      value={ownerLoc.municipalityCode}
                      onChange={ownerLoc.setMunicipalityCode}
                      options={ownerLoc.municipalities}
                      disabled={!ownerLoc.provinceCode}
                      placeholder="Select Municipality"
                    />
                    <LocationSelect
                      label="Barangay"
                      value={ownerLoc.barangayCode}
                      onChange={ownerLoc.setBarangayCode}
                      options={ownerLoc.barangays}
                      disabled={!ownerLoc.municipalityCode}
                      placeholder="Select Barangay"
                    />
                  </div>
                </div>

                <div className="rpfaas-fill-field space-y-1 mt-4">
                  <Label className="rpfaas-fill-label">Administration/Care of</Label>
                  <Input value={adminCareOf} onChange={(e) => setAdminCareOf(e.target.value)} className="rpfaas-fill-input capitalize" />
                </div>

                {/* ADMIN ADDRESS */}
                <div className="rpfaas-fill-field mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <LocationSelect
                      label="Province"
                      value={adminLoc.provinceCode}
                      onChange={adminLoc.setProvinceCode}
                      options={DUMMY_PROVINCES}
                      placeholder="Select Province"
                    />
                    <LocationSelect
                      label="Municipality"
                      value={adminLoc.municipalityCode}
                      onChange={adminLoc.setMunicipalityCode}
                      options={adminLoc.municipalities}
                      disabled={!adminLoc.provinceCode}
                      placeholder="Select Municipality"
                    />
                    <LocationSelect
                      label="Barangay"
                      value={adminLoc.barangayCode}
                      onChange={adminLoc.setBarangayCode}
                      options={adminLoc.barangays}
                      disabled={!adminLoc.municipalityCode}
                      placeholder="Select Barangay"
                    />
                  </div>
                </div>
              </section>

              {/* PROPERTY LOCATION SECTION */}
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Location Property</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label">No/Street/Sitio</Label>
                    <Input value={propertyStreet} onChange={(e) => setPropertyStreet(e.target.value)} className="rpfaas-fill-input" />
                  </div>
                  <div className="space-y-1">
                      <Label className="rpfaas-fill-label-sub">Province</Label>
                      <Input value={DUMMY_PROVINCES[0].name} className="rpfaas-fill-input" readOnly disabled />
                    </div>
                    <LocationSelect
                      label="Municipality"
                      value={propLoc.municipalityCode}
                      onChange={propLoc.setMunicipalityCode}
                      options={propLoc.municipalities}
                      placeholder="Select Municipality"
                    />
                    <LocationSelect
                      label="Barangay"
                      value={propLoc.barangayCode}
                      onChange={propLoc.setBarangayCode}
                      options={propLoc.barangays}
                      disabled={!propLoc.municipalityCode}
                      placeholder="Select Barangay"
                    />
                </div>
              </section>

              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                <div className="rpfaas-fill-actions flex gap-2 justify-between items-center">
                  <Button 
                    type="button" 
                    onClick={handleSave} 
                    variant="outline"
                    className="rpfaas-fill-button rpfaas-fill-button-secondary"
                  >
                    Save
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => router.push("/building-other-structure/fill/step-2")} 
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
}