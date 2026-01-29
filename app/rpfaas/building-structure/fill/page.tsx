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
import { useSaveForm } from "@/hooks/useSaveForm";
import { SaveButton, SaveStatus } from "@/components/SaveButton";

// --- DUMMY DATA ---
// We add "parent" codes (provinceCode/municipalityCode) to create the relationships

const PAGE_DESCRIPTION = "Step 1: Enter Owner and Property Location Details.";

const DUMMY_PROVINCES = [
  { code: "P-01", name: "Metro Manila" },
  { code: "P-02", name: "Cebu" },
  { code: "P-03", name: "Davao del Sur" },
];

const DUMMY_MUNICIPALITIES = [
  // Metro Manila Cities
  { code: "M-01-A", provinceCode: "P-01", name: "Makati City" },
  { code: "M-01-B", provinceCode: "P-01", name: "Taguig City" },
  // Cebu Cities
  { code: "M-02-A", provinceCode: "P-02", name: "Cebu City" },
  { code: "M-02-B", provinceCode: "P-02", name: "Mandaue City" },
  // Davao Cities
  { code: "M-03-A", provinceCode: "P-03", name: "Davao City" },
];

const DUMMY_BARANGAYS = [
  // Makati
  { code: "B-01-A-1", municipalityCode: "M-01-A", name: "Bel-Air" },
  { code: "B-01-A-2", municipalityCode: "M-01-A", name: "Poblacion" },
  // Taguig
  { code: "B-01-B-1", municipalityCode: "M-01-B", name: "Fort Bonifacio" },
  // Cebu City
  { code: "B-02-A-1", municipalityCode: "M-02-A", name: "Lahug" },
  // Davao City
  { code: "B-03-A-1", municipalityCode: "M-03-A", name: "Buhangin" },
];

// --- Utility Types ---
type LocationOption = { code: string; name: string };

function safeSetLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch { /* ignore */ }
}

// --- Custom Hook for Cascading Locations (Using Dummy Data) ---
function useLocationSelect(storagePrefix: string) {
  const [provinceCode, setProvinceCode] = useState("");
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
  const propLoc  = useLocationSelect("rpfaas_location");

  // --- Save Form Hook ---
  const {
    isSaving,
    lastSaved,
    saveDraft,
    saveToDatabaseAsDraft,
    loadDraft,
    saveError,
  } = useSaveForm({
    formType: 'building-structure',
    step: 1,
  });

  // Load draft data on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      // Load from new database format
      if (draft.ownerName) setOwnerName(draft.ownerName);
      
      // Also support old localStorage format for backward compatibility
      if (draft.adminCareOf) setAdminCareOf(draft.adminCareOf);
      if (draft.propertyStreet) setPropertyStreet(draft.propertyStreet);
      
      // Load location data (old format)
      if (draft.ownerProvinceCode) ownerLoc.setProvinceCode(draft.ownerProvinceCode);
      if (draft.ownerMunicipalityCode) ownerLoc.setMunicipalityCode(draft.ownerMunicipalityCode);
      if (draft.ownerBarangayCode) ownerLoc.setBarangayCode(draft.ownerBarangayCode);
      
      if (draft.adminProvinceCode) adminLoc.setProvinceCode(draft.adminProvinceCode);
      if (draft.adminMunicipalityCode) adminLoc.setMunicipalityCode(draft.adminMunicipalityCode);
      if (draft.adminBarangayCode) adminLoc.setBarangayCode(draft.adminBarangayCode);
      
      if (draft.propProvinceCode) propLoc.setProvinceCode(draft.propProvinceCode);
      if (draft.propMunicipalityCode) propLoc.setMunicipalityCode(draft.propMunicipalityCode);
      if (draft.propBarangayCode) propLoc.setBarangayCode(draft.propBarangayCode);
      
      console.log('✅ Draft loaded:', draft);
    }
  }, []); // Only run on mount

  // Simple string persistence (keep backward compatibility)
  useEffect(() => safeSetLS("rpfaas_owner_name", ownerName), [ownerName]);
  useEffect(() => safeSetLS("rpfaas_admin_careof", adminCareOf), [adminCareOf]);
  useEffect(() => safeSetLS("rpfaas_location_street", propertyStreet), [propertyStreet]);

  // Function to collect all form data
  const collectFormData = () => {
    // Build the owner address from location codes
    const ownerProvince = DUMMY_PROVINCES.find(p => p.code === ownerLoc.provinceCode)?.name || '';
    const ownerMunicipality = ownerLoc.municipalities.find(m => m.code === ownerLoc.municipalityCode)?.name || '';
    const ownerBarangay = ownerLoc.barangays.find(b => b.code === ownerLoc.barangayCode)?.name || '';
    const ownerAddress = [ownerBarangay, ownerMunicipality, ownerProvince].filter(Boolean).join(', ');

    // Build the admin address from location codes
    const adminProvince = DUMMY_PROVINCES.find(p => p.code === adminLoc.provinceCode)?.name || '';
    const adminMunicipality = adminLoc.municipalities.find(m => m.code === adminLoc.municipalityCode)?.name || '';
    const adminBarangay = adminLoc.barangays.find(b => b.code === adminLoc.barangayCode)?.name || '';
    const adminAddress = [adminBarangay, adminMunicipality, adminProvince].filter(Boolean).join(', ');

    // Build the property address from location codes
    const propProvince = DUMMY_PROVINCES.find(p => p.code === propLoc.provinceCode)?.name || '';
    const propMunicipality = propLoc.municipalities.find(m => m.code === propLoc.municipalityCode)?.name || '';
    const propBarangay = propLoc.barangays.find(b => b.code === propLoc.barangayCode)?.name || '';
    const propertyAddress = [propertyStreet, propBarangay, propMunicipality, propProvince].filter(Boolean).join(', ');

    // Use snake_case to match API expectations
    const data = {
      owner_name: ownerName || null,
      owner_address: ownerAddress || null,
      admin_care_of: adminCareOf || null,
      admin_address: adminAddress || null,
      property_address: propertyAddress || null,
      status: 'draft',
    };
    
    console.log('📦 Collecting form data:', data);
    
    return data;
  };

  // Save draft to localStorage
  const handleSaveDraftLocal = () => {
    const formData = collectFormData();
    saveDraft(formData);
  };

  // Save draft to database
  const handleSaveDraftDatabase = async () => {
    const formData = collectFormData();
    await saveToDatabaseAsDraft(formData);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push("/rpfaas/building-structure/view");
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
                <BreadcrumbLink href="/rpfaas">RPFAAS Forms</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/rpfaas/building-structure">Building & Other Structures</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{PAGE_DESCRIPTION}</BreadcrumbPage>
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
              <SaveStatus lastSaved={lastSaved} isSaving={isSaving} error={saveError} />
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
                      options={DUMMY_PROVINCES} // Use dummy data directly
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
                  <Input value={adminCareOf} onChange={(e) => setAdminCareOf(e.target.value)} className="rpfaas-fill-input" />
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
                  <LocationSelect 
                      label="Province" 
                      value={propLoc.provinceCode} 
                      onChange={propLoc.setProvinceCode} 
                      options={DUMMY_PROVINCES} 
                      placeholder="Select Province" 
                    />
                    <LocationSelect 
                      label="Municipality" 
                      value={propLoc.municipalityCode} 
                      onChange={propLoc.setMunicipalityCode} 
                      options={propLoc.municipalities} 
                      disabled={!propLoc.provinceCode}
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
                  <div className="flex gap-2">
                    <SaveButton
                      onSave={handleSaveDraftLocal}
                      isSaving={isSaving}
                      lastSaved={lastSaved}
                      showLastSaved={false}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraftDatabase}
                      disabled={isSaving}
                      className="rpfaas-fill-button rpfaas-fill-button-secondary"
                    >
                      💾 Save to Cloud
                    </Button>
                  </div>
                  
                  <Button type="button" onClick={() => router.push("/rpfaas/building-structure/fill/step-2")} className="rpfaas-fill-button rpfaas-fill-button-primary">
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