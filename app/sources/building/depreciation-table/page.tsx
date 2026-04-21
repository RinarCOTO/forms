"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { STRUCTURAL_TYPE_KEYS } from "@/config/depreciation-table"

const TYPES: Record<string, { rates: [number, number, number, number, number]; residual: number }> = {
  "Type I":       { rates: [5.2, 4.6, 4.0, 3.4, 3.2], residual: 10 },
  "Type II-A":    { rates: [5.0, 4.2, 3.6, 3.2, 3.2], residual: 12 },
  "Type II-B":    { rates: [5.0, 4.0, 3.4, 3.0, 3.0], residual: 15 },
  "Type III-AB":  { rates: [4.0, 3.6, 3.2, 3.0, 2.5], residual: 20 },
  "Type III-CD":  { rates: [4.0, 3.5, 3.0, 2.5, 2.0], residual: 28 },
  "Type III-E":   { rates: [3.0, 2.5, 2.5, 2.0, 2.0], residual: 30 },
  "Type IV-A":    { rates: [2.6, 2.3, 2.2, 2.0, 1.6], residual: 33 },
  "Type IV-B":    { rates: [2.4, 2.2, 2.0, 1.7, 1.4], residual: 35 },
  "Type V-A":     { rates: [2.2, 2.0, 1.7, 1.3, 1.1], residual: 37 },
  "Type V-B":     { rates: [2.0, 1.8, 1.5, 1.2, 1.0], residual: 40 },
  "Type V-C":     { rates: [1.8, 1.4, 1.2, 1.0, 1.0], residual: 40 },
}

const BANDS = ["Yrs 1–5", "Yrs 6–10", "Yrs 11–15", "Yrs 16–20", "Yrs 21+"]

export default function DepreciationTablePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/sources/building">Building</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Depreciation Table</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Building Depreciation Schedule</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Annual depreciation rates per structural type, applied by 5-year band. Stops at the residual floor.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Physical Depreciation Rates</CardTitle>
              <CardDescription>
                Rate (%) applied annually for each age band. Max depreciation = 100% − Residual.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Structural Type</TableHead>
                    {BANDS.map((b) => (
                      <TableHead key={b} className="text-center">{b}</TableHead>
                    ))}
                    <TableHead className="text-center pr-6">Residual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STRUCTURAL_TYPE_KEYS.map((key) => {
                    const { rates, residual } = TYPES[key]
                    return (
                      <TableRow key={key}>
                        <TableCell className="pl-6 font-medium">{key}</TableCell>
                        {rates.map((r, i) => (
                          <TableCell key={i} className="text-center tabular-nums">{r.toFixed(1)}%</TableCell>
                        ))}
                        <TableCell className="text-center pr-6">
                          <Badge variant="secondary">{residual}%</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Source: Schedule of Depreciation per building type manual.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
