"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, memo, Suspense, useRef } from "react";
import { StepPagination } from "@/components/ui/step-pagination";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
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
import { Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { PH_PROVINCES, MOUNTAIN_PROVINCE_CODE } from "@/app/components/forms/RPFAAS/constants/philippineLocations";

// Auto-insert dashes for PIN format: 046-20-001-01-005 (land) or 046-20-001-01-005-B001 (building)
function formatPin(value: string): string {
  // Keep only digits and B (extension prefix)
  const clean = value.replace(/[^0-9Bb]/g, '').toUpperCase();
  const bIdx = clean.indexOf('B');
  const digits = bIdx === -1 ? clean : clean.slice(0, bIdx);
  const extDigits = bIdx !== -1 ? clean.slice(bIdx + 1).replace(/\D/g, '').slice(0, 3) : null;

  // Segments: 3-2-3-2-3
  const sizes = [3, 2, 3, 2, 3];
  const parts: string[] = [];
  let pos = 0;
  for (const size of sizes) {
    const chunk = digits.slice(pos, pos + size);
    if (!chunk) break;
    parts.push(chunk);
    pos += size;
  }

  let result = parts.join('-');
  if (extDigits !== null) result += (result ? '-' : '') + 'B' + extDigits;
  return result;
}

// Auto-insert dashes for ARP No. format: 02-0001-01525
function formatArpNo(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
}

// Helper function to collect form data from ONLY this step (step 1)
function collectFormData(
  ownerName: string,
  adminCareOf: string,
  propertyStreet: string,
  ownerLoc: any,
  adminLoc: any,
  propLoc: any,
  transactionCode: string,
  arpNo: string,
  titleType: string,
  titleNo: string,
  pin: string,
  surveyNo: string,
  lotNo: string,
  blk: string | number,
) {
  const data: any = {
    owner_name: ownerName,
    admin_care_of: adminCareOf,
    property_address: propertyStreet,
    transaction_code: transactionCode,
    arp_no: arpNo,
    oct_tct_cloa_no: titleType === 'None' || !titleType ? '' : `${titleType} ${titleNo}`.trim(),
    pin,
    survey_no: surveyNo,
    lot_no: lotNo,
    blk: blk !== "" ? Number(blk) : null,
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

  // Load all three levels atomically — avoids effect-chain race conditions during draft restore
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

const TRANSACTION_CODES = [
  { code: "DC", label: "DC – Discovery / Newly Discovered", description: "Used for newly constructed buildings, or for existing structures that were previously undeclared and are being assessed for the very first time." },
  { code: "TR", label: "TR – Transfer", description: "Used when the ownership of the building is being transferred to a new owner." },
  { code: "PC", label: "PC – Physical Change", description: "Used when an existing building undergoes structural changes that affect its market value, such as major renovations, extensions, additions, or partial demolitions." },
  { code: "RC", label: "RC – Reassessment / Reclassification", description: "Used when there is a change in the building's actual use (e.g., a residential house is converted into a commercial establishment) or when an owner requests a value review outside of a general revision period." },
  { code: "DM", label: "DM – Demolition / Destruction", description: "Used to cancel or lower an assessment when a building is entirely torn down, condemned, or destroyed by a calamity (like a fire or typhoon)." },
  { code: "GR", label: "GR – General Revision", description: "Used during the LGU's mandated, periodic city-wide or municipality-wide updating of property assessments and fair market values." },
  { code: "DP", label: "DP – Depreciation", description: "Used when a tax declaration is updated specifically to apply the allowable physical depreciation to the building's value based on its age and condition." },
];

const FORM_NAME = "building_other_structure_fill";

function BuildingOtherStructureFillPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isInitializedRef = useRef(false);
  const markDirty = useCallback(() => {
    if (isInitializedRef.current) setIsDirty(true);
  }, []);

  // Property Identification Fields
  const [transactionCode, setTransactionCode] = useState("");
  const [arpNo, setArpNo] = useState("");
  const [titleType, setTitleType] = useState("");
  const [titleNo, setTitleNo] = useState("");
  const [pin, setPin] = useState("");
  const [surveyNo, setSurveyNo] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [blk, setBlk] = useState("");

  // Basic Fields
  const [ownerName, setOwnerName] = useState("");
  const [adminCareOf, setAdminCareOf] = useState("");
  const [propertyStreet, setPropertyStreet] = useState("");

  // Assigned municipality from the logged-in user's profile
  const [userMunicipality, setUserMunicipality] = useState("");

  // Location hooks
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

  // Load draft data if editing
  useEffect(() => {
    if (!draftId) {
      isInitializedRef.current = true;
      return;
    }
    const loadDraft = async () => {
      try {
        const response = await fetch(`/api/faas/building-structures/${draftId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            if (data.transaction_code) setTransactionCode(data.transaction_code);
            if (data.arp_no) setArpNo(data.arp_no);
            if (data.oct_tct_cloa_no) {
              const stored = data.oct_tct_cloa_no as string;
              const spaceIdx = stored.indexOf(' ');
              const type = spaceIdx > 0 ? stored.slice(0, spaceIdx) : stored;
              const num = spaceIdx > 0 ? stored.slice(spaceIdx + 1) : '';
              if (['OCT', 'TCT', 'CLOA', 'CCT'].includes(type)) {
                setTitleType(type);
                setTitleNo(num);
              } else {
                setTitleType('TCT');
                setTitleNo(stored);
              }
            }
            if (data.pin) setPin(data.pin);
            if (data.survey_no) setSurveyNo(data.survey_no);
            if (data.lot_no) setLotNo(data.lot_no);
            if (data.blk) setBlk(data.blk);
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
      } finally {
        // Allow a frame for state to settle before tracking dirty
        setTimeout(() => { isInitializedRef.current = true; }, 100);
      }
    };
    loadDraft();
  }, [draftId]);

  // Persist basic strings
  useEffect(() => safeSetLS("rpfaas_transaction_code", transactionCode), [transactionCode]);
  useEffect(() => safeSetLS("rpfaas_arp_no", arpNo), [arpNo]);
  useEffect(() => safeSetLS("rpfaas_title_type", titleType), [titleType]);
  useEffect(() => safeSetLS("rpfaas_title_no", titleNo), [titleNo]);
  useEffect(() => safeSetLS("rpfaas_pin", pin), [pin]);
  useEffect(() => safeSetLS("rpfaas_survey_no", surveyNo), [surveyNo]);
  useEffect(() => safeSetLS("rpfaas_lot_no", lotNo), [lotNo]);
  useEffect(() => safeSetLS("rpfaas_blk", blk), [blk]);
  useEffect(() => safeSetLS("rpfaas_owner_name", ownerName), [ownerName]);
  useEffect(() => safeSetLS("rpfaas_admin_careof", adminCareOf), [adminCareOf]);
  useEffect(() => safeSetLS("rpfaas_location_street", propertyStreet), [propertyStreet]);
  // Save property location display names only when we actually have valid names
  useEffect(() => {
    if (!propLoc.municipalityCode || propLoc.municipalities.length === 0) return;
    const name = propLoc.municipalities.find((m: { code: string; name: string }) => m.code === propLoc.municipalityCode)?.name || '';
    if (name) safeSetLS("rpfaas_location_municipality", name);
  }, [propLoc.municipalityCode, propLoc.municipalities]);
  useEffect(() => {
    if (!propLoc.barangayCode || propLoc.barangays.length === 0) return;
    const name = propLoc.barangays.find((b: { code: string; name: string }) => b.code === propLoc.barangayCode)?.name || '';
    if (name) safeSetLS("rpfaas_location_barangay", name);
  }, [propLoc.barangayCode, propLoc.barangays]);
  useEffect(() => safeSetLS("rpfaas_location_province", "Mountain Province"), []);

  const handleNext = useCallback(async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData(ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk);
      formData.status = 'draft';

      let response;
      const currentDraftId = draftId || localStorage.getItem('draft_id');

      if (currentDraftId) {
        response = await fetch(`/api/faas/building-structures/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/faas/building-structures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) {
          setIsDirty(false);
          localStorage.setItem('draft_id', result.data.id.toString());
          router.push(`/building-other-structure/fill/step-2?id=${result.data.id}`);
        } else {
          toast.error('Save completed but no ID returned. Please try again.');
        }
      } else {
        try {
          const error = await response.json();
          const msg = error.message || error.error || `Server error (${response.status})`;
          const details = error.details ? ` Details: ${JSON.stringify(error.details)}` : '';
          toast.error('Failed to save: ' + msg + details);
        } catch {
          toast.error(`Failed to save: Server error (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, draftId, router]);

  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      const formData = collectFormData(ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk);
      formData.status = 'draft';
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      let response;
      if (currentDraftId) {
        response = await fetch(`/api/faas/building-structures/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/faas/building-structures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) localStorage.setItem('draft_id', result.data.id.toString());
        setIsDirty(false);
        toast.success('Draft saved successfully.');
      } else {
        const error = await response.json();
        toast.error('Failed to save draft: ' + (error.message || 'Unknown error'));
      }
    } catch {
      toast.error('Error saving draft.');
    } finally {
      setIsSavingDraft(false);
    }
  }, [ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, draftId]);

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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isSaving}
                className="shrink-0"
              >
                {isSavingDraft ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : 'Save Draft'}
              </Button>
            </header>

            <form id={`form_${FORM_NAME}_main`} className="rpfaas-fill-form rpfaas-fill-form-single space-y-6" onChange={markDirty}>


              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Property Identification</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Label className="rpfaas-fill-label">Transaction Code</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          {transactionCode
                            ? TRANSACTION_CODES.find(t => t.code === transactionCode)?.description
                            : "Select a code to see its description."}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="relative">
                      <select
                        value={transactionCode}
                        onChange={(e) => setTransactionCode(e.target.value)}
                        className="rpfaas-fill-input appearance-none"
                      >
                        <option value="">Select transaction code</option>
                        {TRANSACTION_CODES.map(t => (
                          <option key={t.code} value={t.code}>{t.label}</option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label">ARP No.</Label>
                    <Input
                      value={arpNo}
                      onChange={(e) => setArpNo(formatArpNo(e.target.value))}
                      placeholder="02-0001-01525" 
                      className="rpfaas-fill-input font-mono"
                      maxLength={13}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label">OCT/TCT/CLOA No.</Label>
                    <div className="flex gap-2">
                      <div className="relative w-36 shrink-0">
                        <select
                          value={titleType}
                          onChange={(e) => { setTitleType(e.target.value); if (e.target.value === 'None') setTitleNo(''); }}
                          className="rpfaas-fill-input appearance-none w-full"
                        >
                          <option value="">Select type</option>
                          <option value="OCT">OCT</option>
                          <option value="TCT">TCT</option>
                          <option value="CLOA">CLOA</option>
                          <option value="CCT">CCT</option>
                          <option value="None">None</option>
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                          </svg>
                        </span>
                      </div>
                      {titleType && titleType !== 'None' && (
                        <Input
                          value={titleNo}
                          onChange={(e) => setTitleNo(e.target.value)}
                          placeholder="e.g. T-123456"
                          className="rpfaas-fill-input flex-1"
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label">PIN</Label>
                    <Input
                      value={pin}
                      onChange={(e) => setPin(formatPin(e.target.value))}
                      placeholder="046-20-001-01-005-B001"
                      className="rpfaas-fill-input font-mono"
                      maxLength={22}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label">Survey No.</Label>
                    <Input value={surveyNo} onChange={(e) => setSurveyNo(e.target.value)} className="rpfaas-fill-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="rpfaas-fill-label">Lot No.</Label>
                      <Input value={lotNo} onChange={(e) => setLotNo(e.target.value)} className="rpfaas-fill-input" />
                    </div>
                    <div className="space-y-1">
                      <Label className="rpfaas-fill-label">BLK</Label>
                      <Input type="number" value={blk} onChange={(e) => setBlk(e.target.value)} className="rpfaas-fill-input" />
                    </div>
                  </div>
                </div>
              </section>
              {/* OWNER SECTION */}
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">Owner Information</h2>
                <div className="rpfaas-fill-field space-y-1" data-comment-field="owner_name">
                  <Label className="rpfaas-fill-label">Owner</Label>
                  <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="rpfaas-fill-input" />
                </div>

                {/* Owner Address */}
                <div className="rpfaas-fill-field" data-comment-field="owner_address">
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

                <div className="rpfaas-fill-field space-y-1 mt-4" data-comment-field="admin_care_of">
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
              <section className="rpfaas-fill-section" data-comment-field="location_municipality location_barangay location_province">
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

              <StepPagination
                currentStep={1}
                draftId={draftId}
                isDirty={isDirty}
                onNext={handleNext}
                isNextLoading={isSaving}
                isNextDisabled={isSaving || isSavingDraft}
              />
            </form>
          </div>
        </div>
      </SidebarInset>
      <ReviewCommentsFloat draftId={draftId} />
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
