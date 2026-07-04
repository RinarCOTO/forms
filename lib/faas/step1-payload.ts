import { PH_PROVINCES } from '@/app/components/forms/RPFAAS/constants/philippineLocations';
import type { LocationOption } from '@/hooks/useLocationSelect';

interface LocationSelection {
  provinceCode: string;
  municipalityCode: string;
  barangayCode: string;
  municipalities: LocationOption[];
  barangays: LocationOption[];
}

type BlockValueMode = 'number-or-null' | 'string';

interface CreateFaasStep1PayloadInput {
  ownerName: string;
  adminCareOf: string;
  propertyStreet: string;
  ownerLoc: LocationSelection;
  adminLoc: LocationSelection;
  propLoc: LocationSelection;
  transactionCode: string;
  tdNo: string;
  arpNo: string;
  titleType: string;
  titleNo: string;
  pin: string;
  surveyNo: string;
  lotNo: string;
  blk: string | number;
  previousTdNo: string;
  previousOwner: string;
  previousAv: string;
  previousMv: string;
  previousArea: string;
  missingTitleValue: string | null;
  blockValueMode: BlockValueMode;
  extraFields?: Record<string, unknown>;
}

function parseOptionalNumber(value: string) {
  return value ? parseFloat(value) || null : null;
}

function getProvinceName(code: string) {
  return PH_PROVINCES.find(province => province.code === code)?.name || '';
}

function getLocationName(items: LocationOption[], code: string) {
  return items.find(item => item.code === code)?.name || '';
}

function formatAddress(
  loc: Pick<LocationSelection, 'provinceCode' | 'municipalityCode' | 'barangayCode' | 'municipalities' | 'barangays'>,
) {
  const province = getProvinceName(loc.provinceCode);
  const municipality = getLocationName(loc.municipalities, loc.municipalityCode);
  const barangay = getLocationName(loc.barangays, loc.barangayCode);

  return [barangay, municipality, province].filter(Boolean).join(', ');
}

function formatTitle(titleType: string, titleNo: string, missingTitleValue: string | null) {
  return titleType === 'None' || !titleType ? missingTitleValue : `${titleType} ${titleNo}`.trim();
}

function formatBlockValue(value: string | number, mode: BlockValueMode) {
  if (mode === 'string') return value;
  return value !== '' ? Number(value) : null;
}

export function createFaasStep1Payload({
  ownerName,
  adminCareOf,
  propertyStreet,
  ownerLoc,
  adminLoc,
  propLoc,
  transactionCode,
  tdNo,
  arpNo,
  titleType,
  titleNo,
  pin,
  surveyNo,
  lotNo,
  blk,
  previousTdNo,
  previousOwner,
  previousAv,
  previousMv,
  previousArea,
  missingTitleValue,
  blockValueMode,
  extraFields = {},
}: CreateFaasStep1PayloadInput) {
  const data: Record<string, unknown> = {
    ...extraFields,
    owner_name: ownerName,
    admin_care_of: adminCareOf,
    property_address: propertyStreet,
    transaction_code: transactionCode,
    td_no: tdNo,
    arp_no: arpNo,
    oct_tct_cloa_no: formatTitle(titleType, titleNo, missingTitleValue),
    pin,
    survey_no: surveyNo,
    lot_no: lotNo,
    blk: formatBlockValue(blk, blockValueMode),
    previous_td_no: previousTdNo || null,
    previous_owner: previousOwner || null,
    previous_av: parseOptionalNumber(previousAv),
    previous_mv: parseOptionalNumber(previousMv),
    previous_area: parseOptionalNumber(previousArea),
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

  const ownerAddress = formatAddress(ownerLoc);
  if (ownerAddress) data.owner_address = ownerAddress;

  const adminAddress = formatAddress(adminLoc);
  if (adminAddress) data.admin_address = adminAddress;

  data.location_province = 'Mountain Province';
  const propMunicipality = getLocationName(propLoc.municipalities, propLoc.municipalityCode);
  const propBarangay = getLocationName(propLoc.barangays, propLoc.barangayCode);
  if (propMunicipality) data.location_municipality = propMunicipality;
  if (propBarangay) data.location_barangay = propBarangay;

  return data;
}
