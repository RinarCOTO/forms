"use client"

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
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/faas/status-utils";
import { isFaasSubmittableStatus } from "@/lib/faas/workflow";
import {
  EXPORT_PRESETS,
  PAGE_SIZE,
  useFaasDashboard,
  type FaasDashboardConfig,
} from "./useFaasDashboard";

export type { FaasDashboardConfig } from "./useFaasDashboard";

export function FaasDashboard({ config }: { config: FaasDashboardConfig }) {
  const dashboard = useFaasDashboard(config);
  const {
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
  } = dashboard;

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
              <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
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
                ) : fetchError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {fetchError}
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
                          <TableHead>No.</TableHead>
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
                        {submissions.map((submission, index) => {
                          const muni = getMunicipality(submission);
                          return (
                            <TableRow key={submission.id}>
                              <TableCell className="font-medium">{(currentPage - 1) * PAGE_SIZE + index + 1}</TableCell>
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
                                      disabled={!isFaasSubmittableStatus(submission.status)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    {config.previewPath && isFaasSubmittableStatus(submission.status) && (
                                      <DropdownMenuItem onClick={() => handleSubmitForReview(submission.id)}>
                                        <Send className="h-4 w-4 mr-2" /> Submit to Municipal Assessor
                                      </DropdownMenuItem>
                                    )}
                                    {config.printApiPath && submission.status === 'approved' && canPrint && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => window.open(getPrintUrl(submission.id, true), '_blank')}>
                                          <FileText className="h-4 w-4 mr-2" /> Print With Attachments
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => window.open(getPrintUrl(submission.id, false), '_blank')}>
                                          <FileText className="h-4 w-4 mr-2" /> Print Form Only
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
