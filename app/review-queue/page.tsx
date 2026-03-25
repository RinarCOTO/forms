"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Eye, XCircle, ClipboardList, ChevronLeft, ChevronRight, RefreshCw, MoreHorizontal, PenLine } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/app/contexts/permissions-context";

type FormType = "building" | "land";
type ReviewAction = 'sign_forward' | 'return_to_mapper' | 'laoo_approve' | 'laoo_return' | 'sign_approve' | 'provincial_return';

interface ReviewItem {
  id: number;
  owner_name?: string | null;
  status: string;
  location_municipality?: string | null;
  location_barangay?: string | null;
  updated_at: string;
  submitted_at?: string | null;
  form_type: FormType;
  form_label: string;
}

// Role group helpers
const MUNICIPAL_ROLES  = ['municipal_tax_mapper', 'admin', 'super_admin'];
const LAOO_ROLES       = ['laoo', 'admin', 'super_admin'];
const PROVINCIAL_ROLES = ['assistant_provincial_assessor', 'provincial_assessor', 'admin', 'super_admin'];

function getDefaultStatuses(role: string | null): string[] {
  if (!role) return [];
  if (MUNICIPAL_ROLES.includes(role))  return ['submitted', 'returned_to_municipal'];
  if (LAOO_ROLES.includes(role))       return ['municipal_signed'];
  if (PROVINCIAL_ROLES.includes(role)) return ['laoo_approved'];
  return ['submitted', 'municipal_signed', 'laoo_approved', 'returned_to_municipal'];
}

const ALL_STATUSES = ['submitted', 'municipal_signed', 'laoo_approved', 'approved', 'returned', 'returned_to_municipal'];

const STATUS_LABELS: Record<string, string> = {
  submitted:           'Submitted',
  municipal_signed:    'Municipal Signed',
  laoo_approved:       'LAOO Approved',
  approved:            'Approved',
  returned:            'Returned to Mapper',
  returned_to_municipal: 'Returned to Municipal',
};

function getStatusVariant(status: string) {
  switch (status) {
    case 'approved':             return 'success' as const;
    case 'submitted':            return 'warning' as const;
    case 'municipal_signed':     return 'default' as const;
    case 'laoo_approved':        return 'default' as const;
    case 'returned':             return 'destructive' as const;
    case 'returned_to_municipal':return 'destructive' as const;
    default:                     return 'secondary' as const;
  }
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PAGE_SIZE = 12;

export default function ReviewQueuePage() {
  const router = useRouter();
  const { role } = usePermissions();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [formTypeFilter, setFormTypeFilter] = useState<string>("all");
  const [municipalityFilter, setMunicipalityFilter] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<ReviewAction | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (formTypeFilter !== 'all') params.set('form_type', formTypeFilter);
      if (statusFilter === 'active') {
        const defaults = getDefaultStatuses(role);
        defaults.forEach(s => params.append('status', s));
      } else if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const res = await fetch(`/api/review?${params.toString()}`);
      if (!res.ok) { toast.error('Failed to load review queue'); setItems([]); return; }
      const json = await res.json();
      setItems(json.data ?? []);
      setCurrentPage(1);
    } catch {
      toast.error('Error loading review queue');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [formTypeFilter, statusFilter, role]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const uniqueMunicipalities = [...new Set(items.map(i => i.location_municipality).filter(Boolean) as string[])].sort();

  const filteredItems = items.filter(item => {
    if (municipalityFilter !== 'all' && item.location_municipality !== municipalityFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginated = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const needsNote = (a: ReviewAction) => ['return_to_mapper', 'laoo_return', 'provincial_return'].includes(a);

  const openDialog = (action: ReviewAction, item: ReviewItem) => {
    setDialogAction(action);
    setSelectedItem(item);
    setActionNote('');
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedItem || !dialogAction) return;
    if (needsNote(dialogAction) && !actionNote.trim()) { toast.error('A note is required'); return; }
    setActionLoading(true);
    try {
      const apiBase = selectedItem.form_type === 'building'
        ? `/api/faas/building-structures/${selectedItem.id}/review`
        : `/api/faas/land-improvements/${selectedItem.id}/review`;

      if (needsNote(dialogAction) && actionNote.trim()) {
        const commentsBase = selectedItem.form_type === 'building'
          ? `/api/faas/building-structures/${selectedItem.id}/comments`
          : `/api/faas/land-improvements/${selectedItem.id}/comments`;
        await fetch(commentsBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment_text: actionNote.trim() }),
        });
      }

      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: dialogAction, note: actionNote || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Action failed');
        return;
      }
      toast.success('Action completed successfully');
      setDialogOpen(false);
      setSelectedItem(null);
      setActionNote('');
      await fetchItems();
    } catch {
      toast.error('Error performing action');
    } finally {
      setActionLoading(false);
    }
  };

  const actionLabel: Record<ReviewAction, string> = {
    sign_forward:      'Sign & Forward to LAOO',
    return_to_mapper:  'Return to Tax Mapper',
    laoo_approve:      'Approve & Forward to Provincial',
    laoo_return:       'Return to Municipal',
    sign_approve:      'Sign & Approve',
    provincial_return: 'Return to Municipal',
  };

  // Available actions per role per status
  function getActions(item: ReviewItem): { action: ReviewAction; label: string; danger?: boolean }[] {
    if (!role) return [];
    const s = item.status;
    const actions: { action: ReviewAction; label: string; danger?: boolean }[] = [];
    if (MUNICIPAL_ROLES.includes(role)) {
      if (['submitted', 'returned_to_municipal'].includes(s)) {
        actions.push({ action: 'sign_forward', label: 'Sign & Forward' });
        actions.push({ action: 'return_to_mapper', label: 'Return to Mapper', danger: true });
      }
    }
    if (LAOO_ROLES.includes(role)) {
      if (s === 'municipal_signed') {
        actions.push({ action: 'laoo_approve', label: 'Approve & Forward' });
        actions.push({ action: 'laoo_return', label: 'Return to Municipal', danger: true });
      }
    }
    if (PROVINCIAL_ROLES.includes(role)) {
      if (s === 'laoo_approved') {
        actions.push({ action: 'sign_approve', label: 'Sign & Approve' });
        actions.push({ action: 'provincial_return', label: 'Return to Municipal', danger: true });
      }
    }
    return actions;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Review Queue</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active</CardDescription>
                <CardTitle className="text-3xl">{items.filter(i => ['submitted','municipal_signed','laoo_approved','returned_to_municipal'].includes(i.status)).length}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">Forms needing action</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Loaded</CardDescription>
                <CardTitle className="text-3xl">{filteredItems.length}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">After current filters</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Municipalities</CardDescription>
                <CardTitle className="text-3xl">{uniqueMunicipalities.length}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">Represented in this view</p></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" />Review Queue</CardTitle>
                  <CardDescription>Review, sign, and forward RPFAAS forms through the approval workflow.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">My Active Queue</SelectItem>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {ALL_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Form Type</Label>
                  <Select value={formTypeFilter} onValueChange={v => { setFormTypeFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="building">Building & Structure</SelectItem>
                      <SelectItem value="land">Land Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Municipality</Label>
                  <Select value={municipalityFilter} onValueChange={v => { setMunicipalityFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Municipalities</SelectItem>
                      {uniqueMunicipalities.map(m => (
                        <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading…</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <ClipboardList className="h-12 w-12 opacity-30" />
                  <p className="text-sm">No forms match the current filters.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Owner</TableHead>
                        <TableHead>Form Type</TableHead>
                        <TableHead>Municipality</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map(item => {
                        const rowActions = getActions(item);
                        return (
                          <TableRow key={`${item.form_type}-${item.id}`}>
                            <TableCell className="font-medium">
                              {item.owner_name || <span className="text-muted-foreground italic">No owner</span>}
                            </TableCell>
                            <TableCell><Badge variant="outline">{item.form_label}</Badge></TableCell>
                            <TableCell>
                              {item.location_municipality
                                ? item.location_municipality.charAt(0).toUpperCase() + item.location_municipality.slice(1)
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(item.status)}>
                                {STATUS_LABELS[item.status] ?? item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(item.submitted_at)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => router.push(`/review-queue/${item.id}?type=${item.form_type}`)}>
                                    <Eye className="mr-2 h-4 w-4" />View Form
                                  </DropdownMenuItem>
                                  {rowActions.length > 0 && <DropdownMenuSeparator />}
                                  {rowActions.map(({ action, label, danger }) => (
                                    <DropdownMenuItem
                                      key={action}
                                      onClick={() => openDialog(action, item)}
                                      className={danger ? 'text-red-600 focus:text-red-600' : 'text-green-600 focus:text-green-600'}
                                    >
                                      {danger
                                        ? <XCircle className="mr-2 h-4 w-4" />
                                        : <PenLine className="mr-2 h-4 w-4" />}
                                      {label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} · {filteredItems.length} records</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                          <ChevronLeft className="h-4 w-4" />Prev
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                          Next<ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{dialogAction ? actionLabel[dialogAction] : ''}</DialogTitle>
              <DialogDescription>
                {dialogAction && needsNote(dialogAction)
                  ? 'Please provide a reason for returning this form.'
                  : 'This action will advance the form to the next stage.'}
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4 py-2">
                <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                  <p><span className="font-medium">Owner: </span>{selectedItem.owner_name || '—'}</p>
                  <p><span className="font-medium">Type: </span>{selectedItem.form_label}</p>
                  <p><span className="font-medium">Status: </span>
                    <Badge variant={getStatusVariant(selectedItem.status)} className="ml-1">
                      {STATUS_LABELS[selectedItem.status] ?? selectedItem.status}
                    </Badge>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action-note">
                    {dialogAction && needsNote(dialogAction) ? 'Reason (required)' : 'Note (optional)'}
                  </Label>
                  <Textarea
                    id="action-note"
                    placeholder={dialogAction && needsNote(dialogAction) ? 'Explain what needs to be corrected…' : 'Add an optional note…'}
                    value={actionNote}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionNote(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
              <Button
                variant={dialogAction && needsNote(dialogAction) ? 'destructive' : 'default'}
                onClick={handleAction}
                disabled={actionLoading || (!!dialogAction && needsNote(dialogAction) && !actionNote.trim())}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
