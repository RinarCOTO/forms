"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Plus, ArrowLeft, Loader2, Eye, Edit, Trash2, MoreHorizontal, ChevronLeft, ChevronRight, Search, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function LandOtherImprovementsDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [selectedBarangays, setSelectedBarangays] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<{ id: string; role: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

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
      } finally {
        setUserLoading(false);
      }
    };

    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/faas/land-improvements");
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data.data || data || []);
        } else {
          setSubmissions([]);
        }
      } catch (error) {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    fetchSubmissions();

    const VISIBLE_STATUSES = ['submitted', 'municipal_signed', 'laoo_approved', 'returned', 'returned_to_municipal', 'approved'];

    const supabase = createClient();
    const channel = supabase
      .channel('building-structures-updates')
      .on('broadcast', { event: 'status_change' }, ({ payload }) => {
        if (payload?.form_type !== 'land') return;
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
  }, []);

  const handleNewForm = async () => {
    try {
      const now = new Date().toISOString();
      const response = await fetch("/api/faas/land-improvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft", updated_at: now })
      });
      if (response.ok) {
        const data = await response.json();
        const newId = data?.data?.id || data?.id;
        if (newId) {
          router.push(`/land-other-improvements/fill/step-1?id=${newId}`);
        } else {
          alert("Failed to get new record ID.");
        }
      } else {
        alert("Failed to create new submission.");
      }
    } catch (error) {
      alert("Error creating new submission.");
    }
  };

  const handleViewSubmission = (submissionId: number) => {
    router.push(`/land-other-improvements/fill/step-1?id=${submissionId}`);
  };

  const handleDeleteSubmission = async (submissionId: number) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/faas/land-improvements/${submissionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
        alert('Submission deleted successfully.');
      } else {
        alert(result.message || 'Failed to delete submission.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting submission.');
    }
  };

  const canDelete = (submission: FormSubmission) =>
    user && (
      user.role === 'admin' || user.role === 'super_admin' ||
      (submission.status === 'draft' && submission.created_by === user.id)
    );
  const SUBMITTABLE_STATUSES = ['draft', 'returned', 'returned_to_municipal'];
  const EDITABLE_STATUSES = ['draft', 'returned', 'returned_to_municipal'];

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

  const handleSubmitForReview = (submissionId: number) => {
    router.push(`/land-other-improvements/fill/preview-form?id=${submissionId}`);
  };

  const handlePrintPreview = (submissionId: number, status?: string) => {
    if (status && SUBMITTABLE_STATUSES.includes(status)) {
      router.push(`/land-other-improvements/fill/preview-form?id=${submissionId}`);
    } else {
      router.push(`/land-other-improvements/print-preview?id=${submissionId}`);
    }
  };

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
                <BreadcrumbLink href="/land-other-improvements/dashboard">Land & Other Improvements</BreadcrumbLink>
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
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Land Dashboard
              </Button>
              <Button onClick={handleNewForm}><Plus className="h-4 w-4 mr-2" /> New Submission</Button>
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
                <CardTitle>Land & Other Improvements</CardTitle>
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
                          <TableCell>{submission.location_barangay || 'N/A'}</TableCell>
                          <TableCell>{new Date(submission.updated_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              submission.status === 'approved' ? 'success' :
                              submission.status === 'submitted' || submission.status === 'municipal_signed' || submission.status === 'laoo_approved' ? 'warning' :
                              submission.status === 'draft' ? 'secondary' :
                              submission.status === 'returned' || submission.status === 'returned_to_municipal' ? 'destructive' :
                              'default'
                            }>
                              {submission.status === 'returned_to_municipal' ? 'Returned to Municipal' :
                               submission.status === 'municipal_signed' ? 'Municipal Signed' :
                               submission.status === 'laoo_approved' ? 'LAOO Approved' :
                               submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
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
                                    <Send className="h-4 w-4 mr-2" /> Submit to Municipal Assessor
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
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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
    </SidebarProvider>
  );
}

interface FormSubmission {
  id: number;
  owner_name?: string;
  title?: string;
  location_municipality?: string;
  location_barangay?: string;
  updated_at: string;
  status: string;
  created_by?: string;
}
