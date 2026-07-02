"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  Home,
  LandPlot,
  ListChecks,
  NotebookText,
  Settings,
  Tractor,
  UserCheck,
  Users,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface UserContextResponse {
  id?: string;
  role?: string;
  full_name?: string;
  municipality?: string;
  permissions?: Record<string, boolean>;
}

type CountsResponse = Record<string, number>;

interface CountCardConfig {
  key: keyof CountsResponse;
  label: string;
  href: string;
  icon: typeof Building2;
  permission?: string;
}

interface QuickLinkConfig {
  label: string;
  href: string;
  icon: typeof Home;
  permission?: string;
  roles?: string[];
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  municipal_tax_mapper: "Municipal Tax Mapper",
  municipal_assessor: "Municipal Assessor",
  laoo: "LAOO",
  assistant_provincial_assessor: "Assistant Provincial Assessor",
  provincial_assessor: "Provincial Assessor",
  accountant: "Accountant",
  user: "User",
};

const countCards: CountCardConfig[] = [
  {
    key: "building-structure",
    label: "Building & Structures",
    href: "/building-other-structure/dashboard",
    icon: Building2,
    permission: "building_structures.view",
  },
  {
    key: "land-improvements",
    label: "Land & Improvements",
    href: "/land-other-improvements/dashboard",
    icon: LandPlot,
    permission: "land_improvements.view",
  },
  {
    key: "machinery",
    label: "Machinery",
    href: "/machinery/dashboard",
    icon: Tractor,
    permission: "machinery.view",
  },
  {
    key: "notes",
    label: "Notes",
    href: "/notes",
    icon: NotebookText,
  },
];

const quickLinks: QuickLinkConfig[] = [
  {
    label: "Review Queue",
    href: "/review-queue",
    icon: ListChecks,
    permission: "review.laoo",
  },
  {
    label: "Tax Declaration",
    href: "/tax-declaration",
    icon: FileText,
    roles: ["laoo", "admin", "super_admin", "assistant_provincial_assessor", "provincial_assessor"],
  },
  {
    label: "Assign LAOO",
    href: "/admin/assign-laoo",
    icon: UserCheck,
    roles: ["super_admin", "admin", "provincial_assessor", "assistant_provincial_assessor"],
  },
  {
    label: "Manage Users",
    href: "/manage-users",
    icon: Users,
    permission: "user_management.view",
  },
  {
    label: "SMV Building",
    href: "/smv/building-other-structures/dashboard",
    icon: Settings,
    permission: "building_structures.view",
  },
  {
    label: "SMV Land",
    href: "/smv/land-other-improvements/dashboard",
    icon: Settings,
    permission: "land_improvements.view",
  },
];

function canAccess(
  item: { permission?: string; roles?: string[] },
  user: UserContextResponse | null,
) {
  if (!item.permission && !item.roles) return true;
  if (item.permission && user?.permissions?.[item.permission]) return true;
  if (item.roles && user?.role && item.roles.includes(user.role)) return true;
  return false;
}

function formatRole(role?: string) {
  if (!role) return "User";
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserContextResponse | null>(null);
  const [counts, setCounts] = useState<CountsResponse>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [userResponse, countsResponse] = await Promise.all([
          fetch("/api/users/permissions"),
          fetch("/api/faas/counts"),
        ]);

        const [userData, countsData] = await Promise.all([
          userResponse.ok ? userResponse.json() : null,
          countsResponse.ok ? countsResponse.json() : {},
        ]);

        if (!isMounted) return;
        setUser(userData);
        setCounts(countsData ?? {});
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleCountCards = useMemo(
    () => countCards.filter((item) => canAccess(item, user)),
    [user],
  );

  const visibleQuickLinks = useMemo(
    () => quickLinks.filter((item) => canAccess(item, user)),
    [user],
  );

  const totalVisibleRecords = visibleCountCards.reduce(
    (sum, item) => sum + Number(counts[item.key] ?? 0),
    0,
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Home</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
            <section className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  <h1 className="text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
                    Home
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {user?.full_name || "Signed-in user"}
                  </span>
                  <Badge variant="outline">{formatRole(user?.role)}</Badge>
                  {user?.municipality && (
                    <Badge variant="secondary">{user.municipality}</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Visible records</p>
                  <p className="text-lg font-semibold leading-5">{totalVisibleRecords}</p>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {visibleCountCards.map((item) => {
                const Icon = item.icon;
                const value = Number(counts[item.key] ?? 0);

                return (
                  <Link key={item.key} href={item.href} className="block">
                    <Card className="h-full rounded-md transition-colors hover:bg-muted/50">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {item.label}
                        </CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-semibold">{isLoading ? "-" : value}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-base font-semibold">Work Areas</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleCountCards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link key={item.href} href={item.href} className="block">
                        <Card className="h-full rounded-md transition-colors hover:bg-muted/50">
                          <CardContent className="flex items-center gap-3 p-4">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {Number(counts[item.key] ?? 0)} records
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-base font-semibold">Shortcuts</h2>
                </div>
                <div className="grid gap-2">
                  {visibleQuickLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Button
                        key={item.href}
                        asChild
                        variant="outline"
                        className="h-10 justify-start rounded-md"
                      >
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
