"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus, ArrowLeft, Loader2, Eye, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is dedicated to building-other-structure dashboard
export default function BuildingOtherStructureDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
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
  );
}

interface FormSubmission {
  id: number;
  owner_name?: string;
  title?: string;
  updated_at: string;
  status: string;
}
