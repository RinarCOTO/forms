"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense, useRef, useMemo } from "react";
import { StepPagination } from "@/components/ui/step-pagination";
import { BUILDING_STEPS } from "@/app/building-other-structure/fill/constants";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import "@/app/styles/forms-fill.css";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { SaveDraftButton } from "@/components/SaveDraftButton";
import { useSaveDraftShortcut } from "@/hooks/useSaveDraftShortcut";
import { useFormLock } from "@/hooks/useFormLock";
import { FormLockBanner } from "@/components/ui/form-lock-banner";
import { FormSection } from "@/components/ui/form-section";
import { toast } from "sonner";
import { PH_PROVINCES, MOUNTAIN_PROVINCE_CODE } from "@/app/components/forms/RPFAAS/constants/philippineLocations";
import { PinInput } from "@/components/ui/pin-input";
import { useLocationSelect, safeSetLS } from "@/hooks/useLocationSelect";
import { OwnerSection } from "@/components/rpfaas/owner-section";
import { PropertyLocationSection } from "@/components/rpfaas/property-location-section";
import { ArpNoField } from "@/components/rpfaas/arp-no-field";
import { TitleNoField } from "@/components/rpfaas/title-no-field";
import { PreviousTdBlock } from "@/components/rpfaas/previous-td-block";
import { TransactionCodeSelect, type TransactionCode } from "@/components/rpfaas/transaction-code-select";

const TRANSACTION_CODES: TransactionCode[] = [
  { code: "DC", label: "DC – Discovery / Newly Discovered", description: "Used for newly constructed buildings, or for existing structures that were previously undeclared and are being assessed for the very first time." },
  { code: "TR", label: "TR – Transfer", description: "Used when the ownership of the building is being transferred to a new owner." },
  { code: "PC", label: "PC – Physical Change", description: "Used when an existing building undergoes structural changes that affect its market value, such as major renovations, extensions, additions, or partial demolitions." },
  { code: "RC", label: "RC – Reassessment / Reclassification", description: "Used when there is a change in the building's actual use (e.g., a residential house is converted into a commercial establishment) or when an owner requests a value review outside of a general revision period." },
  { code: "DM", label: "DM – Demolition / Destruction", description: "Used to cancel or lower an assessment when a building is entirely torn down, condemned, or destroyed by a calamity (like a fire or typhoon)." },
  { code: "GR", label: "GR – General Revision", description: "Used during the LGU's mandated, periodic city-wide or municipality-wide updating of property assessments and fair market values." },
  { code: "DP", label: "DP – Depreciation", description: "Used when a tax declaration is updated specifically to apply the allowable physical depreciation to the building's value based on its age and condition." },
];

const FORM_NAME = "building_other_structure_fill";

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

function BuildingOtherStructureFillPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');

  const { checking: lockChecking, locked, lockedBy } = useFormLock('building_structures', draftId);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isInitializedRef = useRef(false);
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

  const ownerLoc = useLocationSelect("rpfaas_owner_address");
  const adminLoc = useLocationSelect("rpfaas_admin");
  const propLoc  = useLocationSelect("rpfaas_location", MOUNTAIN_PROVINCE_CODE);

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
        const response = await fetch(`/api/faas/building-structures/${draftId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            if (data.status === 'approved') {
              router.replace(`/building-other-structure/print-preview?id=${draftId}`);
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

  // Debounced lookup: when Previous TD No. changes, fetch matching approved building record
  useEffect(() => {
    if (prevTdLookupTimer.current) clearTimeout(prevTdLookupTimer.current);
    if (!previousTdNo || previousTdNo.length < 5) return;
    prevTdLookupTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/faas/building-structures?arp_no=${encodeURIComponent(previousTdNo)}`);
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

  const handleNext = useCallback(async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData(ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, previousTdNo, previousOwner, previousAv, previousMv, previousArea);
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      if (!currentDraftId) formData.status = 'draft';
      let response;
      if (currentDraftId) {
        response = await fetch(`/api/faas/building-structures/${currentDraftId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/faas/building-structures', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
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
  }, [ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, previousTdNo, previousOwner, previousAv, previousMv, previousArea, draftId, router]);

  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      const formData = collectFormData(ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, previousTdNo, previousOwner, previousAv, previousMv, previousArea);
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      if (!currentDraftId) formData.status = 'draft';
      let response;
      if (currentDraftId) {
        response = await fetch(`/api/faas/building-structures/${currentDraftId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/faas/building-structures', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
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
  }, [ownerName, adminCareOf, propertyStreet, ownerLoc, adminLoc, propLoc, transactionCode, arpNo, titleType, titleNo, pin, surveyNo, lotNo, blk, previousTdNo, previousOwner, previousAv, previousMv, previousArea, draftId]);

  useSaveDraftShortcut(handleSaveDraft, isSavingDraft || locked);

  return (
    <FormFillLayout
      breadcrumbParent={{ label: "Building Your Application", href: "#" }}
      pageTitle="Step 1: Enter Owner and Property Location Details."
      sidePanel={<ErrorBoundary><ReviewCommentsFloat draftId={draftId} stepFields={["arp_no","oct_tct_cloa_no","survey_no","pin","lot_no","owner_name","owner_address","admin_care_of","location_municipality","location_barangay","location_province"]} /></ErrorBoundary>}
    >
      <FormLockBanner locked={locked} lockedBy={lockedBy} />

      <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="rpfaas-fill-title">Fill-up Form: RPFAAS - Building &amp; Other Structures</h1>
          <p className="text-sm text-muted-foreground">Enter the details below. You can generate the printable version afterwards.</p>
        </div>
        <SaveDraftButton
          onClick={handleSaveDraft}
          isSaving={isSavingDraft}
          disabled={isSaving || locked || lockChecking}
        />
      </header>

      <fieldset disabled={locked} className={`border-0 p-0 m-0 min-w-0 block${locked ? ' opacity-60' : ''}${lockChecking ? ' animate-pulse' : ''}`}>
        <form id={`form_${FORM_NAME}_main`} className="rpfaas-fill-form rpfaas-fill-form-single space-y-6" onChange={markDirty}>

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

          <FormSection title="Location Property" commentField="location_municipality location_barangay location_province">
            <ErrorBoundary>
              <PropertyLocationSection
                propertyStreet={propertyStreet}
                onPropertyStreetChange={setPropertyStreet}
                propLoc={propLoc}
                userMunicipality={userMunicipality}
              />
            </ErrorBoundary>
          </FormSection>

          <StepPagination
            currentStep={1}
            draftId={draftId}
            isDirty={isDirty}
            onNext={handleNext}
            isNextLoading={isSaving}
            isNextDisabled={isSaving || isSavingDraft || locked || lockChecking}
            steps={BUILDING_STEPS}
          />
        </form>
      </fieldset>
    </FormFillLayout>
  );
}

export default function BuildingOtherStructureFillPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuildingOtherStructureFillPageContent />
    </Suspense>
  );
}
