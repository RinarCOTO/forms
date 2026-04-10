"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationSelect } from "@/components/ui/location-select";
import { MOUNTAIN_PROVINCE_CODE } from "@/app/components/forms/RPFAAS/constants/philippineLocations";
import type { useLocationSelect, LocationOption } from "@/hooks/useLocationSelect";

type LocationSelectState = ReturnType<typeof useLocationSelect>;

interface PropertyLocationSectionProps {
  propertyStreet: string;
  onPropertyStreetChange: (v: string) => void;
  propLoc: LocationSelectState;
  userMunicipality: string;
}

export function PropertyLocationSection({
  propertyStreet,
  onPropertyStreetChange,
  propLoc,
  userMunicipality,
}: PropertyLocationSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div className="space-y-1">
        <Label className="rpfaas-fill-label">No/Street/Sitio</Label>
        <Input value={propertyStreet} onChange={(e) => onPropertyStreetChange(e.target.value)} className="rpfaas-fill-input" />
      </div>
      <div className="space-y-1">
        <Label className="rpfaas-fill-label-sub">Province</Label>
        <div className="rpfaas-fill-input bg-muted/50 text-muted-foreground cursor-not-allowed select-none">
          Mountain Province
        </div>
      </div>
      {userMunicipality ? (
        <div className="space-y-1">
          <Label className="rpfaas-fill-label-sub">Municipality</Label>
          <div className="rpfaas-fill-input bg-muted/50 text-muted-foreground cursor-not-allowed select-none">
            {propLoc.municipalities.find((m: LocationOption) => m.code === propLoc.municipalityCode)?.name || userMunicipality}
          </div>
        </div>
      ) : (
        <LocationSelect
          label="Municipality"
          value={propLoc.municipalityCode}
          onChange={propLoc.setMunicipalityCode}
          options={propLoc.municipalities}
          placeholder="Select Municipality"
          loading={propLoc.isLoadingMun}
        />
      )}
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
  );
}
