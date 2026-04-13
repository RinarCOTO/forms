"use client"

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText, Plus, ArrowLeft, Loader2, Eye, Edit, Trash2,
  MoreHorizontal, ChevronLeft, ChevronRight, Search, Send, Download,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/faas/status-utils";

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
  municipalityField: 'municipality' | 'location_municipality';
  hasBarangay: boolean;
  hasMunicipalAssessor: boolean;

  realtimeChannel?: string;
  /** If set, only processes broadcast events where payload.form_type matches this value. */
  realtimeFormTypeFilter?: string;

  /** Statuses (beyond admin) where the owner can delete their own submission. */
  canDeleteStatuses: string[];
}

interface FormSubmission {
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

const PAGE_SIZE = 10;
const SUBMITTABLE_STATUSES = ['draft', 'returned', 'returned_to_municipal'];
const EDITABLE_STATUSES = ['draft', 'returned', 'returned_to_municipal'];
const EXPORT_PRESETS = [
  { label: 'Last 7 days',   value: '7d'  },
  { label: 'Last 28 days',  value: '28d' },
  { label: 'Last 3 months', value: '3m'  },
  { label: 'Last 6 months', value: '6m'  },
  { label: 'All approved',  value: 'all' },
] as const;
type ExportPreset = typeof EXPORT_PRESETS[number]['value'];

export function FaasDashboard({ config }: { config: FaasDashboardConfig }) {
  const router = useRouter();

  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [selectedBarangays, setSelectedBarangays] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(""); // raw input value
  const [search, setSearch] = useState("");           // debounced — triggers API call
  const [approvedForExport, setApprovedForExport] = useState<FormSubmission[]>([]);
  const [allMunicipalities, setAllMunicipalities] = useState<string[]>([]);
  const [allBarangays, setAllBarangays] = useState<string[]>([]);
  const [user, setUser] = useState<{ id: string; role: string; permissions: Record<string, boolean> } | null>(null);
  const [municipalAssessors, setMunicipalAssessors] = useState<{ full_name: string; municipality: string }[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkExportOpen, setBulkExportOpen] = useState(false);
  const [exportPreset, setExportPreset] = useState<ExportPreset>('28d');
  const [bulkExportLoading, setBulkExportLoading] = useState(false);
  const [bulkExportProgress, setBulkExportProgress] = useState<{ done: number; total: number } | null>(null);

  const getMunicipality = useCallback((s: FormSubmission) =>
    config.municipalityField === 'location_municipality'
      ? (s.location_municipality ?? '')
      : (s.municipality ?? ''),
  [config.municipalityField]);

  const fetchSubmissions = useCallback(async (
    page: number,
    searchVal: string,
    municipalities: string[],
    barangays: string[],
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (searchVal)           params.set('search', searchVal);
      municipalities.forEach(m => params.append('municipality', m));
      barangays.forEach(b     => params.append('barangay', b));
      const res = await fetch(`${config.apiPath}?${params}`);
      if (res.ok) {
        const json = await res.json();
        setSubmissions(json?.data ?? json ?? []);
        setTotal(json?.total ?? 0);
      } else {
        setSubmissions([]); setTotal(0);
      }
    } catch { setSubmissions([]); setTotal(0); }
    finally { setLoading(false); }
  }, [config.apiPath]);

  const fetchApproved = useCallback(async () => {
    const params = new URLSearchParams({ status: 'approved', limit: '1000' });
    try {
      const res = await fetch(`${config.apiPath}?${params}`);
      if (res.ok) {
        const json = await res.json();
        setApprovedForExport(json?.data ?? []);
      }
    } catch { /* non-critical */ }
  }, [config.apiPath]);

  // Debounce: wait 300 ms after the user stops typing before hitting the API
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setCurrentPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Re-fetch whenever page, search, or filters change
  useEffect(() => {
    fetchSubmissions(currentPage, search, selectedMunicipalities, selectedBarangays);
  }, [currentPage, search, selectedMunicipalities, selectedBarangays, fetchSubmissions]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/users/permissions");
        if (res.ok) setUser(await res.json());
      } catch (e) { console.error('Failed to fetch user:', e); }
    };

    // Fetch distinct location values for dropdown options — runs once, in parallel with fetchUser.
    // This ensures the municipality/barangay dropdowns are always fully populated regardless of
    // which page of records is currently loaded.
    fetch(`${config.apiPath}?meta=1`)
      .then(res => res.ok ? res.json() : null)
      .then(meta => {
        if (meta?.municipalities) setAllMunicipalities(meta.municipalities);
        if (meta?.barangays)      setAllBarangays(meta.barangays);
      })
      .catch(() => { /* non-critical — dropdowns fall back to current page values */ });

    fetchUser();

    if (config.hasMunicipalAssessor) {
      fetch('/api/users/by-role?role=municipal_assessor')
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setMunicipalAssessors(data.users ?? []); })
        .catch(e => console.error('Failed to fetch municipal assessors:', e));
    }

    if (!config.realtimeChannel) return;

    const VISIBLE_STATUSES = ['submitted', 'municipal_signed', 'laoo_approved', 'returned', 'returned_to_municipal', 'approved'];
    const supabase = createClient();
    const channel = supabase
      .channel(config.realtimeChannel)
      .on('broadcast', { event: 'status_change' }, ({ payload }) => {
        if (config.realtimeFormTypeFilter && payload?.form_type !== config.realtimeFormTypeFilter) return;
        const updated = payload as FormSubmission;
        setSubmissions(prev => {
          const exists = prev.some(s => s.id === updated.id);
          if (exists) {
            if (!VISIBLE_STATUSES.includes(updated.status)) return prev.filter(s => s.id !== updated.id);
            return prev.map(s => s.id === updated.id ? { ...s, status: updated.status, updated_at: updated.updated_at } : s);
          }
          if (VISIBLE_STATUSES.includes(updated.status)) return [updated, ...prev];
          return prev;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // config is a module-level constant in each page file, so this is stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } catch { alert("Error creating new submission."); }
  }, [router, config.apiPath, config.fillPath]);

  const handleView = useCallback((id: number, status: string) => {
    if (config.previewPath && config.printPreviewPath) {
      router.push(SUBMITTABLE_STATUSES.includes(status)
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
      const res = await fetch(`${config.apiPath}/${submissionToDelete}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok && result.success) {
        setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete));
      } else {
        alert(result.message || 'Failed to delete submission.');
      }
    } catch { alert('Error deleting submission.'); }
    finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setSubmissionToDelete(null);
    }
  }, [submissionToDelete, config.apiPath]);

  const getMunicipalAssessor = (muni?: string) => {
    if (!muni) return '—';
    return municipalAssessors.find(
      a => a.municipality?.toLowerCase() === muni.toLowerCase()
    )?.full_name ?? '—';
  };

  // Derive the permission feature prefix from the config apiPath, e.g.
  // "/api/faas/building-structures" → "building_structures"
  // "/api/faas/machinery"           → "machinery"
  // "/api/faas/land-improvements"   → "land_improvements"
  const permissionKey = config.apiPath
    .replace('/api/faas/', '')
    .replace(/-/g, '_');

  const canDelete = (submission: FormSubmission) => {
    if (!user) return false;
    if (user.permissions[`${permissionKey}.delete`]) return true;
    // Even if the role default says false, owners can still delete their own
    // draft/returned records (the API enforces this too).
    return config.canDeleteStatuses.includes(submission.status) && submission.created_by === user.id;
  };

  const canPrint = user && (user.permissions[`${permissionKey}.view`] ?? false);

  const handleExportSingle = useCallback(async (submission: FormSubmission) => {
    if (!config.printApiPath) return;
    const res = await fetch(`${config.printApiPath}/${submission.id}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.exportFilenamePrefix ?? 'RPFAAS-'}${submission.owner_name ?? 'Unknown'}_${submission.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config.printApiPath, config.exportFilenamePrefix]);

  const getExportCutoff = (preset: ExportPreset): Date | null => {
    const now = new Date();
    switch (preset) {
      case '7d':  return new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
      case '28d': return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      case '3m':  return new Date(new Date().setMonth(now.getMonth() - 3));
      case '6m':  return new Date(new Date().setMonth(now.getMonth() - 6));
      case 'all': return null;
    }
  };

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
          const a = document.createElement('a');
          a.href = url;
          a.download = `${config.exportFilenamePrefix ?? 'RPFAAS-'}${sub.owner_name ?? 'Unknown'}_${sub.id}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setBulkExportProgress({ done: 1, total: 1 });
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (let i = 0; i < approvedInRange.length; i++) {
          const sub = approvedInRange[i];
          const res = await fetch(`${config.printApiPath}/${sub.id}`);
          if (res.ok) {
            const blob = await res.blob();
            zip.file(`${config.exportFilenamePrefix ?? 'RPFAAS-'}${sub.owner_name ?? 'Unknown'}_${sub.id}.pdf`, blob);
          }
          setBulkExportProgress({ done: i + 1, total: approvedInRange.length });
        }
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.label.replace(/\s+/g, '-')}-Approved-${new Date().toISOString().slice(0, 10)}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setBulkExportLoading(false);
      setBulkExportProgress(null);
      setBulkExportOpen(false);
    }
  };

  // Use pre-fetched meta values so dropdowns show all available options, not just the current page.
  // Fall back to deriving from current page if meta hasn't loaded yet.
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

  // Filtering and pagination are now server-driven.
  // submissions = current page's records; total = full result count from server.
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginatedSubmissions = submissions;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {config.breadcrumbHref ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={config.breadcrumbHref}>{config.label}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Submissions</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>{config.label}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                {config.printApiPath && (
                  <Button variant="outline" onClick={() => { setBulkExportOpen(true); fetchApproved(); }}>
                    <Download className="h-4 w-4 mr-2" /> Bulk Export
                  </Button>
                )}
                <Button onClick={handleNewForm}>
                  <Plus className="h-4 w-4 mr-2" /> New Submission
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border shadow-sm mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search owner, municipality…"
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value); }}
                  className="pl-8 w-56 h-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={selectedMunicipalities.length > 0 ? 'default' : 'outline'} size="sm">
                    Municipality{selectedMunicipalities.length > 0 ? ` (${selectedMunicipalities.length})` : ''}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  {uniqueMunicipalities.length === 0 ? (
                    <DropdownMenuItem disabled>No municipalities</DropdownMenuItem>
                  ) : (
                    uniqueMunicipalities.map(muni => (
                      <DropdownMenuCheckboxItem
                        key={muni}
                        checked={selectedMunicipalities.includes(muni)}
                        onCheckedChange={() => toggleMunicipality(muni)}
                      >
                        {muni}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {config.hasBarangay && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={selectedBarangays.length > 0 ? 'default' : 'outline'} size="sm">
                      Barangay{selectedBarangays.length > 0 ? ` (${selectedBarangays.length})` : ''}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-64 overflow-y-auto">
                    {uniqueBarangays.length === 0 ? (
                      <DropdownMenuItem disabled>No barangays</DropdownMenuItem>
                    ) : (
                      uniqueBarangays.map(barangay => (
                        <DropdownMenuCheckboxItem
                          key={barangay}
                          checked={selectedBarangays.includes(barangay)}
                          onCheckedChange={() => toggleBarangay(barangay)}
                        >
                          {barangay}
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{config.label}</CardTitle>
                <CardDescription>
                  {config.cardDescription ?? 'View and manage all submissions for this form type'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    {search || selectedMunicipalities.length > 0 || selectedBarangays.length > 0 ? (
                      <>
                        <h3 className="text-lg font-semibold mb-2">No results</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filters.</p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                        <p className="text-muted-foreground mb-4">Get started by creating a new submission</p>
                        <Button onClick={handleNewForm}>
                          <Plus className="h-4 w-4 mr-2" /> Create First Submission
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Owner Name</TableHead>
                          <TableHead>Municipality</TableHead>
                          {config.hasMunicipalAssessor && <TableHead>Municipal Assessor</TableHead>}
                          {config.hasBarangay && <TableHead>Barangay</TableHead>}
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSubmissions.map((submission) => {
                          const muni = getMunicipality(submission);
                          return (
                            <TableRow key={submission.id}>
                              <TableCell className="font-medium">#{submission.id}</TableCell>
                              <TableCell>{submission.owner_name || submission.title || 'N/A'}</TableCell>
                              <TableCell>{muni || 'N/A'}</TableCell>
                              {config.hasMunicipalAssessor && (
                                <TableCell>{getMunicipalAssessor(muni)}</TableCell>
                              )}
                              {config.hasBarangay && (
                                <TableCell>{submission.location_barangay || 'N/A'}</TableCell>
                              )}
                              <TableCell>{new Date(submission.updated_at).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(submission.status)}>
                                  {getStatusLabel(submission.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleView(submission.id, submission.status)}>
                                      <Eye className="h-4 w-4 mr-2" /> View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleEdit(submission.id)}
                                      disabled={!EDITABLE_STATUSES.includes(submission.status)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    {config.previewPath && SUBMITTABLE_STATUSES.includes(submission.status) && (
                                      <DropdownMenuItem onClick={() => handleSubmitForReview(submission.id)}>
                                        <Send className="h-4 w-4 mr-2" /> Submit to Municipal Assessor
                                      </DropdownMenuItem>
                                    )}
                                    {config.printApiPath && submission.status === 'approved' && canPrint && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => window.open(`${config.printApiPath}/${submission.id}`, '_blank')}>
                                          <FileText className="h-4 w-4 mr-2" /> Print
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExportSingle(submission)}>
                                          <Download className="h-4 w-4 mr-2" /> Export
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {canDelete(submission) && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteSubmission(submission.id)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    <div className="flex items-center justify-between px-2 py-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {total === 0
                          ? "0 row(s)"
                          : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, total)} of ${total} row(s)`}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>

      {config.printApiPath && (
        <Dialog open={bulkExportOpen} onOpenChange={v => { if (!bulkExportLoading) setBulkExportOpen(v); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Bulk Export Approved Forms</DialogTitle>
              <DialogDescription>
                Filter by approval date, then export as PDF (single) or ZIP (multiple).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex flex-wrap gap-2">
                {EXPORT_PRESETS.map(p => (
                  <Button
                    key={p.value}
                    variant={exportPreset === p.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExportPreset(p.value)}
                    disabled={bulkExportLoading}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {approvedInRange.length === 0
                  ? 'No approved forms in this range.'
                  : `${approvedInRange.length} approved form${approvedInRange.length !== 1 ? 's' : ''} found.`}
              </p>
              {bulkExportProgress && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Generating {bulkExportProgress.done} / {bulkExportProgress.total}…
                  </p>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(bulkExportProgress.done / bulkExportProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkExportOpen(false)} disabled={bulkExportLoading}>
                Cancel
              </Button>
              <Button onClick={handleBulkExport} disabled={bulkExportLoading || approvedInRange.length === 0}>
                {bulkExportLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Exporting…</>
                  : <><Download className="h-4 w-4 mr-2" /> Export{approvedInRange.length > 0 ? ` (${approvedInRange.length})` : ''}</>
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this submission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
