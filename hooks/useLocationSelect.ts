import { useEffect, useRef, useState } from "react";

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

  const [provinceCode, setProvinceCode] = useState(initialProvinceCode);
  const [municipalityCode, setMunicipalityCode] = useState("");
  const [barangayCode, setBarangayCode] = useState("");

  const [municipalities, setMunicipalities] = useState<LocationOption[]>([]);
  const [barangays, setBarangays] = useState<LocationOption[]>([]);
  const [isLoadingMun, setIsLoadingMun] = useState(false);
  const [isLoadingBar, setIsLoadingBar] = useState(false);

  // 1. Province changes → load municipalities from API
  useEffect(() => {
    if (!pendingMunicipalityRef.current) {
      setMunicipalityCode("");
      setBarangayCode("");
    }

    if (!provinceCode) {
      setMunicipalities([]);
      pendingMunicipalityRef.current = "";
      return;
    }

    const pending = pendingMunicipalityRef.current;
    setIsLoadingMun(true);
    fetchLocations('municipality', provinceCode).then(items => {
      setMunicipalities(items);
      if (pending) {
        setMunicipalityCode(pending);
        pendingMunicipalityRef.current = "";
      }
      setIsLoadingMun(false);
    });
  }, [provinceCode]);

  // 2. Municipality changes → load barangays from API
  useEffect(() => {
    if (!municipalityCode) {
      setBarangays([]);
      if (!pendingBarangayRef.current) setBarangayCode("");
      return;
    }

    const pending = pendingBarangayRef.current;
    setIsLoadingBar(true);
    fetchLocations('barangay', municipalityCode).then(items => {
      setBarangays(items);
      if (pending) {
        setBarangayCode(pending);
        pendingBarangayRef.current = "";
      } else {
        setBarangayCode("");
      }
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
      setProvinceCode(provCode);
    } else {
      setMunicipalityCode(munCode);
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
