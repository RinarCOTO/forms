"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, memo, Suspense, useRef } from "react";
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
import { PH_PROVINCES, MOUNTAIN_PROVINCE_CODE } from "@/app/components/forms/RPFAAS/constants/philippineLocations";

// Helper function to collect form data from ONLY this step (step 1)
function collectFormData(
  ownerName: string,
  adminCareOf: string,
  propertyStreet: string,
  ownerLoc: any,
  adminLoc: any,
  propLoc: any,
) {
  const data: any = {
    owner_name: ownerName,
    admin_care_of: adminCareOf,
    property_address: propertyStreet,
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

  // Build owner address
  const ownerProvince = PH_PROVINCES.find(p => p.code === ownerLoc.provinceCode)?.name || '';
  const ownerMunicipality = ownerLoc.municipalities.find((m: any) => m.code === ownerLoc.municipalityCode)?.name || '';
  const ownerBarangay = ownerLoc.barangays.find((b: any) => b.code === ownerLoc.barangayCode)?.name || '';
  if (ownerProvince || ownerMunicipality || ownerBarangay) {
    data.owner_address = [ownerBarangay, ownerMunicipality, ownerProvince].filter(Boolean).join(', ');
  }

  // Build admin address
  const adminProvince = PH_PROVINCES.find(p => p.code === adminLoc.provinceCode)?.name || '';
  const adminMunicipality = adminLoc.municipalities.find((m: any) => m.code === adminLoc.municipalityCode)?.name || '';
  const adminBarangay = adminLoc.barangays.find((b: any) => b.code === adminLoc.barangayCode)?.name || '';
  if (adminProvince || adminMunicipality || adminBarangay) {
    data.admin_address = [adminBarangay, adminMunicipality, adminProvince].filter(Boolean).join(', ');
  }

  // Property location names
  data.location_province = "Mountain Province";
  const propMunicipality = propLoc.municipalities.find((m: any) => m.code === propLoc.municipalityCode)?.name || '';
  const propBarangay = propLoc.barangays.find((b: any) => b.code === propLoc.barangayCode)?.name || '';
  if (propMunicipality) data.location_municipality = propMunicipality;
  if (propBarangay) data.location_barangay = propBarangay;

  return data;
}

// --- Utility Types ---
type LocationOption = { code: string; name: string };

function safeSetLS(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

async function fetchLocations(type: string, parent: string): Promise<LocationOption[]> {
  try {
    const res = await fetch(`/api/locations?type=${type}&parent=${encodeURIComponent(parent)}`);
    const json = await res.json();
    if (json.success) {
      return (json.data as { psgc_code: string; name: string }[]).map(d => ({
        code: d.psgc_code,
        name: d.name,
      }));
    }
  } catch { /* network error */ }
  return [];
}

// --- Custom Hook for Cascading Locations ---
// Always fetches municipalities and barangays from /api/locations.
function useLocationSelect(storagePrefix: string, initialProvinceCode = "") {
  const pendingMunicipalityRef = useRef("");
  const pendingBarangayRef = useRef("");

  const [provinceCode, setProvinceCode] = useState(initialProvinceCode);
  const [municipalityCode, setMunicipalityCode] = useState("");
  const [barangayCode, setBarangayCode] = useState("");

  const [municipalities, setMunicipalities] = useState<LocationOption[]>([]);
  const [barangays, setBarangays] = useState<LocationOption[]>([]);
  const [isLoadingMun, setIsLoadingMun] = useState(false);
  const [isLoadingBar, setIsLoadingBar] = useState(false);

  // 1. Province changes → load municipalities from API
  useEffect(() => {
    if (!pendingMunicipalityRef.current) {
      setMunicipalityCode("");
      setBarangayCode("");
    }

    if (!provinceCode) {
      setMunicipalities([]);
      pendingMunicipalityRef.current = "";
      return;
    }

    const pending = pendingMunicipalityRef.current;
    setIsLoadingMun(true);
    fetchLocations('municipality', provinceCode).then(items => {
      setMunicipalities(items);
      if (pending) {
        setMunicipalityCode(pending);
        pendingMunicipalityRef.current = "";
      }
      setIsLoadingMun(false);
    });
  }, [provinceCode]);

  // 2. Municipality changes → load barangays from API
  useEffect(() => {
    if (!municipalityCode) {
      setBarangays([]);
      if (!pendingBarangayRef.current) setBarangayCode("");
      return;
    }

    const pending = pendingBarangayRef.current;
    setIsLoadingBar(true);
    fetchLocations('barangay', municipalityCode).then(items => {
      setBarangays(items);
      if (pending) {
        setBarangayCode(pending);
        pendingBarangayRef.current = "";
      } else {
        setBarangayCode("");
      }
      setIsLoadingBar(false);
    });
  }, [municipalityCode]);

  // 3. Persist to localStorage
  useEffect(() => {
    safeSetLS(`${storagePrefix}_province_code`, provinceCode);
    safeSetLS(`${storagePrefix}_municipality_code`, municipalityCode);
    safeSetLS(`${storagePrefix}_barangay_code`, barangayCode);
  }, [provinceCode, municipalityCode, barangayCode, storagePrefix]);

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
    barangays,
    isLoadingMun,
    isLoadingBar,
  };
}

// Memoized select component
const LocationSelect = memo(({
  label, value, onChange, options, disabled, placeholder, loading
}: {
  label: string, value: string, onChange: (val: string) => void,
  options: LocationOption[], disabled?: boolean, placeholder: string, loading?: boolean
}) => (
  <div className="space-y-1">
    <Label className="rpfaas-fill-label-sub">{label}</Label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rpfaas-fill-input appearance-none"
        disabled={disabled || loading}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>{opt.name}</option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
            </svg>
        }
      </span>
    </div>
  </div>
));

const FORM_NAME = "land_other_improvements_fill";

function LandOtherImprovementsFillPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');

  const [isSaving, setIsSaving] = useState(false);

  const [ownerName, setOwnerName] = useState("");
  const [adminCareOf, setAdminCareOf] = useState("");
  const [propertyStreet, setPropertyStreet] = useState("");

  // Assigned municipality from the logged-in user's profile
  const [userMunicipality, setUserMunicipality] = useState("");

  const ownerLoc = useLocationSelect("rpfaas_owner_address");
  const adminLoc = useLocationSelect("rpfaas_admin");
  const propLoc  = useLocationSelect("rpfaas_location", MOUNTAIN_PROVINCE_CODE);

  // Fetch user profile to get assigned municipality
  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(data => { if (data.user?.municipality) setUserMunicipality(data.user.municipality); })
      .catch(() => {});
  }, []);

  // Auto-select property municipality from user's assigned municipality (new forms only)
  useEffect(() => {
    if (!propLoc.municipalities.length || propLoc.municipalityCode || !userMunicipality) return;
    const match = propLoc.municipalities.find(
      m => m.name.toLowerCase() === userMunicipality.toLowerCase()
    );
    if (match) propLoc.setMunicipalityCode(match.code);
  }, [propLoc.municipalities, propLoc.municipalityCode, userMunicipality]);

  useEffect(() => {
    if (!draftId) return;
    const loadDraft = async () => {
      try {
        const response = await fetch(`/api/forms/land-other-improvements/${draftId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            if (data.owner_name) setOwnerName(data.owner_name);
            if (data.admin_care_of) setAdminCareOf(data.admin_care_of);
            if (data.property_address) setPropertyStreet(data.property_address);
            ownerLoc.loadLocation(data.owner_province_code || "", data.owner_municipality_code || "", data.owner_barangay_code || "");
            adminLoc.loadLocation(data.admin_province_code || "", data.admin_municipality_code || "", data.admin_barangay_code || "");
            // Always use current MOUNTAIN_PROVINCE_CODE (old drafts may have stale 9-digit codes)
            propLoc.loadLocation(MOUNTAIN_PROVINCE_CODE, data.property_municipality_code || "", data.property_barangay_code || "");
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

  useEffect(() => safeSetLS("rpfaas_owner_name", ownerName), [ownerName]);
  useEffect(() => safeSetLS("rpfaas_admin_careof", adminCareOf), [adminCareOf]);
  useEffect(() => safeSetLS("rpfaas_location_street", propertyStreet), [propertyStreet]);

  const handleNext = useCallback(async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData(ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc);
      formData.status = 'draft';

      let response;
      const currentDraftId = draftId || localStorage.getItem('draft_id');

      if (currentDraftId) {
        response = await fetch(`/api/forms/land-other-improvements/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/forms/land-other-improvements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) {
          localStorage.setItem('draft_id', result.data.id.toString());
          router.push(`/land-other-improvements/fill/step-2?id=${result.data.id}`);
        } else {
          alert('Save completed but no ID returned. Please try again.');
        }
      } else {
        try {
          const error = await response.json();
          const msg = error.message || error.error || `Server error (${response.status})`;
          const details = error.details ? ` Details: ${JSON.stringify(error.details)}` : '';
          alert('Failed to save: ' + msg + details);
        } catch {
          alert(`Failed to save: Server error (${response.status})`);
        }
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
                <BreadcrumbLink href="#">Land &amp; Other Improvements</BreadcrumbLink>
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
                <h1 className="rpfaas-fill-title">Fill-up Form: RPFAAS - Land &amp; Other Improvements</h1>
                <p className="text-sm text-muted-foreground">Enter the details below. You can generate the printable version afterwards.</p>
              </div>
            </header>

            <form id={`form_${FORM_NAME}_main`} className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">

              {/* OWNER SECTION */}
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Owner Information</h2>
                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label">Owner</Label>
                  <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="rpfaas-fill-input" />
                </div>

                {/* Owner Address */}
                <div className="rpfaas-fill-field">
                  <Label className="rpfaas-fill-label">Address</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <LocationSelect
                      label="Province"
                      value={ownerLoc.provinceCode}
                      onChange={ownerLoc.setProvinceCode}
                      options={PH_PROVINCES}
                      placeholder="Select Province"
                    />
                    <LocationSelect
                      label="Municipality/City"
                      value={ownerLoc.municipalityCode}
                      onChange={ownerLoc.setMunicipalityCode}
                      options={ownerLoc.municipalities}
                      disabled={!ownerLoc.provinceCode}
                      placeholder="Select Municipality"
                      loading={ownerLoc.isLoadingMun}
                    />
                    <LocationSelect
                      label="Barangay"
                      value={ownerLoc.barangayCode}
                      onChange={ownerLoc.setBarangayCode}
                      options={ownerLoc.barangays}
                      disabled={!ownerLoc.municipalityCode}
                      placeholder="Select Barangay"
                      loading={ownerLoc.isLoadingBar}
                    />
                  </div>
                </div>

                <div className="rpfaas-fill-field space-y-1 mt-4">
                  <Label className="rpfaas-fill-label">Administration/Care of</Label>
                  <Input value={adminCareOf} onChange={(e) => setAdminCareOf(e.target.value)} className="rpfaas-fill-input" />
                </div>

                {/* Admin Address */}
                <div className="rpfaas-fill-field mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <LocationSelect
                      label="Province"
                      value={adminLoc.provinceCode}
                      onChange={adminLoc.setProvinceCode}
                      options={PH_PROVINCES}
                      placeholder="Select Province"
                    />
                    <LocationSelect
                      label="Municipality/City"
                      value={adminLoc.municipalityCode}
                      onChange={adminLoc.setMunicipalityCode}
                      options={adminLoc.municipalities}
                      disabled={!adminLoc.provinceCode}
                      placeholder="Select Municipality"
                      loading={adminLoc.isLoadingMun}
                    />
                    <LocationSelect
                      label="Barangay"
                      value={adminLoc.barangayCode}
                      onChange={adminLoc.setBarangayCode}
                      options={adminLoc.barangays}
                      disabled={!adminLoc.municipalityCode}
                      placeholder="Select Barangay"
                      loading={adminLoc.isLoadingBar}
                    />
                  </div>
                </div>
              </section>

              {/* PROPERTY LOCATION SECTION — Mountain Province only (static, no API) */}
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Location Property</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label">No/Street/Sitio</Label>
                    <Input value={propertyStreet} onChange={(e) => setPropertyStreet(e.target.value)} className="rpfaas-fill-input" />
                  </div>
                  <LocationSelect
                    label="Province"
                    value={MOUNTAIN_PROVINCE_CODE}
                    onChange={() => {}}
                    options={[{ code: MOUNTAIN_PROVINCE_CODE, name: "Mountain Province" }]}
                    disabled={true}
                    placeholder="Mountain Province"
                  />
                  <LocationSelect
                    label="Municipality"
                    value={propLoc.municipalityCode}
                    onChange={propLoc.setMunicipalityCode}
                    options={propLoc.municipalities}
                    placeholder="Select Municipality"
                    loading={propLoc.isLoadingMun}
                    disabled={!!userMunicipality}
                  />
                  <LocationSelect
                    label="Barangay"
                    value={propLoc.barangayCode}
                    onChange={propLoc.setBarangayCode}
                    options={propLoc.barangays}
                    disabled={!propLoc.municipalityCode}
                    placeholder="Select Barangay"
                    loading={propLoc.isLoadingBar}
                  />
                </div>
              </section>

              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                <div className="rpfaas-fill-actions flex gap-2 justify-end">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSaving}
                    className="rpfaas-fill-button rpfaas-fill-button-primary"
                  >
                    {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : 'Next'}
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

export default function LandOtherImprovementsFillPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandOtherImprovementsFillPageContent />
    </Suspense>
  );
}
