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
import { municipalityData, MunicipalityData, AgriculturalLandRow, agriculturalImprovementRow } from "../data";

export default function MunicipalityPage({ params }: { params: Promise<{ municipality: string }> }) {
  const { municipality } = use(params);
  const router = useRouter();

  const displayName = municipality.charAt(0).toUpperCase() + municipality.slice(1);
  const data = municipalityData[municipality.toLowerCase()] ?? { commercial: [], residential: [], agricultural: [] };

  const sections: { label: string; key: keyof MunicipalityData }[] = [
    { label: "Commercial", key: "commercial" },
    { label: "Residential", key: "residential" },
  ];

  const agriculturalLandRows: AgriculturalLandRow[] = data.agricultural;
  const agriculturalImprovementRows: agriculturalImprovementRow[] = data.agriculturalImprovementRow ?? [];

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
                <BreadcrumbPage>{displayName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Button variant="ghost" size="sm" onClick={() => router.push("/smv/land-other-improvements/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Municipalities
              </Button>
            </div>
            <h2 className="text-xl font-semibold mb-1">{displayName}</h2>
            <p className="text-sm text-muted-foreground mb-6">SMV - Land &amp; Other Improvements</p>
            <div className="flex flex-col gap-4">
              {sections.map(({ label, key }) => (
                <Card key={label}>
                  <CardHeader>
                    <CardTitle className="text-base">{label}</CardTitle>
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
                        {data[key].length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-6">
                              No data yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          data[key].map((row, index) => (
                            <TableRow key={index} className="even:bg-accent/50">
                              <TableCell>{row.location}</TableCell>
                              <TableCell>{row.year2006}</TableCell>
                              <TableCell>{row.year2012}</TableCell>
                              <TableCell>{row.subClassification}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Agricultural</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold mb-1">Land</p>
                  <p className="text-sm text-muted-foreground mb-3">Class and Base Unit Market Value (Per Hectare)</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead>1st</TableHead>
                        <TableHead>2nd</TableHead>
                        <TableHead>3rd</TableHead>
                        <TableHead>4th</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agriculturalLandRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-6">
                            No data yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        agriculturalLandRows.map((row, index) => (
                          <TableRow key={index} className="even:bg-accent/50">
                            <TableCell>{row.landType}</TableCell>
                            <TableCell>{row.first}</TableCell>
                            <TableCell>{row.second}</TableCell>
                            <TableCell>{row.third}</TableCell>
                            <TableCell>{row.fourth}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <p className="font-semibold mt-6 mb-1">Improvements</p>
                  <p className="text-sm text-muted-foreground mb-3">Class and Base Unit Market Value (Per Hectare)</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead>1st</TableHead>
                        <TableHead>2nd</TableHead>
                        <TableHead>3rd</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agriculturalImprovementRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-6">
                            No data yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        agriculturalImprovementRows.map((row, index) => (
                          <TableRow key={index} className="even:bg-accent/50">
                            <TableCell>{row.type}</TableCell>
                            <TableCell>{row.first}</TableCell>
                            <TableCell>{row.second}</TableCell>
                            <TableCell>{row.third}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
