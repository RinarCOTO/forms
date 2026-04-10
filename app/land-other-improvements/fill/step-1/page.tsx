"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, memo, Suspense, useRef, useMemo } from "react";
import "@/app/styles/forms-fill.css";
import { StepPagination, LAND_IMPROVEMENT_STEPS } from "@/components/ui/step-pagination";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { Loader2, Info, Lock } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { PH_PROVINCES, MOUNTAIN_PROVINCE_CODE } from "@/app/components/forms/RPFAAS/constants/philippineLocations";
import { useFormLock } from "@/hooks/useFormLock";

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
  blk: string,
  previousTdNo: string,
  previousOwner: string,
  previousAv: string,
  previousMv: string,
  previousArea: string,
) {
  const data: any = {
    owner_name: ownerName,
    admin_care_of: adminCareOf,
    property_address: propertyStreet,
    transaction_code: transactionCode,
    arp_no: arpNo,
    oct_tct_cloa_no: titleType === 'None' || !titleType ? null : `${titleType} ${titleNo}`.trim(),
    pin,
    survey_no: surveyNo,
    lot_no: lotNo,
    blk,
    previous_td_no: previousTdNo || null,
    previous_owner: previousOwner || null,
    previous_av: previousAv ? parseFloat(previousAv) || null : null,
    previous_mv: previousMv ? parseFloat(previousMv) || null : null,
    previous_area: previousArea ? parseFloat(previousArea) || null : null,
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

// Auto-insert dashes for Land PIN format: 046-20-001-01-005 (digits only, no extension)
function formatPin(value: string): string {
  const digits = value.replace(/\D/g, '');
  const sizes = [3, 2, 3, 2, 3];
  const parts: string[] = [];
  let pos = 0;
  for (const size of sizes) {
    const chunk = digits.slice(pos, pos + size);
    if (!chunk) break;
    parts.push(chunk);
    pos += size;
  }
  return parts.join('-');
}


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

const TRANSACTION_CODES = [
  { code: "DC", label: "DC – Discovery / Newly Discovered", description: "Used for newly constructed buildings, or for existing structures that were previously undeclared and are being assessed for the very first time." },
  { code: "TR", label: "TR – Transfer", description: "Used when the ownership of the building is being transferred to a new owner." },
  { code: "SD", label: "SD – Subdivision", description: "Used when a parcel of land owned by the same owner is subdivided into two or more lots." },
  { code: "CS", label: "CS – Consolidation", description: "Used when two or more adjacent parcels of land are merged into a single lot." },
  { code: "PC", label: "PC – Physical Change", description: "Used when an existing building undergoes structural changes that affect its market value, such as major renovations, extensions, additions, or partial demolitions." },
  { code: "RC", label: "RC – Reassessment / Reclassification", description: "Used when there is a change in the building's actual use (e.g., a residential house is converted into a commercial establishment) or when an owner requests a value review outside of a general revision period." },
  { code: "GR", label: "GR – General Revision", description: "Used during the LGU's mandated, periodic city-wide or municipality-wide updating of property assessments and fair market values." },
  { code: "DP", label: "DP – Depreciation", description: "Used when a tax declaration is updated specifically to apply the allowable physical depreciation to the building's value based on its age and condition." },
];

const FORM_NAME = "land_other_improvements_fill";

function LandOtherImprovementsFillPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');
  const { checking: lockChecking, locked, lockedBy } = useFormLock('land_improvements', draftId);

  const [isSaving, setIsSaving] = useState(false);

  const [ownerName, setOwnerName] = useState("");
  const [adminCareOf, setAdminCareOf] = useState("");
  const [propertyStreet, setPropertyStreet] = useState("");
  const [transactionCode, setTransactionCode] = useState("");
  const [arpSeq, setArpSeq] = useState("");
  const [titleType, setTitleType] = useState("");
  const [titleNo, setTitleNo] = useState("");
  const [pin, setPin] = useState("");
  const [surveyNo, setSurveyNo] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [blk, setBlk] = useState("");
  const [previousTdNo, setPreviousTdNo] = useState("");
  const [previousOwner, setPreviousOwner] = useState("");
  const [previousAv, setPreviousAv] = useState("");
  const [previousMv, setPreviousMv] = useState("");
  const [previousArea, setPreviousArea] = useState("");
  const prevTdLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Assigned municipality from the logged-in user's profile
  const [userMunicipality, setUserMunicipality] = useState("");

  const ownerLoc = useLocationSelect("rpfaas_owner_address");
  const adminLoc = useLocationSelect("rpfaas_admin");
  const propLoc  = useLocationSelect("rpfaas_location", MOUNTAIN_PROVINCE_CODE);

  // Derive ARP prefix from selected property municipality + barangay PSGC codes
  const arpPrefix = useMemo(() => {
    if (!propLoc.municipalityCode || !propLoc.barangayCode) return "";
    const munPart = propLoc.municipalityCode.substring(4, 6);
    const barPart = propLoc.barangayCode.substring(6).padStart(4, '0');
    return `${munPart}-${barPart}`;
  }, [propLoc.municipalityCode, propLoc.barangayCode]);

  const arpNo = useMemo(
    () => arpPrefix ? `${arpPrefix}-${arpSeq}` : arpSeq,
    [arpPrefix, arpSeq]
  );

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
        const response = await fetch(`/api/faas/land-improvements/${draftId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            if (data.status === 'approved') {
              router.replace(`/land-other-improvements/fill/preview-form?id=${draftId}`);
              return;
            }
            if (data.owner_name) setOwnerName(data.owner_name);
            if (data.admin_care_of) setAdminCareOf(data.admin_care_of);
            if (data.property_address) setPropertyStreet(data.property_address);
            if (data.transaction_code) setTransactionCode(data.transaction_code);
            if (data.arp_no) {
              const lastDash = (data.arp_no as string).lastIndexOf('-');
              setArpSeq(lastDash !== -1 ? (data.arp_no as string).slice(lastDash + 1) : data.arp_no);
            }
            if (data.oct_tct_cloa_no) {
              const stored = data.oct_tct_cloa_no as string;
              const spaceIdx = stored.indexOf(' ');
              const type = spaceIdx > 0 ? stored.slice(0, spaceIdx) : stored;
              const num = spaceIdx > 0 ? stored.slice(spaceIdx + 1) : '';
              if (['OCT', 'TCT', 'CLOA'].includes(type)) {
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
            if (data.previous_td_no) setPreviousTdNo(data.previous_td_no);
            if (data.previous_owner) setPreviousOwner(data.previous_owner);
            if (data.previous_av != null) setPreviousAv(String(data.previous_av));
            if (data.previous_mv != null) setPreviousMv(String(data.previous_mv));
            if (data.previous_area != null) setPreviousArea(String(data.previous_area));
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

  // Debounced lookup: when Previous TD No. changes, fetch matching approved record
  useEffect(() => {
    if (prevTdLookupTimer.current) clearTimeout(prevTdLookupTimer.current);
    if (!previousTdNo || previousTdNo.length < 5) return;
    prevTdLookupTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/faas/land-improvements?arp_no=${encodeURIComponent(previousTdNo)}`);
        if (!res.ok) return;
        const record = await res.json();
        if (record) {
          if (record.owner_name) setPreviousOwner(record.owner_name);
          setPreviousAv(record.assessed_value != null ? String(record.assessed_value) : "");
          setPreviousMv(record.market_value != null ? String(record.market_value) : "");
          setPreviousArea(record.land_area != null ? String(record.land_area) : "");
        } else {
          setPreviousAv(""); setPreviousMv(""); setPreviousArea("");
        }
      } catch { /* ignore */ }
    }, 600);
    return () => { if (prevTdLookupTimer.current) clearTimeout(prevTdLookupTimer.current); };
  }, [previousTdNo]);

  useEffect(() => safeSetLS("rpfaas_owner_name", ownerName), [ownerName]);
  useEffect(() => safeSetLS("rpfaas_admin_careof", adminCareOf), [adminCareOf]);
  useEffect(() => safeSetLS("rpfaas_location_street", propertyStreet), [propertyStreet]);

  const saveData = useCallback(async (): Promise<string | null> => {
    const formData = collectFormData(ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, previousTdNo, previousOwner, previousAv, previousMv, previousArea);
    formData.status = 'draft';

    const currentDraftId = draftId || localStorage.getItem('land_draft_id');
    const method = currentDraftId ? 'PUT' : 'POST';
    const url = currentDraftId ? `/api/faas/land-improvements/${currentDraftId}` : '/api/faas/land-improvements';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error(`Server error (${response.status})`);
    const result = await response.json();
    const id = result.data?.id?.toString() ?? null;
    if (id) localStorage.setItem('land_draft_id', id);
    return id;
  }, [ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, previousTdNo, previousOwner, previousAv, previousMv, previousArea, draftId]);

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveData();
      toast.success("Draft saved successfully.");
    } catch (error) {
      toast.error("Error saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [saveData]);

  const handleNext = useCallback(async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData(ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, previousTdNo, previousOwner, previousAv, previousMv, previousArea);
      formData.status = 'draft';

      let response;
      const currentDraftId = draftId || localStorage.getItem('draft_id');

      if (currentDraftId) {
        response = await fetch(`/api/faas/land-improvements/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/faas/land-improvements', {
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
  }, [ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, previousTdNo, previousOwner, previousAv, previousMv, previousArea, draftId, router]);

  return (
    <FormFillLayout
      breadcrumbParent={{ label: "Land & Other Improvements", href: "#" }}
      pageTitle="Step 1: Enter Owner and Property Location Details."
    >
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Fill-up Form: RPFAAS - Land &amp; Other Improvements</h1>
                <p className="text-sm text-muted-foreground">Enter the details below. You can generate the printable version afterwards.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSaving || locked || lockChecking}
                className="shrink-0"
              >
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Draft"}
              </Button>
            </header>
            {lockChecking && (
              <div className="flex items-center gap-2 mb-4 rounded-md border bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking form availability…
              </div>
            )}
            {!lockChecking && locked && (
              <div className="flex items-center gap-2 mb-4 rounded-md border border-yellow-400/50 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                <Lock className="h-4 w-4 shrink-0" />
                <span><strong>{lockedBy}</strong> is currently editing this form. You can view it but cannot make changes.</span>
              </div>
            )}
            <fieldset disabled={locked || lockChecking} className={`border-0 p-0 m-0 min-w-0 block${locked || lockChecking ? ' opacity-60' : ''}`}>
            <form id={`form_${FORM_NAME}_main`} className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">

              {/* PROPERTY IDENTIFICATION SECTION */}
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
                    <div
                      className="flex items-center font-mono h-9 border border-input rounded-md overflow-hidden"
                      style={{ background: 'var(--surface)' }}
                    >
                      <span className="pl-3 pr-1 text-sm shrink-0 select-none" style={{ color: 'var(--text)' }}>
                        {arpPrefix ? `${arpPrefix}-` : "__-____-"}
                      </span>
                      <Input
                        value={arpSeq}
                        onChange={(e) => setArpSeq(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        placeholder="00000"
                        className="border-0 shadow-none focus-visible:ring-0 bg-transparent font-mono h-full py-0 pr-3 pl-0"
                        maxLength={5}
                        disabled={!arpPrefix}
                        style={{ color: 'var(--text)' }}
                      />
                    </div>
                  </div>
                  {transactionCode && transactionCode !== "DC" && (
                    <>
                      <div className="space-y-1">
                        <Label className="rpfaas-fill-label">Previous TD No.</Label>
                        <Input
                          value={previousTdNo}
                          onChange={(e) => { setPreviousTdNo(e.target.value); }}
                          placeholder="e.g. 02-0001-00123"
                          className="rpfaas-fill-input"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="rpfaas-fill-label">Previous Owner</Label>
                        <Input
                          value={previousOwner}
                          onChange={(e) => setPreviousOwner(e.target.value)}
                          placeholder="Auto-filled from TD lookup"
                          className="rpfaas-fill-input"
                        />
                      </div>
                      {(previousAv || previousMv || previousArea) && (
                        <div className="col-span-2 grid grid-cols-3 gap-3 rounded-md border border-dashed px-3 py-2 bg-muted/40 text-xs">
                          <div>
                            <div className="text-muted-foreground mb-0.5">Prev. Assessed Value</div>
                            <div className="font-semibold">{previousAv ? `₱${parseFloat(previousAv).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—"}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">Prev. Market Value</div>
                            <div className="font-semibold">{previousMv ? `₱${parseFloat(previousMv).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—"}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">Prev. Area</div>
                            <div className="font-semibold">{previousArea ? `${parseFloat(previousArea).toLocaleString("en-PH")} sqm` : "—"}</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
                      placeholder="046-20-001-01-005"
                      className="rpfaas-fill-input font-mono"
                      maxLength={17}
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
                      <Input value={blk} onChange={(e) => setBlk(e.target.value)} className="rpfaas-fill-input" />
                    </div>
                  </div>
                </div>
              </section>

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

              <StepPagination
                currentStep={1}
                draftId={draftId}
                isDirty={false}
                onNext={handleNext}
                isNextLoading={isSaving}
                isNextDisabled={isSaving || locked || lockChecking}
                basePath="land-other-improvements"
                steps={LAND_IMPROVEMENT_STEPS}
                draftStorageKey="land_draft_id"
              />
            </form>
            </fieldset>
    </FormFillLayout>
  );
}

export default function LandOtherImprovementsFillPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandOtherImprovementsFillPageContent />
    </Suspense>
  );
}
