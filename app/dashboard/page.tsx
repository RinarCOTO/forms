"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, Plus, Loader2, Eye, Edit, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

type FormType = "building-structure" | "land-improvements" | "machinery" | "notes"

interface FormSubmission {
  id: number
  owner_name?: string
  title?: string
  updated_at: string
  status: string
}

const formsMenu = [
  {
    id: "building-structure",
    title: "Building & Structures",
    description: "Property assessment forms for buildings and structures",
    icon: FileText,
    apiEndpoint: "/api/forms/building-structures",
    formRoute: "/building-other-structure/fill/step-1",
    // Adding the dashboard route here
    dashboardRoute: "/building-other-structure/dashboard",
  },
  {
    id: "land-improvements",
    title: "Land & Improvements",
    description: "Assessment forms for land and property improvements",
    icon: FileText,
    apiEndpoint: "/api/forms/land-other-improvements",
    formRoute: "/land-other-improvements/fill/step-1",
    dashboardRoute: "/land-other-improvements/dashboard",
  },
  {
    id: "machinery",
    title: "Machinery",
    description: "Equipment and machinery assessment forms",
    icon: FileText,
    apiEndpoint: "/api/forms/machinery",
    formRoute: "/machinery/fill",
  },
  {
    id: "notes",
    title: "Notes",
    description: "Additional notes and documentation",
    icon: FileText,
    apiEndpoint: "/api/forms/notes",
    formRoute: "/notes/create",
  },
]

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "success"
    case "pending":
      return "warning"
    case "draft":
      return "secondary"
    case "rejected":
      return "destructive"
    default:
      return "default"
  }
}

export default function Page() {
  const router = useRouter()
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  // Fetch submission counts for all forms
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch('/api/forms/counts')
        if (response.ok) {
          const data = await response.json()
          setSubmissionCounts(data)
        }
      } catch (error) {
        console.error('Error fetching counts:', error)
      }
    }
    fetchCounts()
  }, [])

  // Fetch submissions when a form is selected
  useEffect(() => {
    if (selectedForm) {
      const fetchSubmissions = async () => {
        setLoading(true)
        const form = formsMenu.find((f) => f.id === selectedForm)
        if (!form) return

        try {
          const response = await fetch(form.apiEndpoint)
          if (response.ok) {
            const data = await response.json()
            setSubmissions(data)
          } else {
            const errorData = await response.json().catch(() => ({}))
            console.error('Failed to fetch submissions:', errorData)
            setSubmissions([])
          }
        } catch (error) {
          console.error('Error fetching submissions:', error)
          setSubmissions([])
        } finally {
          setLoading(false)
        }
      }
      fetchSubmissions()
    } else {
      setSubmissions([])
    }
  }, [selectedForm])

  // UPDATED: Logic to handle dashboard redirection
  const handleFormSelect = useCallback((formId: FormType) => {
    const form = formsMenu.find((f) => f.id === formId)

    // If the form has a specific dashboard route (like Building & Structures), redirect there
    if (form?.dashboardRoute) {
      router.push(form.dashboardRoute)
      return
    }

    // Otherwise, default to the local table view
    setSelectedForm(formId)
    setShowForm(false)
    setCurrentPage(1)
  }, [router])

  const handleBackToMenu = useCallback(() => {
    setSelectedForm(null)
    setShowForm(false)
  }, [])

  const handleNewForm = useCallback(async () => {
    const form = formsMenu.find((f) => f.id === selectedForm)
    if (form?.apiEndpoint && form?.formRoute) {
      try {
        const now = new Date().toISOString();
        const response = await fetch(form.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'draft', updated_at: now })
        });
        if (response.ok) {
          const data = await response.json();
          const newId = data?.data?.id || data?.id;
          if (newId) {
            router.push(`${form.formRoute}?id=${newId}`);
          } else {
            alert('Failed to get new record ID.');
          }
        } else {
          const error = await response.json();
          alert('Failed to create new submission: ' + (error?.message || error?.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Error creating new submission.');
      }
    }
  }, [selectedForm, router])

  const handleViewSubmission = useCallback((submissionId: number) => {
    const form = formsMenu.find((f) => f.id === selectedForm)
    if (form?.formRoute) {
      router.push(`${form.formRoute}?id=${submissionId}`)
    }
  }, [selectedForm, router])

  const currentFormData = formsMenu.find((f) => f.id === selectedForm)
  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE))
  const paginatedSubmissions = submissions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              {selectedForm && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentFormData?.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-6">
          {!selectedForm && (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Forms Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Select a form type to manage submissions
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {formsMenu.map((form) => (
                  <Card
                    key={form.id}
                    className="cursor-pointer select-none transition-all hover:shadow-lg hover:border-primary"
                    onClick={() => handleFormSelect(form.id as FormType)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <form.icon className="h-5 w-5 text-primary" />
                        <CardTitle>{form.title}</CardTitle>
                      </div>
                      <CardDescription>{form.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        {submissionCounts[form.id] || 0} submissions
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {selectedForm && (
            <>
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={handleBackToMenu}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Menu
                </Button>
                <Button onClick={handleNewForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Submission
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{currentFormData?.title}</CardTitle>
                  <CardDescription>
                    View and manage all submissions for this form type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Get started by creating a new submission
                      </p>
                      <Button onClick={handleNewForm}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Submission
                      </Button>
                    </div>
                  ) : (
                    <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Owner Name</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSubmissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">
                              #{submission.id}
                            </TableCell>
                            <TableCell>{submission.owner_name || submission.title || 'N/A'}</TableCell>
                            <TableCell>
                              {new Date(submission.updated_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(submission.status) as any}>
                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewSubmission(submission.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewSubmission(submission.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between px-2 py-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {submissions.length === 0
                          ? "0 row(s)"
                          : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, submissions.length)} of ${submissions.length} row(s)`}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                          Next <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}