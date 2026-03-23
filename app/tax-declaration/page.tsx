"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, ScrollText, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Highlight helper ─────────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-black rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaxDecRecord {
  id: number;
  owner_name?: string;
  municipality?: string;
  location_municipality?: string;
  location_barangay?: string;
  updated_at: string;
  status: string;
  arp_no?: string;
  td_arp_no?: string;
}

type Tab = "land" | "building" | "machinery";

const PAGE_SIZE = 10;

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; api: string; viewRoute: (id: number) => string }[] = [
  {
    key: "land",
    label: "Land & Other Improvements",
    api: "/api/faas/land-improvements",
    viewRoute: (id) => `/land-other-improvements/tax-declaration?id=${id}`,
  },
  {
    key: "building",
    label: "Building & Structures",
    api: "/api/faas/building-structures",
    viewRoute: (id) => `/building-structures/tax-declaration?id=${id}`,
  },
  {
    key: "machinery",
    label: "Machinery",
    api: "/api/faas/machinery",
    viewRoute: (id) => `/machinery/tax-declaration?id=${id}`,
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function getMunicipality(r: TaxDecRecord) {
  return r.location_municipality || r.municipality || "";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaxDeclarationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("land");

  // Per-tab state
  const [data, setData] = useState<{ [K in Tab]: TaxDecRecord[] }>({
    land: [],
    building: [],
    machinery: [],
  });
  const [loading, setLoading] = useState<Record<Tab, boolean>>({
    land: true,
    building: true,
    machinery: true,
  });

  // Filters & pagination (reset per tab change)
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [selectedBarangays, setSelectedBarangays] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all tabs on mount
  useEffect(() => {
    TABS.forEach(({ key, api }) => {
      fetch(api)
        .then((r) => r.json())
        .then((res) => {
          const all: TaxDecRecord[] = res.data || res || [];
          setData((prev) => ({ ...prev, [key]: all.filter((r) => r.status === "approved") }));
        })
        .catch(() => setData((prev) => ({ ...prev, [key]: [] })))
        .finally(() => setLoading((prev) => ({ ...prev, [key]: false })));
    });
  }, []);

  // Reset filters on tab change
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedMunicipalities([]);
    setSelectedBarangays([]);
    setSearch("");
    setCurrentPage(1);
  };

  const records = data[activeTab];
  const isLoading = loading[activeTab];
  const viewRoute = TABS.find((t) => t.key === activeTab)!.viewRoute;

  const hasBargayFilter = activeTab !== "machinery";

  const uniqueMunicipalities = [...new Set(records.map(getMunicipality).filter(Boolean))].sort();
  const uniqueBarangays = hasBargayFilter
    ? [...new Set(records.map((r) => r.location_barangay || "").filter(Boolean))].sort()
    : [];

  const toggleMunicipality = (val: string) => {
    setSelectedMunicipalities((prev) =>
      prev.includes(val) ? prev.filter((m) => m !== val) : [...prev, val]
    );
    setCurrentPage(1);
  };

  const toggleBarangay = (val: string) => {
    setSelectedBarangays((prev) =>
      prev.includes(val) ? prev.filter((b) => b !== val) : [...prev, val]
    );
    setCurrentPage(1);
  };

  const q = search.toLowerCase();
  const filtered = records.filter((r) => {
    const muniMatch =
      selectedMunicipalities.length === 0 || selectedMunicipalities.includes(getMunicipality(r));
    const barangayMatch =
      selectedBarangays.length === 0 || selectedBarangays.includes(r.location_barangay || "");
    const searchMatch =
      q === "" ||
      String(r.owner_name ?? "").toLowerCase().includes(q) ||
      String(r.arp_no ?? "").toLowerCase().includes(q) ||
      String(r.td_arp_no ?? "").toLowerCase().includes(q) ||
      getMunicipality(r).toLowerCase().includes(q) ||
      String(r.location_barangay ?? "").toLowerCase().includes(q);
    return muniMatch && barangayMatch && searchMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                <BreadcrumbPage>Tax Declarations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">

            {/* Filters row */}
            <div className="flex items-center justify-end gap-2 mb-4 bg-white p-2 rounded-xl border shadow-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search owner, TD no., municipality…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="pl-8 w-64 h-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={selectedMunicipalities.length > 0 ? "default" : "outline"}
                    size="sm"
                  >
                    Municipality
                    {selectedMunicipalities.length > 0 && ` (${selectedMunicipalities.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  {uniqueMunicipalities.length === 0 ? (
                    <DropdownMenuItem disabled>No municipalities</DropdownMenuItem>
                  ) : (
                    uniqueMunicipalities.map((m) => (
                      <DropdownMenuCheckboxItem
                        key={m}
                        checked={selectedMunicipalities.includes(m)}
                        onCheckedChange={() => toggleMunicipality(m)}
                      >
                        {m}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {hasBargayFilter && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={selectedBarangays.length > 0 ? "default" : "outline"}
                      size="sm"
                    >
                      Barangay
                      {selectedBarangays.length > 0 && ` (${selectedBarangays.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-64 overflow-y-auto">
                    {uniqueBarangays.length === 0 ? (
                      <DropdownMenuItem disabled>No barangays</DropdownMenuItem>
                    ) : (
                      uniqueBarangays.map((b) => (
                        <DropdownMenuCheckboxItem
                          key={b}
                          checked={selectedBarangays.includes(b)}
                          onCheckedChange={() => toggleBarangay(b)}
                        >
                          {b}
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tax Declarations</CardTitle>
                <CardDescription>
                  Approved records ready for tax declaration. Click View Tax Dec to open or print.
                </CardDescription>

                {/* Tabs */}
                <div className="flex gap-1 border-b mt-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.key
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No approved records</h3>
                    <p className="text-muted-foreground">
                      Tax declarations are generated once a record is approved by LAOO.
                    </p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>TD No.</TableHead>
                          <TableHead>Owner Name</TableHead>
                          <TableHead>Municipality</TableHead>
                          {hasBargayFilter && <TableHead>Barangay</TableHead>}
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginated.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">#{record.id}</TableCell>
                            <TableCell className="font-mono">
                              <Highlight text={String(record.arp_no || record.td_arp_no || "—")} query={search} />
                            </TableCell>
                            <TableCell>
                              <Highlight text={record.owner_name || "N/A"} query={search} />
                            </TableCell>
                            <TableCell>
                              <Highlight text={getMunicipality(record) || "N/A"} query={search} />
                            </TableCell>
                            {hasBargayFilter && (
                              <TableCell>
                                <Highlight text={record.location_barangay || "N/A"} query={search} />
                              </TableCell>
                            )}
                            <TableCell>
                              {new Date(record.updated_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="success">Approved</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(viewRoute(record.id))}
                              >
                                <ScrollText className="h-4 w-4 mr-2" />
                                View Tax Dec
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-2 py-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {filtered.length === 0
                          ? "0 row(s)"
                          : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                              currentPage * PAGE_SIZE,
                              filtered.length
                            )} of ${filtered.length} row(s)`}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
    </SidebarProvider>
  );
}
