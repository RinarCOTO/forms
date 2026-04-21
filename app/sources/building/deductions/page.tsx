"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DEDUCTION_CHOICES, ADDITIONAL_PERCENT_CHOICES, ADDITIONAL_FLAT_RATE_CHOICES } from "@/config/form-options"

export default function DeductionsPage() {
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
                <BreadcrumbPage>Deductions &amp; Additionals</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Deductions &amp; Additionals</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Reference rates used in building assessment step 4.
            </p>
          </div>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <CardTitle>Deductions</CardTitle>
              <CardDescription>
                Percentage deducted from total reproduction cost when a standard component is absent.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Item</TableHead>
                    <TableHead className="text-center pr-6">Deduction Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEDUCTION_CHOICES.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6 font-medium">{item.name}</TableCell>
                      <TableCell className="text-center pr-6">
                        <Badge variant="destructive">{item.percentage}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Additionals — Percentage */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Items — Percentage</CardTitle>
              <CardDescription>
                These are priced as a percentage of the base unit cost × floor area.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Item</TableHead>
                    <TableHead className="text-center pr-6">% of Base Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ADDITIONAL_PERCENT_CHOICES.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6 font-medium">{item.name}</TableCell>
                      <TableCell className="text-center pr-6">
                        <Badge variant="secondary">{item.percentage}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Additionals — Flat Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Items — Flat Rate</CardTitle>
              <CardDescription>
                Fixed price per square meter, multiplied by the item&apos;s floor area.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Item</TableHead>
                    <TableHead className="text-center pr-6">Price / sqm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ADDITIONAL_FLAT_RATE_CHOICES.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6 font-medium">{item.name}</TableCell>
                      <TableCell className="text-center pr-6">
                        <Badge variant="secondary">
                          ₱{item.pricePerSqm.toLocaleString()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Source: Schedule of Deductions and Additionals per building assessment manual.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
