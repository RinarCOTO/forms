const MUNICIPALITY_LABELS: Record<string, string> = {
  barlig: 'Barlig',
  bauko: 'Bauko',
  besao: 'Besao',
  bontoc: 'Bontoc',
  natonin: 'Natonin',
  paracellis: 'Paracellis',
  sabangan: 'Sabangan',
  sagada: 'Sagada',
  sadanga: 'Sadanga',
  tadian: 'Tadian',
};

const MUNICIPALITY_ALIASES: Record<string, string> = {
  barlig: 'barlig',
  bauko: 'bauko',
  besao: 'besao',
  bontoc: 'bontoc',
  natonin: 'natonin',
  paracelis: 'paracellis',
  paracellis: 'paracellis',
  sabangan: 'sabangan',
  sagada: 'sagada',
  sadanga: 'sadanga',
  tadian: 'tadian',
};

export function normalizeMunicipality(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  return MUNICIPALITY_ALIASES[normalized] ?? normalized;
}

export function getMunicipalityLabel(value: string | null | undefined) {
  const normalized = normalizeMunicipality(value);
  if (!normalized) return null;
  return MUNICIPALITY_LABELS[normalized] ?? value?.trim() ?? null;
}

export function getMunicipalityComparisonValues(value: string | null | undefined) {
  const raw = value?.trim();
  const normalized = normalizeMunicipality(value);
  if (!raw || !normalized) return [];

  const aliasValues = Object.entries(MUNICIPALITY_ALIASES)
    .filter(([, canonical]) => canonical === normalized)
    .map(([alias]) => alias);

  return [
    raw,
    raw.toLowerCase(),
    normalized,
    getMunicipalityLabel(normalized),
    ...aliasValues,
    ...aliasValues.map((alias) => getMunicipalityLabel(alias)),
  ].filter((item): item is string => !!item);
}
