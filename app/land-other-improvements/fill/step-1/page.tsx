"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense, useRef, useMemo } from "react";
import "@/app/styles/forms-fill.css";
import { StepPagination } from "@/components/ui/step-pagination";
import { LAND_STEPS } from "@/app/land-other-improvements/fill/constants";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { FormSection } from "@/components/ui/form-section";
import { FormLockBanner } from "@/components/ui/form-lock-banner";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PH_PROVINCES, MOUNTAIN_PROVINCE_CODE } from "@/app/components/forms/RPFAAS/constants/philippineLocations";
import { useFormLock } from "@/hooks/useFormLock";
import { useLocationSelect, safeSetLS } from "@/hooks/useLocationSelect";
import { PinInput } from "@/components/ui/pin-input";
import { OwnerSection } from "@/components/rpfaas/owner-section";
import { PropertyLocationSection } from "@/components/rpfaas/property-location-section";
import { ArpNoField } from "@/components/rpfaas/arp-no-field";
import { TitleNoField } from "@/components/rpfaas/title-no-field";
import { PreviousTdBlock } from "@/components/rpfaas/previous-td-block";
import { TransactionCodeSelect, type TransactionCode } from "@/components/rpfaas/transaction-code-select";

const TRANSACTION_CODES: TransactionCode[] = [
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
      }
    };
    loadDraft();
  }, [draftId]);

  // Debounced lookup: when Previous TD No. changes, fetch matching approved land record
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
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
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
    } catch {
      toast.error("Error saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [saveData]);

  const handleNext = useCallback(async () => {
    setIsSaving(true);
    try {
      const id = await saveData();
      if (id) {
        localStorage.setItem('draft_id', id);
        router.push(`/land-other-improvements/fill/step-2?id=${id}`);
      } else {
        toast.error('Save completed but no ID returned. Please try again.');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [saveData, router]);

  return (
    <FormFillLayout
      breadcrumbParent={{ label: "Land & Other Improvements", href: "#" }}
      pageTitle="Step 1: Enter Owner and Property Location Details."
    >
      <FormLockBanner locked={locked} lockedBy={lockedBy} />

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

      <fieldset disabled={locked || lockChecking} className={`border-0 p-0 m-0 min-w-0 block${locked || lockChecking ? ' opacity-60' : ''}`}>
        <form id={`form_${FORM_NAME}_main`} className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">

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
                  />
                </ErrorBoundary>
              )}
              <TitleNoField
                titleType={titleType}
                onTitleTypeChange={setTitleType}
                titleNo={titleNo}
                onTitleNoChange={setTitleNo}
              />
              <div className="space-y-1">
                <Label className="rpfaas-fill-label">PIN</Label>
                <PinInput value={pin} onChange={setPin} placeholder="046-20-001-01-005" maxLength={17} />
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

          <FormSection title="Location Property">
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
            isDirty={false}
            onNext={handleNext}
            isNextLoading={isSaving}
            isNextDisabled={isSaving || locked || lockChecking}
            basePath="land-other-improvements"
            steps={LAND_STEPS}
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
