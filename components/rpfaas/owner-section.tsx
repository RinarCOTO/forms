"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationSelect } from "@/components/ui/location-select";
import { PH_PROVINCES } from "@/app/components/forms/RPFAAS/constants/philippineLocations";
import type { useLocationSelect } from "@/hooks/useLocationSelect";

type LocationSelectState = ReturnType<typeof useLocationSelect>;

interface OwnerSectionProps {
  ownerName: string;
  onOwnerNameChange: (v: string) => void;
  ownerLoc: LocationSelectState;
  adminCareOf: string;
  onAdminCareOfChange: (v: string) => void;
  adminLoc: LocationSelectState;
}

export function OwnerSection({
  ownerName,
  onOwnerNameChange,
  ownerLoc,
  adminCareOf,
  onAdminCareOfChange,
  adminLoc,
}: OwnerSectionProps) {
  return (
    <>
      <div className="rpfaas-fill-field space-y-1" data-comment-field="owner_name">
        <Label className="rpfaas-fill-label">Owner</Label>
        <Input value={ownerName} onChange={(e) => onOwnerNameChange(e.target.value)} className="rpfaas-fill-input" />
      </div>

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
        <Input value={adminCareOf} onChange={(e) => onAdminCareOfChange(e.target.value)} className="rpfaas-fill-input" />
      </div>

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
    </>
  );
}
