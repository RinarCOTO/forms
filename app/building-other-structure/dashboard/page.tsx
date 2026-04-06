"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Plus, ArrowLeft, Loader2, Eye, Edit, Trash2, MoreHorizontal, ChevronLeft, ChevronRight, Search, Send, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function BuildingOtherStructureDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [selectedBarangays, setSelectedBarangays] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<{ id: string; role: string } | null>(null);
  const [municipalAssessors, setMunicipalAssessors] = useState<{ full_name: string; municipality: string }[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkExportOpen, setBulkExportOpen] = useState(false);
  const [exportPreset, setExportPreset] = useState<'7d' | '28d' | '3m' | '6m' | 'all'>('28d');
  const [bulkExportLoading, setBulkExportLoading] = useState(false);
  const [bulkExportProgress, setBulkExportProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/users/permissions");
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/faas/building-structures");
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data);
        } else {
          setSubmissions([]);
        }
      } catch (error) {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchMunicipalAssessors = async () => {
      try {
        const response = await fetch('/api/users/by-role?role=municipal_tax_mapper');
        if (response.ok) {
          const data = await response.json();
          setMunicipalAssessors(data.users ?? []);
        }
      } catch (error) {
        console.error('Failed to fetch municipal assessors:', error);
      }
    };

    fetchUser();
    fetchSubmissions();
    fetchMunicipalAssessors();

    const supabase = createClient();
    const channel = supabase
      .channel('building-structures-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'building_structures' },
        (payload) => {
          const updated = payload.new as FormSubmission;
          setSubmissions(prev =>
            prev.map(s => s.id === updated.id ? { ...s, status: updated.status, updated_at: updated.updated_at } : s)
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'building_structures' },
        (payload) => {
          const inserted = payload.new as FormSubmission;
          setSubmissions(prev => [inserted, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleNewForm = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const response = await fetch("/api/faas/building-structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft", updated_at: now })
      });
      if (response.ok) {
        const data = await response.json();
        const newId = data?.data?.id || data?.id;
        if (newId) {
          router.push(`/building-other-structure/fill/step-1?id=${newId}`);
        } else {
          alert("Failed to get new record ID.");
        }
      } else {
        alert("Failed to create new submission.");
      }
    } catch (error) {
      alert("Error creating new submission.");
    }
  }, [router]);

  const handleViewSubmission = useCallback((submissionId: number) => {
    router.push(`/building-other-structure/fill/step-1?id=${submissionId}`);
  }, [router]);

  const handleDeleteSubmission = useCallback((submissionId: number) => {
    setSubmissionToDelete(submissionId);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (submissionToDelete === null) return;
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/faas/building-structures/${submissionToDelete}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSubmissions(prev => prev.filter(sub => sub.id !== submissionToDelete));
      } else {
        alert(result.message || 'Failed to delete submission.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting submission.');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setSubmissionToDelete(null);
    }
  }, [submissionToDelete]);

  const getMunicipalAssessor = (locationMunicipality?: string) => {
    if (!locationMunicipality) return '—';
    console.log('[MunicipalAssessor] looking for:', locationMunicipality, '| available:', municipalAssessors.map(a => `${a.municipality}=${a.full_name}`));
    const match = municipalAssessors.find(
      a => a.municipality?.toLowerCase() === locationMunicipality.toLowerCase()
    );
    return match?.full_name ?? '—';
  };

  const canDelete = (submission: FormSubmission) =>
    user && (
      user.role === 'admin' || user.role === 'super_admin' ||
      (submission.status === 'draft' && submission.created_by === user.id)
    );

  const SUBMITTABLE_STATUSES = ['draft', 'returned', 'returned_to_municipal'];
  // Statuses the tax mapper can still edit (not locked by the review workflow)
  const EDITABLE_STATUSES = ['draft', 'returned', 'returned_to_municipal'];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':              return 'success' as const;
      case 'submitted':             return 'warning' as const;
      case 'municipal_signed':      return 'warning' as const;
      case 'laoo_approved':         return 'warning' as const;
      case 'under_review':          return 'default' as const;
      case 'returned':              return 'destructive' as const;
      case 'returned_to_municipal': return 'destructive' as const;
      case 'draft':                 return 'secondary' as const;
      default:                      return 'default' as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'under_review':          return 'Under Review';
      case 'returned':              return 'Returned';
      case 'returned_to_municipal': return 'Returned to Municipal';
      case 'submitted':             return 'Submitted';
      case 'municipal_signed':      return 'Municipal Signed';
      case 'laoo_approved':         return 'LAOO Approved';
      case 'approved':              return 'Approved';
      case 'draft':                 return 'Draft';
      default:                      return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const uniqueMunicipalities = [...new Set(submissions.map(s => s.location_municipality).filter(Boolean))].sort() as string[];
  const uniqueBarangays = [...new Set(submissions.map(s => s.location_barangay).filter(Boolean))].sort() as string[];

  const toggleMunicipality = (muni: string) => {
    setSelectedMunicipalities(prev =>
      prev.includes(muni) ? prev.filter(m => m !== muni) : [...prev, muni]
    );
    setCurrentPage(1);
  };

  const toggleBarangay = (barangay: string) => {
    setSelectedBarangays(prev =>
      prev.includes(barangay) ? prev.filter(b => b !== barangay) : [...prev, barangay]
    );
    setCurrentPage(1);
  };

  const q = search.toLowerCase();
  const filteredSubmissions = submissions.filter(s => {
    const muniMatch = selectedMunicipalities.length === 0 || selectedMunicipalities.includes(s.location_municipality || '');
    const barangayMatch = selectedBarangays.length === 0 || selectedBarangays.includes(s.location_barangay || '');
    const searchMatch = q === '' ||
      String(s.owner_name ?? '').toLowerCase().includes(q) ||
      String(s.location_municipality ?? '').toLowerCase().includes(q) ||
      String(s.location_barangay ?? '').toLowerCase().includes(q);
    return muniMatch && barangayMatch && searchMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / PAGE_SIZE));
  const paginatedSubmissions = filteredSubmissions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const EXPORT_PRESETS: { label: string; value: typeof exportPreset }[] = [
    { label: 'Last 7 days',   value: '7d'  },
    { label: 'Last 28 days',  value: '28d' },
    { label: 'Last 3 months', value: '3m'  },
    { label: 'Last 6 months', value: '6m'  },
    { label: 'All approved',  value: 'all' },
  ];

  const getExportCutoff = (preset: typeof exportPreset): Date | null => {
    const now = new Date();
    switch (preset) {
      case '7d':  return new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
      case '28d': return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      case '3m':  return new Date(new Date().setMonth(now.getMonth() - 3));
      case '6m':  return new Date(new Date().setMonth(now.getMonth() - 6));
      case 'all': return null;
    }
  };

  const approvedInRange = submissions.filter(s => {
    if (s.status !== 'approved') return false;
    const cutoff = getExportCutoff(exportPreset);
    if (!cutoff) return true;
    if (!s.approved_at) return false;
    return new Date(s.approved_at) >= cutoff;
  });

  const handleBulkExport = async () => {
    if (approvedInRange.length === 0) return;
    setBulkExportLoading(true);
    setBulkExportProgress({ done: 0, total: approvedInRange.length });
    try {
      if (approvedInRange.length === 1) {
        const sub = approvedInRange[0];
        const res = await fetch(`/api/print/building-structures/${sub.id}`);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `RPFAAS-Building_${sub.owner_name ?? 'Unknown'}_${sub.id}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setBulkExportProgress({ done: 1, total: 1 });
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (let i = 0; i < approvedInRange.length; i++) {
          const sub = approvedInRange[i];
          const res = await fetch(`/api/print/building-structures/${sub.id}`);
          if (res.ok) {
            const blob = await res.blob();
            zip.file(`RPFAAS-Building_${sub.owner_name ?? 'Unknown'}_${sub.id}.pdf`, blob);
          }
          setBulkExportProgress({ done: i + 1, total: approvedInRange.length });
        }
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RPFAAS-Building-Approved-${new Date().toISOString().slice(0, 10)}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setBulkExportLoading(false);
      setBulkExportProgress(null);
      setBulkExportOpen(false);
    }
  };

  const handleSubmitForReview = useCallback((submissionId: number) => {
    router.push(`/building-other-structure/fill/preview-form?id=${submissionId}`);
  }, [router]);

  const handlePrintPreview = useCallback((submissionId: number, status?: string) => {
    if (status && SUBMITTABLE_STATUSES.includes(status)) {
      router.push(`/building-other-structure/fill/preview-form?id=${submissionId}`);
    } else {
      router.push(`/building-other-structure/print-preview?id=${submissionId}`);
    }
  }, [router]);

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
              <BreadcrumbItem>
                <BreadcrumbLink href="/building-other-structure/dashboard">Building & Structures</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Submissions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Building Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setBulkExportOpen(true)}>
                  <Download className="h-4 w-4 mr-2" /> Bulk Export
                </Button>
                <Button onClick={handleNewForm}><Plus className="h-4 w-4 mr-2" /> New Submission</Button>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border shadow-sm mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search owner, municipality…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
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
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Building & Structures</CardTitle>
                <CardDescription>View and manage all submissions for this form type</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                    <p className="text-muted-foreground mb-4">Get started by creating a new submission</p>
                    <Button onClick={handleNewForm}> <Plus className="h-4 w-4 mr-2" /> Create First Submission </Button>
                  </div>
                ) : (
                  <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Owner Name</TableHead>
                        <TableHead>Municipality</TableHead>
                        <TableHead>Municipal Assessor</TableHead>
                        <TableHead>Barangay</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">#{submission.id}</TableCell>
                          <TableCell>{submission.owner_name || submission.title || 'N/A'}</TableCell>
                          <TableCell>{submission.location_municipality || 'N/A'}</TableCell>
                          <TableCell>{getMunicipalAssessor(submission.location_municipality)}</TableCell>
                          <TableCell>{submission.location_barangay || 'N/A'}</TableCell>
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
                                <DropdownMenuItem onClick={() => handlePrintPreview(submission.id, submission.status)}>
                                  <Eye className="h-4 w-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleViewSubmission(submission.id)}
                                  disabled={!EDITABLE_STATUSES.includes(submission.status)}
                                >
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                {SUBMITTABLE_STATUSES.includes(submission.status) && (
                                  <DropdownMenuItem onClick={() => handleSubmitForReview(submission.id)}>
                                    <Send className="h-4 w-4 mr-2" /> Submit for Review
                                  </DropdownMenuItem>
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
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between px-2 py-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {filteredSubmissions.length === 0
                        ? "0 row(s)"
                        : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredSubmissions.length)} of ${filteredSubmissions.length} row(s)`}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
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

interface FormSubmission {
  id: number;
  owner_name?: string;
  municipality?: string;
  location_municipality?: string;
  location_barangay?: string;
  title?: string;
  updated_at: string;
  approved_at?: string | null;
  status: string;
  created_by?: string;
}
