import { useCallback, useEffect, useRef, useState } from "react";
import {
  DUMMY_BARANGAYS,
  DUMMY_MUNICIPALITIES,
} from "@/app/components/forms/RPFAAS/constants/locations";

export type LocationOption = { code: string; name: string };

export function safeSetLS(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export async function fetchLocations(type: string, parent: string): Promise<LocationOption[]> {
  try {
    const res = await fetch(`/api/locations?type=${type}&parent=${encodeURIComponent(parent)}`);
    const json = await res.json();
    if (json.success) {
      const seen = new Set<string>();
      return (json.data as { psgc_code: string; name: string }[])
        .map(d => ({
          code: normalizeMountainProvinceCode(d.psgc_code),
          name: d.name,
        }))
        .filter(item => {
          if (seen.has(item.code)) return false;
          seen.add(item.code);
          return true;
        });
    }
  } catch { /* network error */ }
  return [];
}

function normalizeMountainProvinceCode(code: string) {
  if (code.startsWith("14044") && code.length === 10) {
    return code.slice(0, 2) + code.slice(3);
  }
  return code;
}

function getMountainProvinceFallbackLocations(type: string, parent: string): LocationOption[] {
  const normalizedParent = normalizeMountainProvinceCode(parent);

  if (type === "municipality" && normalizedParent === "144400000") {
    return DUMMY_MUNICIPALITIES.map(item => ({
      code: item.code,
      name: item.name,
    }));
  }

  if (type === "barangay") {
    return DUMMY_BARANGAYS
      .filter(item => item.municipalityCode === normalizedParent)
      .map(item => ({
        code: item.code,
        name: item.name,
      }));
  }

  return [];
}

export function useLocationSelect(storagePrefix: string, initialProvinceCode = "") {
  const pendingMunicipalityRef = useRef("");
  const pendingBarangayRef = useRef("");
  const municipalityRequestRef = useRef(0);
  const barangayRequestRef = useRef(0);

  const [provinceCode, setProvinceCodeState] = useState(normalizeMountainProvinceCode(initialProvinceCode));
  const [municipalityCode, setMunicipalityCodeState] = useState("");
  const [barangayCode, setBarangayCodeState] = useState("");

  const [municipalities, setMunicipalities] = useState<LocationOption[]>([]);
  const [barangays, setBarangays] = useState<LocationOption[]>([]);
  const [isLoadingMun, setIsLoadingMun] = useState(false);
  const [isLoadingBar, setIsLoadingBar] = useState(false);

  const setProvinceCode = useCallback((nextProvinceCode: string) => {
    const normalizedProvinceCode = normalizeMountainProvinceCode(nextProvinceCode);
    pendingMunicipalityRef.current = "";
    pendingBarangayRef.current = "";
    setProvinceCodeState(normalizedProvinceCode);
    setMunicipalityCodeState("");
    setBarangayCodeState("");
    setBarangays([]);
    if (!normalizedProvinceCode) setMunicipalities([]);
  }, []);

  const setMunicipalityCode = useCallback((nextMunicipalityCode: string) => {
    const normalizedMunicipalityCode = normalizeMountainProvinceCode(nextMunicipalityCode);
    pendingBarangayRef.current = "";
    setMunicipalityCodeState(normalizedMunicipalityCode);
    setBarangayCodeState("");
    if (!normalizedMunicipalityCode) setBarangays([]);
  }, []);

  const setBarangayCode = useCallback((nextBarangayCode: string) => {
    setBarangayCodeState(normalizeMountainProvinceCode(nextBarangayCode));
  }, []);

  // 1. Province changes → load municipalities from API
  useEffect(() => {
    const requestId = ++municipalityRequestRef.current;

    if (!pendingMunicipalityRef.current) {
      setMunicipalityCodeState("");
      setBarangayCodeState("");
      setBarangays([]);
    }

    if (!provinceCode) {
      setMunicipalities([]);
      setIsLoadingMun(false);
      pendingMunicipalityRef.current = "";
      return;
    }

    const pending = pendingMunicipalityRef.current;
    setIsLoadingMun(true);
    fetchLocations('municipality', provinceCode).then(apiItems => {
      if (requestId !== municipalityRequestRef.current) return;

      const items = apiItems.length
        ? apiItems
        : getMountainProvinceFallbackLocations('municipality', provinceCode);
      setMunicipalities(items);
      if (pending && items.some(item => item.code === pending)) {
        setMunicipalityCodeState(pending);
      } else {
        setMunicipalityCodeState("");
        setBarangayCodeState("");
        pendingBarangayRef.current = "";
      }
      pendingMunicipalityRef.current = "";
      setIsLoadingMun(false);
    });
  }, [provinceCode]);

  // 2. Municipality changes → load barangays from API
  useEffect(() => {
    const requestId = ++barangayRequestRef.current;

    if (!municipalityCode) {
      setBarangays([]);
      setIsLoadingBar(false);
      if (!pendingBarangayRef.current) setBarangayCodeState("");
      return;
    }

    const pending = pendingBarangayRef.current;
    setIsLoadingBar(true);
    fetchLocations('barangay', municipalityCode).then(apiItems => {
      if (requestId !== barangayRequestRef.current) return;

      const items = apiItems.length
        ? apiItems
        : getMountainProvinceFallbackLocations('barangay', municipalityCode);
      setBarangays(items);
      if (pending && items.some(item => item.code === pending)) {
        setBarangayCodeState(pending);
      } else {
        setBarangayCodeState("");
      }
      pendingBarangayRef.current = "";
      setIsLoadingBar(false);
    });
  }, [municipalityCode]);

  // 3. Persist to localStorage
  useEffect(() => {
    safeSetLS(`${storagePrefix}_province_code`, provinceCode);
    safeSetLS(`${storagePrefix}_municipality_code`, municipalityCode);
    safeSetLS(`${storagePrefix}_barangay_code`, barangayCode);
  }, [provinceCode, municipalityCode, barangayCode, storagePrefix]);

  // Load all three levels atomically — avoids effect-chain race conditions during draft restore
  function loadLocation(provCode: string, munCode: string, barCode: string) {
    const normalizedProvinceCode = normalizeMountainProvinceCode(provCode);
    const normalizedMunicipalityCode = normalizeMountainProvinceCode(munCode);
    const normalizedBarangayCode = normalizeMountainProvinceCode(barCode);

    pendingBarangayRef.current = normalizedBarangayCode;
    if (normalizedProvinceCode !== provinceCode) {
      pendingMunicipalityRef.current = normalizedMunicipalityCode;
      setProvinceCodeState(normalizedProvinceCode);
    } else {
      setMunicipalityCodeState(normalizedMunicipalityCode);
    }
  }

  return {
    provinceCode, setProvinceCode,
    municipalityCode, setMunicipalityCode,
    barangayCode, setBarangayCode,
    loadLocation,
    municipalities,
    barangays,
    isLoadingMun,
    isLoadingBar,
  };
}
