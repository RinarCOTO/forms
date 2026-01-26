import type { Location, Municipality, Barangay } from "@/app/types/rpfaas";

export const DUMMY_PROVINCES: Location[] = [
    { code: "P-01", name: "Metro Manila" },
    { code: "P-02", name: "Cebu" },
    { code: "P-03", name: "Davao del Sur" },
];

export const DUMMY_MUNICIPALITIES: Municipality[] = [
    { code: "M-01-A", provinceCode: "P-01", name: "Makati City" },
    { code: "M-01-B", provinceCode: "P-01", name: "Taguig City" },
    { code: "M-02-A", provinceCode: "P-02", name: "Cebu City" },
    { code: "M-02-B", provinceCode: "P-02", name: "Mandaue City" },
    { code: "M-03-A", provinceCode: "P-03", name: "Davao City" },
];

export const DUMMY_BARANGAYS: Barangay[] = [
    { code: "B-01-A-1", municipalityCode: "M-01-A", name: "Bel-Air" },
    { code: "B-01-A-2", municipalityCode: "M-01-A", name: "Poblacion" },
    { code: "B-01-B-1", municipalityCode: "M-01-B", name: "Fort Bonifacio" },
    { code: "B-02-A-1", municipalityCode: "M-02-A", name: "Lahug" },
    { code: "B-03-A-1", municipalityCode: "M-03-A", name: "Buhangin" },
];
