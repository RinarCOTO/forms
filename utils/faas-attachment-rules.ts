export type RpfaasType = "building" | "land";

export type BuildingAttachmentType =
  | "sketch_plan"
  | "perspective_view"
  | "barangay_certificate"
  | "other_certificate";

export type LandAttachmentType =
  | "barangay_certificate"
  | "ncip_certificate"
  | "sketch_plan"
  | "affidavit_of_ownership"
  | "endorsement_of_assessor"
  | "tax_declaration"
  | "survey_plan"
  | "letter_request"
  | "deed_of_sale"
  | "deed_of_donation"
  | "extra_judicial_settlement"
  | "bir_certificate"
  | "inspection_report";

export type AttachmentType = BuildingAttachmentType | LandAttachmentType;

export type AttachmentConfig<TType extends AttachmentType = AttachmentType> = {
  type: TType;
  label: string;
  description: string;
  memorandaLabel: string;
};

export const BUILDING_ATTACHMENT_CONFIG: AttachmentConfig<BuildingAttachmentType>[] = [
  {
    type: "sketch_plan",
    label: "Sketch Plan",
    description: "Architectural or engineering sketch plan of the property.",
    memorandaLabel: "a floor dimension plan",
  },
  {
    type: "perspective_view",
    label: "Perspective View",
    description: "Visual perspective drawing or photograph of the building.",
    memorandaLabel: "building picture",
  },
  {
    type: "barangay_certificate",
    label: "Barangay Certificate",
    description: "Official barangay certificate issued for the property.",
    memorandaLabel: "barangay certificate",
  },
  {
    type: "other_certificate",
    label: "Sworn Statement",
    description: "Upload Sworn Statement or other relevant certificates for this property.",
    memorandaLabel: "sworn statement of true and fair market value of real property",
  },
];

export const LAND_ATTACHMENT_DEFS: Record<LandAttachmentType, AttachmentConfig<LandAttachmentType>> = {
  barangay_certificate: {
    type: "barangay_certificate",
    label: "Barangay Certificate",
    description: "Official barangay certificate issued for the property.",
    memorandaLabel: "barangay certificate",
  },
  ncip_certificate: {
    type: "ncip_certificate",
    label: "NCIP Certificate",
    description: "National Commission on Indigenous Peoples certificate.",
    memorandaLabel: "NCIP certificate",
  },
  sketch_plan: {
    type: "sketch_plan",
    label: "Sketch Plan",
    description: "Survey sketch plan of the land.",
    memorandaLabel: "sketch plan",
  },
  affidavit_of_ownership: {
    type: "affidavit_of_ownership",
    label: "Affidavit of Ownership",
    description: "Notarized affidavit attesting to ownership of the property.",
    memorandaLabel: "affidavit of ownership",
  },
  endorsement_of_assessor: {
    type: "endorsement_of_assessor",
    label: "Endorsement of Assessor",
    description: "Written endorsement from the municipal assessor.",
    memorandaLabel: "endorsement of assessor",
  },
  tax_declaration: {
    type: "tax_declaration",
    label: "Tax Declaration",
    description: "Copy of the existing tax declaration for this property.",
    memorandaLabel: "tax declaration",
  },
  survey_plan: {
    type: "survey_plan",
    label: "Survey Plan",
    description: "Approved survey plan of the lot.",
    memorandaLabel: "survey plan",
  },
  letter_request: {
    type: "letter_request",
    label: "Letter Request",
    description: "Formal letter request from the property owner.",
    memorandaLabel: "letter request",
  },
  deed_of_sale: {
    type: "deed_of_sale",
    label: "Deed of Sale",
    description: "Notarized deed of sale transferring ownership.",
    memorandaLabel: "deed of sale",
  },
  deed_of_donation: {
    type: "deed_of_donation",
    label: "Deed of Donation",
    description: "Notarized deed of donation transferring ownership.",
    memorandaLabel: "deed of donation",
  },
  extra_judicial_settlement: {
    type: "extra_judicial_settlement",
    label: "Extra Judicial Settlement",
    description: "Notarized extra judicial settlement of estate.",
    memorandaLabel: "extra judicial settlement",
  },
  bir_certificate: {
    type: "bir_certificate",
    label: "Certificate of Authorizing Registration (BIR)",
    description: "BIR certificate confirming payment/clearance for transfer.",
    memorandaLabel: "certificate of authorizing registration (BIR)",
  },
  inspection_report: {
    type: "inspection_report",
    label: "Inspection Report",
    description: "Field inspection report prepared by the assessor.",
    memorandaLabel: "inspection report",
  },
};

function landAttachments(...types: LandAttachmentType[]) {
  return types.map((type) => LAND_ATTACHMENT_DEFS[type]);
}

type AttachmentRuleInput = {
  rpfaasType: RpfaasType;
  transactionCode?: string;
  octTctCloaNo?: string | null;
};

export function getAttachmentConfigForTransaction({
  rpfaasType,
  transactionCode,
  octTctCloaNo,
}: AttachmentRuleInput): AttachmentConfig[] | null {
  if (rpfaasType === "building") {
    return BUILDING_ATTACHMENT_CONFIG;
  }

  switch (transactionCode) {
    case "DC":
      return octTctCloaNo
        ? landAttachments("barangay_certificate", "ncip_certificate", "sketch_plan", "affidavit_of_ownership", "endorsement_of_assessor")
        : landAttachments("sketch_plan", "tax_declaration");
    case "SD":
      return landAttachments("survey_plan", "letter_request");
    case "CS":
      return landAttachments("letter_request", "survey_plan");
    case "TR":
      return landAttachments("deed_of_sale", "deed_of_donation", "extra_judicial_settlement", "bir_certificate");
    case "PC":
      return landAttachments("inspection_report", "sketch_plan", "letter_request");
    case "RC":
      return landAttachments("inspection_report", "letter_request", "sketch_plan");
    case "DP":
    case "GR":
      return null;
    default:
      return null;
  }
}
