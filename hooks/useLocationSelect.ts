import { useCallback, useEffect, useRef, useState } from "react";

export type LocationOption = { code: string; name: string };

export function safeSetLS(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export async function fetchLocations(type: string, parent: string): Promise<LocationOption[]> {
  try {
    const res = await fetch(`/api/locations?type=${type}&parent=${encodeURIComponent(parent)}`);
    const json = await res.json();
    if (json.success) {
      return (json.data as { psgc_code: string; name: string }[]).map(d => ({
        code: d.psgc_code,
        name: d.name,
      }));
    }
  } catch { /* network error */ }
  return [];
}

export function useLocationSelect(storagePrefix: string, initialProvinceCode = "") {
  const pendingMunicipalityRef = useRef("");
  const pendingBarangayRef = useRef("");
  const municipalityRequestRef = useRef(0);
  const barangayRequestRef = useRef(0);

  const [provinceCode, setProvinceCodeState] = useState(initialProvinceCode);
  const [municipalityCode, setMunicipalityCodeState] = useState("");
  const [barangayCode, setBarangayCodeState] = useState("");

  const [municipalities, setMunicipalities] = useState<LocationOption[]>([]);
  const [barangays, setBarangays] = useState<LocationOption[]>([]);
  const [isLoadingMun, setIsLoadingMun] = useState(false);
  const [isLoadingBar, setIsLoadingBar] = useState(false);

  const setProvinceCode = useCallback((nextProvinceCode: string) => {
    pendingMunicipalityRef.current = "";
    pendingBarangayRef.current = "";
    setProvinceCodeState(nextProvinceCode);
    setMunicipalityCodeState("");
    setBarangayCodeState("");
    setBarangays([]);
    if (!nextProvinceCode) setMunicipalities([]);
  }, []);

  const setMunicipalityCode = useCallback((nextMunicipalityCode: string) => {
    pendingBarangayRef.current = "";
    setMunicipalityCodeState(nextMunicipalityCode);
    setBarangayCodeState("");
    if (!nextMunicipalityCode) setBarangays([]);
  }, []);

  const setBarangayCode = useCallback((nextBarangayCode: string) => {
    setBarangayCodeState(nextBarangayCode);
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
    fetchLocations('municipality', provinceCode).then(items => {
      if (requestId !== municipalityRequestRef.current) return;

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
    fetchLocations('barangay', municipalityCode).then(items => {
      if (requestId !== barangayRequestRef.current) return;

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
    pendingBarangayRef.current = barCode;
    if (provCode !== provinceCode) {
      pendingMunicipalityRef.current = munCode;
      setProvinceCodeState(provCode);
    } else {
      setMunicipalityCodeState(munCode);
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
