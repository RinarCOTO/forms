"use client"

import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const commercialData = [
  {
    location: "a) Commercial lots located along all weather roads.",
    year2006: "58.80",
    year2012: "105.00",
    subClassification: "C-1",
  },
];

export default function CategoryPage({
  params,
}: {
  params: Promise<{ municipality: string; category: string }>;
}) {
  const { municipality, category } = use(params);
  const router = useRouter();

  const displayMunicipality = municipality.charAt(0).toUpperCase() + municipality.slice(1);
  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);

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
                <BreadcrumbLink href="/smv/land-other-improvements/dashboard">
                  SMV - Land &amp; Other Improvements
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/smv/land-other-improvements/${municipality}`}>
                  {displayMunicipality}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{displayCategory}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/smv/land-other-improvements/${municipality}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to {displayMunicipality}
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{displayCategory}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location / Avenue / Street / Etc.</TableHead>
                      <TableHead>2006</TableHead>
                      <TableHead>2012</TableHead>
                      <TableHead>Sub Classification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commercialData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.location}</TableCell>
                        <TableCell>{row.year2006} pesos</TableCell>
                        <TableCell>{row.year2012}</TableCell>
                        <TableCell>{row.subClassification}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
