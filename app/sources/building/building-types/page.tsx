"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BUILDING_TYPES, STRUCTURAL_TYPES } from "@/config/form-options"
import { getUnitConstructionCost } from "@/config/unit-construction-cost"

const RESIDENTIAL_TYPE = BUILDING_TYPES.find((t) => t.id === "building_type_1")!
const COMMERCIAL_TYPES = BUILDING_TYPES.filter((t) => t.id !== "building_type_1")

const ASSESSMENT_LEVELS = [
  { range: "≤ ₱175,000",                    level: "0%" },
  { range: "₱175,001 – ₱300,000",           level: "10%" },
  { range: "₱300,001 – ₱500,000",           level: "20%" },
  { range: "₱500,001 – ₱750,000",           level: "25%" },
  { range: "₱750,001 – ₱1,000,000",         level: "30%" },
  { range: "₱1,000,001 – ₱2,000,000",       level: "35%" },
  { range: "₱2,000,001 – ₱5,000,000",       level: "40%" },
  { range: "₱5,000,001 – ₱10,000,000",      level: "50%" },
  { range: "> ₱10,000,000",                 level: "60%" },
]

export default function BuildingTypesPage() {
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
                <BreadcrumbPage>Building Types</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Building Types</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Categories, subcategories, actual use classification, assessment levels, and unit construction costs.
            </p>
          </div>

          {/* Categories & Subcategories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories &amp; Subcategories</CardTitle>
              <CardDescription>
                A building is either Residential or Commercial. Actual use is derived from the category.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Category</TableHead>
                    <TableHead>Type / Subcategory</TableHead>
                    <TableHead className="pr-6">Actual Use</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Residential — single row */}
                  <TableRow>
                    <TableCell className="pl-6">
                      <Badge variant="secondary">Residential</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{RESIDENTIAL_TYPE.label}</TableCell>
                    <TableCell className="pr-6 text-muted-foreground">Residential</TableCell>
                  </TableRow>
                  {/* Commercial subtypes */}
                  {COMMERCIAL_TYPES.map((type, i) => (
                    <TableRow key={type.id}>
                      {i === 0 && (
                        <TableCell className="pl-6 align-top" rowSpan={COMMERCIAL_TYPES.length}>
                          <Badge variant="outline">Commercial</Badge>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{type.label}</TableCell>
                      <TableCell className="pr-6 text-muted-foreground">Commercial</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Assessment Level Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Level Schedule</CardTitle>
              <CardDescription>
                Applies to all building types regardless of actual use. Based solely on Fair Market Value.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Fair Market Value Range</TableHead>
                    <TableHead className="text-center pr-6">Assessment Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ASSESSMENT_LEVELS.map((row) => (
                    <TableRow key={row.range}>
                      <TableCell className="pl-6 tabular-nums">{row.range}</TableCell>
                      <TableCell className="text-center pr-6">
                        <Badge variant={row.level === "0%" ? "secondary" : "default"}>{row.level}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Unit Construction Cost Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Unit Construction Cost Matrix</CardTitle>
              <CardDescription>
                Cost per sqm (₱) by building type and structural type. Blank cells = not applicable.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 min-w-[220px]">Building Type</TableHead>
                    {STRUCTURAL_TYPES.map((st) => (
                      <TableHead key={st} className="text-center whitespace-nowrap">{st}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BUILDING_TYPES.map((bt) => (
                    <TableRow key={bt.id}>
                      <TableCell className="pl-6 font-medium text-sm">{bt.label}</TableCell>
                      {STRUCTURAL_TYPES.map((st) => {
                        const cost = getUnitConstructionCost(bt.label, st)
                        const value = cost ? parseInt(cost) : 0
                        return (
                          <TableCell key={st} className="text-center tabular-nums text-sm">
                            {value > 0 ? `₱${value.toLocaleString()}` : <span className="text-muted-foreground/40">—</span>}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Source: Local Assessment Ordinance and Schedule of Unit Construction Costs.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
