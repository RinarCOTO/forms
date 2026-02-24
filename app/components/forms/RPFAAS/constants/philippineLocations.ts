// Philippine Standard Geographic Code (PSGC) — Province-level data
// Used for owner / admin address province selection (nationwide).
// Municipality and barangay cascade is only supported for Mountain Province;
// for all other provinces the user types municipality/barangay as free text.

export type PhProvince = { code: string; name: string; region: string };

export const PH_PROVINCES: PhProvince[] = [
  // ── NCR ─────────────────────────────────────────────────────────────────
  { code: "133900000", name: "Metro Manila (NCR)", region: "NCR" },

  // ── Region I – Ilocos Region ─────────────────────────────────────────────
  { code: "012800000", name: "Ilocos Norte",  region: "Region I" },
  { code: "013000000", name: "Ilocos Sur",    region: "Region I" },
  { code: "013300000", name: "La Union",      region: "Region I" },
  { code: "015500000", name: "Pangasinan",    region: "Region I" },

  // ── CAR – Cordillera Administrative Region ───────────────────────────────
  { code: "140100000", name: "Abra",             region: "CAR" },
  { code: "140200000", name: "Apayao",           region: "CAR" },
  { code: "141100000", name: "Benguet",          region: "CAR" },
  { code: "142700000", name: "Ifugao",           region: "CAR" },
  { code: "143100000", name: "Kalinga",          region: "CAR" },
  { code: "144400000", name: "Mountain Province", region: "CAR" },

  // ── Region II – Cagayan Valley ────────────────────────────────────────────
  { code: "020800000", name: "Batanes",       region: "Region II" },
  { code: "021500000", name: "Cagayan",       region: "Region II" },
  { code: "023100000", name: "Isabela",       region: "Region II" },
  { code: "025000000", name: "Nueva Vizcaya", region: "Region II" },
  { code: "025700000", name: "Quirino",       region: "Region II" },

  // ── Region III – Central Luzon ────────────────────────────────────────────
  { code: "030800000", name: "Aurora",     region: "Region III" },
  { code: "030900000", name: "Bataan",     region: "Region III" },
  { code: "031400000", name: "Bulacan",    region: "Region III" },
  { code: "034900000", name: "Nueva Ecija", region: "Region III" },
  { code: "035400000", name: "Pampanga",   region: "Region III" },
  { code: "036900000", name: "Tarlac",     region: "Region III" },
  { code: "037100000", name: "Zambales",   region: "Region III" },

  // ── Region IV-A – CALABARZON ─────────────────────────────────────────────
  { code: "041000000", name: "Batangas", region: "Region IV-A" },
  { code: "041600000", name: "Cavite",   region: "Region IV-A" },
  { code: "043400000", name: "Laguna",   region: "Region IV-A" },
  { code: "056200000", name: "Quezon",   region: "Region IV-A" },
  { code: "045800000", name: "Rizal",    region: "Region IV-A" },

  // ── MIMAROPA – Region IV-B ────────────────────────────────────────────────
  { code: "044100000", name: "Marinduque",        region: "MIMAROPA" },
  { code: "051400000", name: "Occidental Mindoro", region: "MIMAROPA" },
  { code: "052400000", name: "Oriental Mindoro",  region: "MIMAROPA" },
  { code: "052900000", name: "Palawan",           region: "MIMAROPA" },
  { code: "065900000", name: "Romblon",           region: "MIMAROPA" },

  // ── Region V – Bicol Region ───────────────────────────────────────────────
  { code: "050300000", name: "Albay",             region: "Region V" },
  { code: "051600000", name: "Camarines Norte",   region: "Region V" },
  { code: "051700000", name: "Camarines Sur",     region: "Region V" },
  { code: "051800000", name: "Catanduanes",       region: "Region V" },
  { code: "054000000", name: "Masbate",           region: "Region V" },
  { code: "066200000", name: "Sorsogon",          region: "Region V" },

  // ── Region VI – Western Visayas ───────────────────────────────────────────
  { code: "060400000", name: "Aklan",            region: "Region VI" },
  { code: "060600000", name: "Antique",          region: "Region VI" },
  { code: "061900000", name: "Capiz",            region: "Region VI" },
  { code: "062600000", name: "Guimaras",         region: "Region VI" },
  { code: "063000000", name: "Iloilo",           region: "Region VI" },
  { code: "074500000", name: "Negros Occidental", region: "Region VI" },

  // ── Region VII – Central Visayas ─────────────────────────────────────────
  { code: "071200000", name: "Bohol",            region: "Region VII" },
  { code: "072200000", name: "Cebu",             region: "Region VII" },
  { code: "074600000", name: "Negros Oriental",  region: "Region VII" },
  { code: "066100000", name: "Siquijor",         region: "Region VII" },

  // ── Region VIII – Eastern Visayas ────────────────────────────────────────
  { code: "071300000", name: "Biliran",       region: "Region VIII" },
  { code: "082600000", name: "Eastern Samar", region: "Region VIII" },
  { code: "083700000", name: "Leyte",         region: "Region VIII" },
  { code: "084800000", name: "Northern Samar", region: "Region VIII" },
  { code: "086000000", name: "Samar",         region: "Region VIII" },
  { code: "086400000", name: "Southern Leyte", region: "Region VIII" },

  // ── Region IX – Zamboanga Peninsula ─────────────────────────────────────
  { code: "097200000", name: "Zamboanga del Norte", region: "Region IX" },
  { code: "097300000", name: "Zamboanga del Sur",   region: "Region IX" },
  { code: "098300000", name: "Zamboanga Sibugay",   region: "Region IX" },

  // ── Region X – Northern Mindanao ─────────────────────────────────────────
  { code: "101300000", name: "Bukidnon",         region: "Region X" },
  { code: "101800000", name: "Camiguin",         region: "Region X" },
  { code: "103500000", name: "Lanao del Norte",  region: "Region X" },
  { code: "104200000", name: "Misamis Occidental", region: "Region X" },
  { code: "104300000", name: "Misamis Oriental", region: "Region X" },

  // ── Region XI – Davao Region ─────────────────────────────────────────────
  { code: "118200000", name: "Davao de Oro",     region: "Region XI" },
  { code: "112300000", name: "Davao del Norte",  region: "Region XI" },
  { code: "112400000", name: "Davao del Sur",    region: "Region XI" },
  { code: "118600000", name: "Davao Occidental", region: "Region XI" },
  { code: "112500000", name: "Davao Oriental",   region: "Region XI" },

  // ── Region XII – SOCCSKSARGEN ─────────────────────────────────────────────
  { code: "124700000", name: "Cotabato",       region: "Region XII" },
  { code: "128000000", name: "Sarangani",      region: "Region XII" },
  { code: "126500000", name: "South Cotabato", region: "Region XII" },
  { code: "126700000", name: "Sultan Kudarat", region: "Region XII" },

  // ── Region XIII – Caraga ─────────────────────────────────────────────────
  { code: "160200000", name: "Agusan del Norte", region: "Region XIII" },
  { code: "160300000", name: "Agusan del Sur",   region: "Region XIII" },
  { code: "168500000", name: "Dinagat Islands",  region: "Region XIII" },
  { code: "166800000", name: "Surigao del Norte", region: "Region XIII" },
  { code: "166900000", name: "Surigao del Sur",  region: "Region XIII" },

  // ── BARMM – Bangsamoro ────────────────────────────────────────────────────
  { code: "150900000", name: "Basilan",              region: "BARMM" },
  { code: "153600000", name: "Lanao del Sur",        region: "BARMM" },
  { code: "153800000", name: "Maguindanao del Norte", region: "BARMM" },
  { code: "153900000", name: "Maguindanao del Sur",  region: "BARMM" },
  { code: "166600000", name: "Sulu",                 region: "BARMM" },
  { code: "167000000", name: "Tawi-Tawi",            region: "BARMM" },
];

export const MOUNTAIN_PROVINCE_CODE = "144400000";
