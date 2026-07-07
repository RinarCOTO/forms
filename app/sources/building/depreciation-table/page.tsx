"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BUILDING_DEPRECIATION_SCHEDULE,
  STRUCTURAL_TYPE_DEPRECIATION_EQUIVALENTS,
  STRUCTURAL_TYPE_KEYS,
} from "@/config/depreciation-table"

const MAX_YEARS = Math.max(...Object.values(BUILDING_DEPRECIATION_SCHEDULE).map((row) => row.length))

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
              Cumulative depreciation percentage by number of years and structural type.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Physical Depreciation Schedule</CardTitle>
              <CardDescription>
                The listed percentage is the total depreciation to apply for that building age. Blank years use the last listed percentage for that type.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">No. of Years</TableHead>
                    {STRUCTURAL_TYPE_KEYS.map((key) => (
                      <TableHead key={key} className="text-center">{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: MAX_YEARS }, (_, index) => index + 1).map((year) => (
                    <TableRow key={year}>
                      <TableCell className="pl-6 font-medium tabular-nums">{year}</TableCell>
                      {STRUCTURAL_TYPE_KEYS.map((key) => {
                        const value = BUILDING_DEPRECIATION_SCHEDULE[key][year - 1]
                        return (
                          <TableCell key={key} className="text-center tabular-nums">
                            {value == null ? "—" : `${value.toFixed(2)}%`}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
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
