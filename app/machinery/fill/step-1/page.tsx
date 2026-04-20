"use client"

// React & Next.js
import { useEffect, useState, useCallback, Suspense, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Styles
import "@/app/styles/forms-fill.css";

// Third-party
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// UI components
import { Button } from "@/components/ui/button";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { FormLockBanner } from "@/components/ui/form-lock-banner";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinInput } from "@/components/ui/pin-input";
import { StepPagination } from "@/components/ui/step-pagination";

// Hooks
import { useFormLock } from "@/hooks/useFormLock";
import { useLocationSelect, safeSetLS } from "@/hooks/useLocationSelect";

// RPFAAS components
import { ArpNoField } from "@/components/rpfaas/arp-no-field";
import { OwnerSection } from "@/components/rpfaas/owner-section";
import { PreviousTdBlock } from "@/components/rpfaas/previous-td-block";
import { PropertyLocationSection } from "@/components/rpfaas/property-location-section";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
import { TitleNoField } from "@/components/rpfaas/title-no-field";
import { TransactionCodeSelect, type TransactionCode } from "@/components/rpfaas/transaction-code-select";

// Constants
import { PH_PROVINCES, MOUNTAIN_PROVINCE_CODE } from "@/app/components/forms/RPFAAS/constants/philippineLocations";
import { MACHINERY_STEPS } from "@/app/machinery/fill/constants";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ACTUAL_USE_OPTIONS } from "@/app/machinery/components/machinery-item-card";

const TRANSACTION_CODES: TransactionCode[] = [
  { code: "ND", label: "ND – New Discovery", description: "Used when declaring machinery for the first time. Covers: Newly Installed/Brand New (just affixed to the property); Previously Undeclared/Omitted (older machinery just discovered by the assessor — may trigger back taxes up to 10 years); or Imported (special appraisal using foreign exchange rates, import duties, and freight costs at acquisition)." },
  { code: "TR", label: "TR – Transfer of Ownership", description: "Used when machinery changes hands. The transfer method determines required BIR clearances: Sale/Purchase (Deed of Sale); Donation (requires Donor's Tax clearance); Succession/Inheritance (requires Estate Tax clearance); or Foreclosure/Public Auction (acquired after the previous owner defaulted on a loan or taxes)." },
  { code: "PC", label: "PC – Physical Change", description: "Used when the machinery undergoes changes that affect its market value. Covers: Expansion/Addition (new components increasing capacity or production speed); Rehabilitation/Overhaul (major repairs significantly extending economic life); or Partial Dismantling (removing components, lowering value but keeping the core machine operational)." },
  { code: "DC", label: "DC – Decrease in Value", description: "Used when the machinery's value is reduced without physical dismantling. Typically applied for Economic Obsolescence — the machinery is still operational, but newer and faster technology has made it functionally outdated, severely reducing its market value." },
  { code: "RC", label: "RC – Reclassification", description: "Used when the assessment level changes due to a change in actual use. Examples: Agricultural to Industrial/Commercial (e.g., a farm tractor now rented for construction); Exempt to Taxable (e.g., equipment sold by a tax-exempt entity to a private corporation); or Taxable to Exempt (e.g., a generator donated to a public hospital or church)." },
  { code: "CN", label: "CN – Cancellation", description: "Used to permanently remove machinery from the tax roll. Reasons must be documented: Dismantled/Retired (permanently shut down or sold as scrap); Destroyed (fire, earthquake, typhoon, or accident); or Transferred to Another LGU (machinery physically moved to a different city or municipality — the receiving LGU will tag it as New Discovery)." },
];


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
  previousTdNo: string,
  previousOwner: string,
  previousAv: string,
  previousMv: string,
  previousArea: string,
  landOwner: string,
  landPin: string,
  landArpNo: string,
  landArea: string,
  buildingOwner: string,
  buildingPin: string,
  buildingTdArpNo: string,
  actualUse: string,
) {
  const data: any = {
    actual_use: actualUse || null,
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
    previous_td_no: previousTdNo || null,
    previous_owner: previousOwner || null,
    previous_av: previousAv ? parseFloat(previousAv) || null : null,
    previous_mv: previousMv ? parseFloat(previousMv) || null : null,
    previous_area: previousArea ? parseFloat(previousArea) || null : null,
    land_owner: landOwner || null,
    land_pin: landPin || null,
    land_arp_no: landArpNo || null,
    land_area: landArea ? parseFloat(landArea) || null : null,
    building_owner: buildingOwner || null,
    building_pin: buildingPin || null,
    building_td_arp_no: buildingTdArpNo || null,
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

  const ownerProvince = PH_PROVINCES.find(p => p.code === ownerLoc.provinceCode)?.name || '';
  const ownerMunicipality = ownerLoc.municipalities.find((m: any) => m.code === ownerLoc.municipalityCode)?.name || '';
  const ownerBarangay = ownerLoc.barangays.find((b: any) => b.code === ownerLoc.barangayCode)?.name || '';
  if (ownerProvince || ownerMunicipality || ownerBarangay) {
    data.owner_address = [ownerBarangay, ownerMunicipality, ownerProvince].filter(Boolean).join(', ');
  }

  const adminProvince = PH_PROVINCES.find(p => p.code === adminLoc.provinceCode)?.name || '';
  const adminMunicipality = adminLoc.municipalities.find((m: any) => m.code === adminLoc.municipalityCode)?.name || '';
  const adminBarangay = adminLoc.barangays.find((b: any) => b.code === adminLoc.barangayCode)?.name || '';
  if (adminProvince || adminMunicipality || adminBarangay) {
    data.admin_address = [adminBarangay, adminMunicipality, adminProvince].filter(Boolean).join(', ');
  }

  data.location_province = "Mountain Province";
  const propMunicipality = propLoc.municipalities.find((m: any) => m.code === propLoc.municipalityCode)?.name || '';
  const propBarangay = propLoc.barangays.find((b: any) => b.code === propLoc.barangayCode)?.name || '';
  if (propMunicipality) data.location_municipality = propMunicipality;
  if (propBarangay) data.location_barangay = propBarangay;

  return data;
}

function MachineryFillPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  const { checking: lockChecking, locked, lockedBy } = useFormLock('machinery', draftId);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const isInitializedRef = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const markDirty = useCallback(() => {
    if (isInitializedRef.current) setIsDirty(true);
  }, []);

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

  const [ownerName, setOwnerName] = useState("");
  const [adminCareOf, setAdminCareOf] = useState("");
  const [propertyStreet, setPropertyStreet] = useState("");
  const [userMunicipality, setUserMunicipality] = useState("");
  const [landOwner, setLandOwner] = useState("");
  const [landPin, setLandPin] = useState("");
  const [landArpNo, setLandArpNo] = useState("");
  const [landArea, setLandArea] = useState("");
  const [buildingOwner, setBuildingOwner] = useState("");
  const [buildingPin, setBuildingPin] = useState("");
  const [buildingTdArpNo, setBuildingTdArpNo] = useState("");
  const [actualUse, setActualUse] = useState("");

  const ownerLoc = useLocationSelect("rpfaas_owner_address");
  const adminLoc = useLocationSelect("rpfaas_admin");
  const propLoc = useLocationSelect("rpfaas_location", MOUNTAIN_PROVINCE_CODE);

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

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(data => { if (data.user?.municipality) setUserMunicipality(data.user.municipality); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!propLoc.municipalities.length || propLoc.municipalityCode || !userMunicipality) return;
    const match = propLoc.municipalities.find(m => m.name.toLowerCase() === userMunicipality.toLowerCase());
    if (match) propLoc.setMunicipalityCode(match.code);
  }, [propLoc.municipalities, propLoc.municipalityCode, userMunicipality]);

  useEffect(() => {
    if (!draftId) { isInitializedRef.current = true; return; }
    const loadDraft = async () => {
      try {
        const response = await fetch(`/api/faas/machinery/${draftId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            if (data.status === 'approved') {
              router.replace(`/machinery/print-preview?id=${draftId}`);
              return;
            }
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
              if (['OCT', 'TCT', 'CLOA', 'CCT'].includes(type)) {
                setTitleType(type); setTitleNo(num);
              } else {
                setTitleType('TCT'); setTitleNo(stored);
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
            if (data.owner_name) setOwnerName(data.owner_name);
            if (data.admin_care_of) setAdminCareOf(data.admin_care_of);
            if (data.property_address) setPropertyStreet(data.property_address);
            if (data.land_owner) setLandOwner(data.land_owner);
            if (data.land_pin) setLandPin(data.land_pin);
            if (data.land_arp_no) setLandArpNo(data.land_arp_no);
            if (data.land_area != null) setLandArea(String(data.land_area));
            if (data.building_owner) setBuildingOwner(data.building_owner);
            if (data.building_pin) setBuildingPin(data.building_pin);
            if (data.building_td_arp_no) setBuildingTdArpNo(data.building_td_arp_no);
            if (data.actual_use) setActualUse(data.actual_use);
            ownerLoc.loadLocation(data.owner_province_code || "", data.owner_municipality_code || "", data.owner_barangay_code || "");
            adminLoc.loadLocation(data.admin_province_code || "", data.admin_municipality_code || "", data.admin_barangay_code || "");
            propLoc.loadLocation(MOUNTAIN_PROVINCE_CODE, data.property_municipality_code || "", data.property_barangay_code || "");
            Object.entries(data).forEach(([key, value]) => {
              if (value !== null && value !== undefined) localStorage.setItem(`${key}_p1`, String(value));
            });
          }
        }
      } catch (error) {
        console.error('Failed to load draft data for step 1', error);
      } finally {
        isInitializedRef.current = true;
      }
    };
    loadDraft();
  }, [draftId]);

  useEffect(() => {
    if (prevTdLookupTimer.current) clearTimeout(prevTdLookupTimer.current);
    if (!previousTdNo || previousTdNo.length < 5) return;
    prevTdLookupTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/faas/machinery?arp_no=${encodeURIComponent(previousTdNo)}`);
        if (!res.ok) return;
        const record = await res.json();
        if (record) {
          if (record.owner_name) setPreviousOwner(record.owner_name);
          setPreviousAv(record.estimated_value != null ? String(record.estimated_value) : "");
          setPreviousMv(record.market_value != null ? String(record.market_value) : "");
          setPreviousArea(record.total_floor_area != null ? String(record.total_floor_area) : "");
        } else {
          setPreviousAv(""); setPreviousMv(""); setPreviousArea("");
        }
      } catch { /* ignore */ }
    }, 600);
    return () => { if (prevTdLookupTimer.current) clearTimeout(prevTdLookupTimer.current); };
  }, [previousTdNo]);

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
  useEffect(() => safeSetLS("rpfaas_location_province", "Mountain Province"), []);
  useEffect(() => safeSetLS("rpfaas_land_owner", landOwner), [landOwner]);
  useEffect(() => safeSetLS("rpfaas_land_pin", landPin), [landPin]);
  useEffect(() => safeSetLS("rpfaas_land_arp_no", landArpNo), [landArpNo]);
  useEffect(() => safeSetLS("rpfaas_land_area", landArea), [landArea]);
  useEffect(() => safeSetLS("rpfaas_building_owner", buildingOwner), [buildingOwner]);
  useEffect(() => safeSetLS("rpfaas_building_pin", buildingPin), [buildingPin]);
  useEffect(() => safeSetLS("rpfaas_building_td_arp_no", buildingTdArpNo), [buildingTdArpNo]);

  useEffect(() => {
    if (!propLoc.municipalityCode || propLoc.municipalities.length === 0) return;
    const name = propLoc.municipalities.find(m => m.code === propLoc.municipalityCode)?.name || '';
    if (name) safeSetLS("rpfaas_location_municipality", name);
  }, [propLoc.municipalityCode, propLoc.municipalities]);

  useEffect(() => {
    if (!propLoc.barangayCode || propLoc.barangays.length === 0) return;
    const name = propLoc.barangays.find(b => b.code === propLoc.barangayCode)?.name || '';
    if (name) safeSetLS("rpfaas_location_barangay", name);
  }, [propLoc.barangayCode, propLoc.barangays]);

  const saveFormData = useCallback(async (): Promise<string | null> => {
    const formData = collectFormData(ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, previousTdNo, previousOwner, previousAv, previousMv, previousArea, landOwner, landPin, landArpNo, landArea, buildingOwner, buildingPin, buildingTdArpNo, actualUse);
    const currentDraftId = draftId || localStorage.getItem('draft_id');
    if (!currentDraftId) formData.status = 'draft';
    try {
      const response = await fetch(
        currentDraftId ? `/api/faas/machinery/${currentDraftId}` : '/api/faas/machinery',
        { method: currentDraftId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) }
      );
      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) {
          localStorage.setItem('draft_id', result.data.id.toString());
          return result.data.id.toString();
        }
        toast.error('Save completed but no ID returned. Please try again.');
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
    }
    return null;
  }, [ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, previousTdNo, previousOwner, previousAv, previousMv, previousArea, landOwner, landPin, landArpNo, landArea, buildingOwner, buildingPin, buildingTdArpNo, actualUse, draftId]);

  const handleNext = useCallback(async () => {
    setIsSaving(true);
    const id = await saveFormData();
    if (id) { setIsDirty(false); router.push(`/machinery/fill/step-2?id=${id}`); }
    setIsSaving(false);
  }, [saveFormData, router]);

  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    const id = await saveFormData();
    if (id) { setIsDirty(false); toast.success('Draft saved successfully.'); }
    setIsSavingDraft(false);
  }, [saveFormData]);

  return (
    <FormFillLayout
      breadcrumbParent={{ label: "Machinery", href: "#" }}
      pageTitle="Step 1: Enter Owner and Property Location Details."
      sidePanel={<ErrorBoundary><ReviewCommentsFloat draftId={draftId} stepFields={["actual_use", "arp_no", "oct_tct_cloa_no", "survey_no", "pin", "lot_no", "owner_name", "owner_address", "admin_care_of", "location_municipality", "location_barangay", "location_province"]} /></ErrorBoundary>}
    >
      <FormLockBanner locked={locked} lockedBy={lockedBy} />

      <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="rpfaas-fill-title">Fill-up Form: RPFAAS - Machinery</h1>
          <p className="text-sm text-muted-foreground">Enter the details below. You can generate the printable version afterwards.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveDraft}
          disabled={isSavingDraft || isSaving || locked || lockChecking}
          className="shrink-0"
        >
          {isSavingDraft ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : 'Save Draft'}
        </Button>
      </header>

      <fieldset disabled={locked} className={`border-0 p-0 m-0 min-w-0 block${locked ? ' opacity-60' : ''}${lockChecking ? ' animate-pulse' : ''}`}>
        <form id="form_machinery_fill_main" className="rpfaas-fill-form rpfaas-fill-form-single space-y-6" onChange={markDirty}>

          <FormSection title="Property Identification">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TransactionCodeSelect value={transactionCode} onChange={setTransactionCode} codes={TRANSACTION_CODES} />
              <ArpNoField arpPrefix={arpPrefix} arpSeq={arpSeq} onArpSeqChange={setArpSeq} />
              {transactionCode && transactionCode !== "DC" && (
                <ErrorBoundary>
                  <PreviousTdBlock
                    previousTdNo={previousTdNo}
                    onPreviousTdNoChange={setPreviousTdNo}
                    previousOwner={previousOwner}
                    onPreviousOwnerChange={setPreviousOwner}
                    previousAv={previousAv}
                    previousMv={previousMv}
                    previousArea={previousArea}
                    areaLabel="Prev. Floor Area"
                  />
                </ErrorBoundary>
              )}
              <TitleNoField
                titleType={titleType}
                onTitleTypeChange={setTitleType}
                titleNo={titleNo}
                onTitleNoChange={setTitleNo}
                includeCCT
              />
              <div className="space-y-1" data-comment-field="pin">
                <Label className="rpfaas-fill-label">PIN</Label>
                <PinInput value={pin} onChange={setPin} />
              </div>
              <div className="space-y-1" data-comment-field="survey_no">
                <Label className="rpfaas-fill-label">Survey No.</Label>
                <Input value={surveyNo} onChange={(e) => setSurveyNo(e.target.value)} className="rpfaas-fill-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1" data-comment-field="lot_no">
                  <Label className="rpfaas-fill-label">Lot No.</Label>
                  <Input value={lotNo} onChange={(e) => setLotNo(e.target.value)} className="rpfaas-fill-input" />
                </div>
                <div className="space-y-1">
                  <Label className="rpfaas-fill-label">BLK</Label>
                  <Input type="number" value={blk} onChange={(e) => setBlk(e.target.value)} className="rpfaas-fill-input" />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Classification">
            <div className="space-y-1" data-comment-field="actual_use">
              <Label className="rpfaas-fill-label">Actual Use</Label>
              <div className="relative">
                <select
                  value={actualUse}
                  onChange={(e) => setActualUse(e.target.value)}
                  className="rpfaas-fill-input appearance-none w-full"
                >
                  <option value="">Select actual use</option>
                  {ACTUAL_USE_OPTIONS.map(u => (
                    <option key={u.code} value={u.code}>
                      {u.label} — {u.assessmentLevel}% assessment level
                    </option>
                  ))}
                </select>
                <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </FormSection>

          <FormSection title="Owner Information">
            <ErrorBoundary>
              <OwnerSection
                ownerName={ownerName}
                onOwnerNameChange={setOwnerName}
                ownerLoc={ownerLoc}
                adminCareOf={adminCareOf}
                onAdminCareOfChange={setAdminCareOf}
                adminLoc={adminLoc}
              />
            </ErrorBoundary>
          </FormSection>

          <FormSection title="Property Location" commentField="location_municipality location_barangay location_province">
            <ErrorBoundary>
              <PropertyLocationSection
                propertyStreet={propertyStreet}
                onPropertyStreetChange={setPropertyStreet}
                propLoc={propLoc}
                userMunicipality={userMunicipality}
              />
            </ErrorBoundary>
            <div className="border-t my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">Land Owner</Label>
                <Input value={landOwner} onChange={(e) => setLandOwner(e.target.value)} className="rpfaas-fill-input" />
              </div>
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">PIN</Label>
                <Input value={landPin} onChange={(e) => setLandPin(e.target.value)} className="rpfaas-fill-input" />
              </div>
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">TD/ARP No.</Label>
                <Input value={landArpNo} onChange={(e) => setLandArpNo(e.target.value)} className="rpfaas-fill-input" />
              </div>
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">Area <span className="text-muted-foreground font-normal">(sqm)</span></Label>
                <Input type="number" value={landArea} onChange={(e) => setLandArea(e.target.value)} className="rpfaas-fill-input" />
              </div>
            </div>
            <div className="border-t my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">Building Owner</Label>
                <Input value={buildingOwner} onChange={(e) => setBuildingOwner(e.target.value)} className="rpfaas-fill-input" />
              </div>
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">PIN</Label>
                <Input value={buildingPin} onChange={(e) => setBuildingPin(e.target.value)} className="rpfaas-fill-input" />
              </div>
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">TD/ARP No.</Label>
                <Input value={buildingTdArpNo} onChange={(e) => setBuildingTdArpNo(e.target.value)} className="rpfaas-fill-input" />
              </div>
              <div />
            </div>
          </FormSection>

          <StepPagination
            currentStep={1}
            draftId={draftId}
            isDirty={isDirty}
            onNext={handleNext}
            isNextLoading={isSaving}
            isNextDisabled={isSaving || isSavingDraft || locked || lockChecking}
            basePath="machinery"
            steps={MACHINERY_STEPS}
          />
        </form>
      </fieldset>
    </FormFillLayout>
  );
}

export default function MachineryFillPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MachineryFillPageContent />
    </Suspense>
  );
}
