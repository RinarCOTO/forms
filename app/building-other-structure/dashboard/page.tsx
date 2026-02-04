"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus, ArrowLeft, Loader2, Eye, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import AppHeader from "@/components/app-header";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

// This page is dedicated to building-other-structure dashboard
export default function BuildingOtherStructureDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/user");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setUserLoading(false);
      }
    };

    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/forms/building-structures");
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data);
        } else {
          setSubmissions([]);
        }
      } catch (error) {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
    fetchSubmissions();
  }, []);

  const handleNewForm = async () => {
    try {
      const now = new Date().toISOString();
      const response = await fetch("/api/forms/building-structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft", updated_at: now })
      });
      if (response.ok) {
        const data = await response.json();
        const newId = data?.data?.id || data?.id;
        if (newId) {
          router.push(`/building-other-structure/fill/step-1?id=${newId}`);
        } else {
          alert("Failed to get new record ID.");
        }
      } else {
        alert("Failed to create new submission.");
      }
    } catch (error) {
      alert("Error creating new submission.");
    }
  };

  const handleViewSubmission = (submissionId: number) => {
    router.push(`/building-other-structure/fill/step-1?id=${submissionId}`);
  };

  const handleDeleteSubmission = async (submissionId: number) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/building-other-structure/${submissionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove the deleted submission from the list
        setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
        alert('Submission deleted successfully.');
      } else {
        alert(result.message || 'Failed to delete submission.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting submission.');
    }
  };

  const canDelete = user && (user.role === 'admin' || user.role === 'super_admin');

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
                <BreadcrumbLink href="/building-other-structure/dashboard">Building & Structures</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Submissions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}> <ArrowLeft className="h-4 w-4 mr-2" /> Back to Building Dashboard </Button>
              </div>
              <Button onClick={handleNewForm}> <Plus className="h-4 w-4 mr-2" /> New Submission </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Building & Structures</CardTitle>
                <CardDescription>View and manage all submissions for this form type</CardDescription>
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
                    <p className="text-muted-foreground mb-4">Get started by creating a new submission</p>
                    <Button onClick={handleNewForm}> <Plus className="h-4 w-4 mr-2" /> Create First Submission </Button>
                  </div>
                ) : (
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
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">#{submission.id}</TableCell>
                          <TableCell>{submission.owner_name || submission.title || 'N/A'}</TableCell>
                          <TableCell>{new Date(submission.updated_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={submission.status === 'approved' ? 'success' : submission.status === 'pending' ? 'warning' : submission.status === 'draft' ? 'secondary' : submission.status === 'rejected' ? 'destructive' : 'default'}>
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewSubmission(submission.id)}>
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleViewSubmission(submission.id)}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                              {canDelete && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteSubmission(submission.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface FormSubmission {
  id: number;
  owner_name?: string;
  title?: string;
  updated_at: string;
  status: string;
}
