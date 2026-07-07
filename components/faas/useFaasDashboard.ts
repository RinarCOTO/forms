"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isFaasSubmittableStatus } from "@/lib/faas/workflow";

export interface FaasDashboardConfig {
  label: string;
  cardDescription?: string;
  /** If set, renders label as a link + "Submissions" page item. Otherwise renders label as page item. */
  breadcrumbHref?: string;

  apiPath: string;
  fillPath: string;
  /** Enables Submit for Review action and smart View routing for submittable statuses. */
  previewPath?: string;
  /** Where View navigates for non-submittable statuses. */
  printPreviewPath?: string;
  /** Enables Print, Export, and Bulk Export. */
  printApiPath?: string;
  exportFilenamePrefix?: string;

  /** Machinery uses 'municipality'; all others use 'location_municipality'. */
  municipalityField: "municipality" | "location_municipality";
  hasBarangay: boolean;
  hasMunicipalAssessor: boolean;

  realtimeChannel?: string;
  /** If set, only processes broadcast events where payload.form_type matches this value. */
  realtimeFormTypeFilter?: string;

  /** Statuses (beyond admin) where the owner can delete their own submission. */
  canDeleteStatuses: string[];
}

export interface FormSubmission {
  id: number;
  owner_name?: string;
  title?: string;
  municipality?: string;
  location_municipality?: string;
  location_barangay?: string;
  updated_at: string;
  approved_at?: string | null;
  status: string;
  created_by?: string;
}

export const PAGE_SIZE = 10;
export const EXPORT_PRESETS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 28 days", value: "28d" },
  { label: "Last 3 months", value: "3m" },
  { label: "Last 6 months", value: "6m" },
  { label: "All approved", value: "all" },
] as const;

export type ExportPreset = typeof EXPORT_PRESETS[number]["value"];

function sortLatestFirst(submissions: FormSubmission[]) {
  return [...submissions].sort((a, b) => {
    const bTime = new Date(b.updated_at).getTime();
    const aTime = new Date(a.updated_at).getTime();
    if (bTime !== aTime) return bTime - aTime;
    return b.id - a.id;
  });
}

function getExportCutoff(preset: ExportPreset): Date | null {
  const now = new Date();
  switch (preset) {
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "28d": return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    case "3m": return new Date(new Date().setMonth(now.getMonth() - 3));
    case "6m": return new Date(new Date().setMonth(now.getMonth() - 6));
    case "all": return null;
  }
}

export function useFaasDashboard(config: FaasDashboardConfig) {
  const router = useRouter();

  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [selectedBarangays, setSelectedBarangays] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [approvedForExport, setApprovedForExport] = useState<FormSubmission[]>([]);
  const [allMunicipalities, setAllMunicipalities] = useState<string[]>([]);
  const [allBarangays, setAllBarangays] = useState<string[]>([]);
  const [user, setUser] = useState<{
    id: string;
    role: string;
    municipality?: string;
    municipalities?: string[];
    permissions: Record<string, boolean>;
  } | null>(null);
  const defaultMunicipalityApplied = useRef(false);
  const [municipalAssessors, setMunicipalAssessors] = useState<{ full_name: string; municipality: string }[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkExportOpen, setBulkExportOpen] = useState(false);
  const [exportPreset, setExportPreset] = useState<ExportPreset>("28d");
  const [bulkExportLoading, setBulkExportLoading] = useState(false);
  const [bulkExportProgress, setBulkExportProgress] = useState<{ done: number; total: number } | null>(null);

  const getMunicipality = useCallback((s: FormSubmission) =>
    config.municipalityField === "location_municipality"
      ? (s.location_municipality ?? "")
      : (s.municipality ?? ""),
  [config.municipalityField]);

  const fetchSubmissions = useCallback(async (
    page: number,
    searchVal: string,
    municipalities: string[],
    barangays: string[],
  ) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (searchVal) params.set("search", searchVal);
      municipalities.forEach(m => params.append("municipality", m));
      barangays.forEach(b => params.append("barangay", b));
      const res = await fetch(`${config.apiPath}?${params}`);
      if (res.ok) {
        const json = await res.json();
        setSubmissions(sortLatestFirst(json?.data ?? json ?? []));
        setTotal(json?.total ?? 0);
      } else {
        const errorJson = await res.json().catch(() => null);
        setFetchError(errorJson?.error ?? errorJson?.details ?? `Request failed (${res.status})`);
        setSubmissions([]);
        setTotal(0);
      }
    } catch {
      setFetchError("Unable to load submissions. Please refresh and try again.");
      setSubmissions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [config.apiPath]);

  const fetchApproved = useCallback(async () => {
    const params = new URLSearchParams({ status: "approved", limit: "1000" });
    try {
      const res = await fetch(`${config.apiPath}?${params}`);
      if (res.ok) {
        const json = await res.json();
        setApprovedForExport(json?.data ?? []);
      }
    } catch {
      // non-critical
    }
  }, [config.apiPath]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchSubmissions(currentPage, search, selectedMunicipalities, selectedBarangays);
  }, [currentPage, search, selectedMunicipalities, selectedBarangays, fetchSubmissions]);

  useEffect(() => {
    if (defaultMunicipalityApplied.current) return;
    const assignedMunicipalities =
      user?.municipalities && user.municipalities.length > 0
        ? user.municipalities
        : user?.municipality
          ? [user.municipality]
          : [];
    if (!user || user.role !== "laoo" || assignedMunicipalities.length === 0) return;
    if (allMunicipalities.length === 0) return;

    defaultMunicipalityApplied.current = true;
    const matches = allMunicipalities.filter((municipality) =>
      assignedMunicipalities.some((assigned) => municipality.toLowerCase() === assigned.toLowerCase())
    );
    if (matches.length > 0) setSelectedMunicipalities(matches);
  }, [user, allMunicipalities]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/users/permissions");
        if (res.ok) setUser(await res.json());
      } catch (e) {
        console.error("Failed to fetch user:", e);
      }
    };

    fetch(`${config.apiPath}?meta=1`)
      .then(res => res.ok ? res.json() : null)
      .then(meta => {
        if (meta?.municipalities) setAllMunicipalities(meta.municipalities);
        if (meta?.barangays) setAllBarangays(meta.barangays);
      })
      .catch(() => {
        // non-critical - dropdowns fall back to current page values
      });

    fetchUser();

    if (config.hasMunicipalAssessor) {
      fetch("/api/users/by-role?role=municipal_assessor")
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setMunicipalAssessors(data.users ?? []);
        })
        .catch(e => console.error("Failed to fetch municipal assessors:", e));
    }

    if (!config.realtimeChannel) return;

    const VISIBLE_STATUSES = ["submitted", "municipal_signed", "laoo_approved", "returned", "returned_to_municipal", "approved"];
    const supabase = createClient();
    const channel = supabase
      .channel(config.realtimeChannel)
      .on("broadcast", { event: "status_change" }, ({ payload }) => {
        if (config.realtimeFormTypeFilter && payload?.form_type !== config.realtimeFormTypeFilter) return;
        const updated = payload as FormSubmission;
        setSubmissions(prev => {
          const exists = prev.some(s => s.id === updated.id);
          if (exists) {
            if (!VISIBLE_STATUSES.includes(updated.status)) return prev.filter(s => s.id !== updated.id);
            return sortLatestFirst(prev.map(s => s.id === updated.id ? { ...s, status: updated.status, updated_at: updated.updated_at } : s));
          }
          if (VISIBLE_STATUSES.includes(updated.status)) return sortLatestFirst([updated, ...prev]);
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // config is a module-level constant in each page file, so this is stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBackToDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleNewForm = useCallback(async () => {
    try {
      const res = await fetch(config.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft", updated_at: new Date().toISOString() }),
      });
      if (res.ok) {
        const data = await res.json();
        const newId = data?.data?.id ?? data?.id;
        if (newId) {
          router.push(`${config.fillPath}?id=${newId}`);
        } else {
          alert("Failed to get new record ID.");
        }
      } else {
        alert("Failed to create new submission.");
      }
    } catch {
      alert("Error creating new submission.");
    }
  }, [router, config.apiPath, config.fillPath]);

  const handleView = useCallback((id: number, status: string) => {
    if (config.previewPath && config.printPreviewPath) {
      router.push(isFaasSubmittableStatus(status)
        ? `${config.previewPath}?id=${id}`
        : `${config.printPreviewPath}?id=${id}`
      );
    } else {
      router.push(`${config.fillPath}?id=${id}`);
    }
  }, [router, config.previewPath, config.printPreviewPath, config.fillPath]);

  const handleEdit = useCallback((id: number) => {
    router.push(`${config.fillPath}?id=${id}`);
  }, [router, config.fillPath]);

  const handleSubmitForReview = useCallback((id: number) => {
    if (config.previewPath) router.push(`${config.previewPath}?id=${id}`);
  }, [router, config.previewPath]);

  const handleDeleteSubmission = useCallback((id: number) => {
    setSubmissionToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (submissionToDelete === null) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${config.apiPath}/${submissionToDelete}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok && result.success) {
        setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete));
      } else {
        alert(result.message || "Failed to delete submission.");
      }
    } catch {
      alert("Error deleting submission.");
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setSubmissionToDelete(null);
    }
  }, [submissionToDelete, config.apiPath]);

  const getMunicipalAssessor = (muni?: string) => {
    if (!muni) return "—";
    return municipalAssessors.find(
      a => a.municipality?.toLowerCase() === muni.toLowerCase()
    )?.full_name ?? "—";
  };

  const permissionKey = config.apiPath
    .replace("/api/faas/", "")
    .replace(/-/g, "_");

  const canDelete = (submission: FormSubmission) => {
    if (!user) return false;
    if (user.permissions[`${permissionKey}.delete`]) return true;
    return config.canDeleteStatuses.includes(submission.status) && submission.created_by === user.id;
  };

  const canPrint = user && (user.permissions[`${permissionKey}.view`] ?? false);

  const getPrintUrl = (id: number, includeAttachments: boolean) => {
    if (!config.printApiPath) return "";
    return `${config.printApiPath}/${id}${includeAttachments ? "" : "?attachments=0"}`;
  };

  const handleExportSingle = useCallback(async (submission: FormSubmission) => {
    if (!config.printApiPath) return;
    const res = await fetch(`${config.printApiPath}/${submission.id}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.exportFilenamePrefix ?? "RPFAAS-"}${submission.owner_name ?? "Unknown"}_${submission.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config.printApiPath, config.exportFilenamePrefix]);

  const approvedInRange = approvedForExport.filter(s => {
    const cutoff = getExportCutoff(exportPreset);
    if (!cutoff) return true;
    if (!s.approved_at) return false;
    return new Date(s.approved_at) >= cutoff;
  });

  const handleBulkExport = async () => {
    if (!config.printApiPath || approvedInRange.length === 0) return;
    setBulkExportLoading(true);
    setBulkExportProgress({ done: 0, total: approvedInRange.length });
    try {
      if (approvedInRange.length === 1) {
        const sub = approvedInRange[0];
        const res = await fetch(`${config.printApiPath}/${sub.id}`);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${config.exportFilenamePrefix ?? "RPFAAS-"}${sub.owner_name ?? "Unknown"}_${sub.id}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setBulkExportProgress({ done: 1, total: 1 });
      } else {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (let i = 0; i < approvedInRange.length; i++) {
          const sub = approvedInRange[i];
          const res = await fetch(`${config.printApiPath}/${sub.id}`);
          if (res.ok) {
            const blob = await res.blob();
            zip.file(`${config.exportFilenamePrefix ?? "RPFAAS-"}${sub.owner_name ?? "Unknown"}_${sub.id}.pdf`, blob);
          }
          setBulkExportProgress({ done: i + 1, total: approvedInRange.length });
        }
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${config.label.replace(/\s+/g, "-")}-Approved-${new Date().toISOString().slice(0, 10)}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setBulkExportLoading(false);
      setBulkExportProgress(null);
      setBulkExportOpen(false);
    }
  };

  const uniqueMunicipalities = allMunicipalities.length > 0
    ? allMunicipalities
    : [...new Set(submissions.map(getMunicipality).filter(Boolean))].sort();
  const uniqueBarangays = config.hasBarangay
    ? (allBarangays.length > 0
        ? allBarangays
        : [...new Set(submissions.map(s => s.location_barangay).filter(Boolean))].sort() as string[])
    : [];

  const toggleMunicipality = (muni: string) => {
    setSelectedMunicipalities(prev => prev.includes(muni) ? prev.filter(m => m !== muni) : [...prev, muni]);
    setCurrentPage(1);
  };

  const toggleBarangay = (barangay: string) => {
    setSelectedBarangays(prev => prev.includes(barangay) ? prev.filter(b => b !== barangay) : [...prev, barangay]);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    submissions,
    total,
    loading,
    fetchError,
    currentPage,
    setCurrentPage,
    selectedMunicipalities,
    selectedBarangays,
    searchInput,
    setSearchInput,
    search,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deleteLoading,
    bulkExportOpen,
    setBulkExportOpen,
    exportPreset,
    setExportPreset,
    bulkExportLoading,
    bulkExportProgress,
    approvedInRange,
    uniqueMunicipalities,
    uniqueBarangays,
    totalPages,
    handleBackToDashboard,
    handleNewForm,
    handleView,
    handleEdit,
    handleSubmitForReview,
    handleDeleteSubmission,
    confirmDelete,
    handleExportSingle,
    handleBulkExport,
    fetchApproved,
    getMunicipality,
    getMunicipalAssessor,
    canDelete,
    canPrint,
    getPrintUrl,
    toggleMunicipality,
    toggleBarangay,
  };
}
