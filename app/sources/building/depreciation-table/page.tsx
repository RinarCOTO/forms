"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  BUILDING_DEPRECIATION_TYPES,
  STRUCTURAL_TYPE_DEPRECIATION_EQUIVALENTS,
  STRUCTURAL_TYPE_KEYS,
} from "@/config/depreciation-table"

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
                    const { rates, residual } = BUILDING_DEPRECIATION_TYPES[key]
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

          <Card>
            <CardHeader>
              <CardTitle>Form Type Equivalents</CardTitle>
              <CardDescription>
                Structural types from the form are resolved to these depreciation schedule rows before calculating.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Form Structural Type</TableHead>
                    <TableHead className="pr-6">Depreciation Schedule Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STRUCTURAL_TYPE_DEPRECIATION_EQUIVALENTS.map((row) => (
                    <TableRow key={row.structuralType}>
                      <TableCell className="pl-6 font-medium">{row.structuralType}</TableCell>
                      <TableCell className="pr-6">
                        {row.depreciationType ? (
                          row.depreciationType
                        ) : (
                          <span className="text-amber-600 font-medium">No schedule configured</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
