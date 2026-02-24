"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, memo, FormEvent, Suspense, useRef } from "react";
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
import { Loader2 } from "lucide-react";
import { DUMMY_PROVINCES, DUMMY_MUNICIPALITIES, DUMMY_BARANGAYS } from "@/app/components/forms/RPFAAS/constants/locations";

// Helper function to collect form data from ONLY this step (step 1)
function collectFormData(
  ownerName: string,
  adminCareOf: string,
  propertyStreet: string,
  ownerLoc: any,
  adminLoc: any,
  propLoc: any
) {
  const data: any = {
    owner_name: ownerName,
    admin_care_of: adminCareOf,
    property_address: propertyStreet,
    // Save the codes for restoring selects
    owner_province_code: ownerLoc.provinceCode,
    owner_municipality_code: ownerLoc.municipalityCode,
    owner_barangay_code: ownerLoc.barangayCode,
    admin_province_code: adminLoc.provinceCode,
    admin_municipality_code: adminLoc.municipalityCode,
    admin_barangay_code: adminLoc.barangayCode,
    property_province_code: propLoc.provinceCode,
    property_municipality_code: propLoc.municipalityCode,
    property_barangay_code: propLoc.barangayCode,
  };
  
  // Build owner address from location selections
  const ownerProvince = DUMMY_PROVINCES.find(p => p.code === ownerLoc.provinceCode)?.name || '';
  const ownerMunicipality = ownerLoc.municipalities.find((m: any) => m.code === ownerLoc.municipalityCode)?.name || '';
  const ownerBarangay = ownerLoc.barangays.find((b: any) => b.code === ownerLoc.barangayCode)?.name || '';
  if (ownerProvince || ownerMunicipality || ownerBarangay) {
    data.owner_address = [ownerBarangay, ownerMunicipality, ownerProvince].filter(Boolean).join(', ');
  }
  
  // Build admin address from location selections
  const adminProvince = DUMMY_PROVINCES.find(p => p.code === adminLoc.provinceCode)?.name || '';
  const adminMunicipality = adminLoc.municipalities.find((m: any) => m.code === adminLoc.municipalityCode)?.name || '';
  const adminBarangay = adminLoc.barangays.find((b: any) => b.code === adminLoc.barangayCode)?.name || '';
  if (adminProvince || adminMunicipality || adminBarangay) {
    data.admin_address = [adminBarangay, adminMunicipality, adminProvince].filter(Boolean).join(', ');
  }

  // Resolve property location names from PSGC codes for database storage
  data.location_province = DUMMY_PROVINCES[0].name;
  const propMunicipality = DUMMY_MUNICIPALITIES.find(m => m.code === propLoc.municipalityCode)?.name || '';
  const propBarangay = DUMMY_BARANGAYS.find(b => b.code === propLoc.barangayCode)?.name || '';
  if (propMunicipality) data.location_municipality = propMunicipality;
  if (propBarangay) data.location_barangay = propBarangay;

  // Only include fields from this step - don't collect from other steps
  return data;
}

// --- Utility Types ---
type LocationOption = { code: string; name: string };

function safeSetLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch { /* ignore */ }
}

// --- Custom Hook for Cascading Locations (Using Dummy Data) ---
function useLocationSelect(storagePrefix: string, initialProvinceCode = "") {
  // Refs hold values that should be applied after cascading effects settle (used during draft load)
  const pendingMunicipalityRef = useRef("");
  const pendingBarangayRef = useRef("");

  const [provinceCode, setProvinceCode] = useState(initialProvinceCode);
  const [municipalityCode, setMunicipalityCode] = useState("");
  const [barangayCode, setBarangayCode] = useState("");

  const [municipalities, setMunicipalities] = useState<LocationOption[]>([]);
  const [barangays, setBarangays] = useState<LocationOption[]>([]);

  // 1. Filter Municipalities when Province changes
  useEffect(() => {
    if (!pendingMunicipalityRef.current) {
      setMunicipalityCode("");
      setBarangayCode("");
    }

    if (!provinceCode) {
      setMunicipalities([]);
      return;
    }

    const filtered = DUMMY_MUNICIPALITIES.filter(m => m.provinceCode === provinceCode);
    setMunicipalities(filtered);

    if (pendingMunicipalityRef.current) {
      setMunicipalityCode(pendingMunicipalityRef.current);
      pendingMunicipalityRef.current = "";
    }
  }, [provinceCode]);

  // 2. Filter Barangays when Municipality changes
  useEffect(() => {
    if (!municipalityCode) {
      setBarangays([]);
      if (!pendingBarangayRef.current) setBarangayCode("");
      return;
    }

    const filtered = DUMMY_BARANGAYS.filter(b => b.municipalityCode === municipalityCode);
    setBarangays(filtered);

    if (pendingBarangayRef.current) {
      setBarangayCode(pendingBarangayRef.current);
      pendingBarangayRef.current = "";
    } else {
      setBarangayCode("");
    }
  }, [municipalityCode]);

  // 3. Persist to Local Storage
  useEffect(() => {
    safeSetLS(`${storagePrefix}_province_code`, provinceCode);
    safeSetLS(`${storagePrefix}_municipality_code`, municipalityCode);
    safeSetLS(`${storagePrefix}_barangay_code`, barangayCode);
  }, [provinceCode, municipalityCode, barangayCode, storagePrefix]);

  // Atomically load all three levels — prevents effect-chain race conditions during draft restore
  function loadLocation(provCode: string, munCode: string, barCode: string) {
    pendingBarangayRef.current = barCode;
    if (provCode !== provinceCode) {
      pendingMunicipalityRef.current = munCode;
      setProvinceCode(provCode);
    } else {
      setMunicipalityCode(munCode);
    }
  }

  return {
    provinceCode, setProvinceCode,
    municipalityCode, setMunicipalityCode,
    barangayCode, setBarangayCode,
    loadLocation,
    municipalities,
    barangays
  };
}

// Memoized select component — prevents all 9 instances from re-rendering when unrelated parent state changes
const LocationSelect = memo(({
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
));

const FORM_NAME = "building_other_structure_fill";

function BuildingOtherStructureFillPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');
  
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Basic Fields
  const [ownerName, setOwnerName] = useState("");
  const [adminCareOf, setAdminCareOf] = useState("");
  const [propertyStreet, setPropertyStreet] = useState("");

  // --- Use Custom Hooks for the 3 Address Sections ---
  const ownerLoc = useLocationSelect("rpfaas_owner_address");
  const adminLoc = useLocationSelect("rpfaas_admin");
  const propLoc  = useLocationSelect("rpfaas_location", DUMMY_PROVINCES[0].code);
  
  // Load draft data if editing
  useEffect(() => {
    if (!draftId) return;
    const loadDraft = async () => {
      try {
        // FIX: Use correct API endpoint for building-other-structure
        const response = await fetch(`/api/building-other-structure/${draftId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            if (data.owner_name) setOwnerName(data.owner_name);
            if (data.admin_care_of) setAdminCareOf(data.admin_care_of);
            if (data.property_address) setPropertyStreet(data.property_address);
            // Restore location selects — use loadLocation to avoid effect-chain race conditions
            ownerLoc.loadLocation(data.owner_province_code || "", data.owner_municipality_code || "", data.owner_barangay_code || "");
            adminLoc.loadLocation(data.admin_province_code || "", data.admin_municipality_code || "", data.admin_barangay_code || "");
            propLoc.loadLocation(data.property_province_code || DUMMY_PROVINCES[0].code, data.property_municipality_code || "", data.property_barangay_code || "");
            // Save to localStorage for consistency with other steps
            Object.entries(data).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                localStorage.setItem(`${key}_p1`, String(value));
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to load draft data for step 1', error);
      }
    };
    loadDraft();
  }, [draftId]);

  // Simple string persistence
  useEffect(() => safeSetLS("rpfaas_owner_name", ownerName), [ownerName]);
  useEffect(() => safeSetLS("rpfaas_admin_careof", adminCareOf), [adminCareOf]);
  useEffect(() => safeSetLS("rpfaas_location_street", propertyStreet), [propertyStreet]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    router.push("/building-other-structure");
  }, [router]);

  const handleNext = useCallback(async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData(ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc);
      formData.status = 'draft';
      
      console.log('Saving form data to Supabase:', formData);
      
      let response;
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      
      if (currentDraftId) {
        // Update existing draft
        response = await fetch(`/api/building-other-structure/${currentDraftId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new draft
        response = await fetch('/api/building-other-structure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Save result:', result);
        // Store the draft ID for future updates
        if (result.data?.id) {
          localStorage.setItem('draft_id', result.data.id.toString());
          const savedDraftId = result.data.id;
          // Navigate to step 2 with the draft ID
          router.push(`/building-other-structure/fill/step-2?id=${savedDraftId}`);
        } else {
          console.error('No draft ID returned:', result);
          alert('Save completed but no ID returned. Please try again.');
        }
      } else {
        let errorMessage = 'Unknown error';
        let errorDetails = '';
        console.log('Response not OK. Status:', response.status, 'StatusText:', response.statusText);
        
        try {
          const error = await response.json();
          console.error('Save error response:', JSON.stringify(error, null, 2));
          console.log('Error object keys:', Object.keys(error));
          console.log('Error object values:', Object.values(error));
          
          if (error && typeof error === 'object') {
            errorMessage = error.message || error.error || error.details?.message || `Server error (${response.status})`;
            if (error.details) {
              errorDetails = ` Details: ${JSON.stringify(error.details)}`;
            }
          } else {
            errorMessage = `Server error (${response.status}): Unexpected response format`;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          console.log('Raw response status:', response.status, response.statusText);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        
        const fullErrorMessage = errorMessage + errorDetails;
        console.error('Final error message to show user:', fullErrorMessage);
        alert('Failed to save: ' + fullErrorMessage);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, draftId, router]);

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
                <div className="rpfaas-fill-actions flex gap-2 justify-end">
                  {isLoadingDraft ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading draft...
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={handleNext}
                      disabled={isSaving}
                      className="rpfaas-fill-button rpfaas-fill-button-primary"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Next'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function BuildingOtherStructureFillPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuildingOtherStructureFillPageContent />
    </Suspense>
  );
}