"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignatureUpload } from "@/components/signature-upload";
import { Loader2, User } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  municipality?: string;
  position?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/user').then(r => r.json()),
      fetch('/api/users/me').then(r => r.json()).catch(() => null),
    ]).then(([authData, meData]) => {
      const base: UserProfile = {
        id: authData.user?.id ?? '',
        email: authData.user?.email ?? '',
        full_name: authData.user?.user_metadata?.full_name,
      };
      if (meData?.data) {
        base.role = meData.data.role;
        base.municipality = meData.data.municipality;
        base.position = meData.data.position;
        base.full_name = meData.data.full_name || base.full_name;
      }
      setProfile(base);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Profile</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 space-y-6 max-w-2xl">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground text-sm">View your account details and manage your e-signature.</p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{profile.full_name || '—'}</span>
                  <span className="text-muted-foreground">Email</span>
                  <span>{profile.email}</span>
                  {profile.role && (<><span className="text-muted-foreground">Role</span><span><Badge variant="outline">{profile.role.replace(/_/g, ' ')}</Badge></span></>)}
                  {profile.municipality && (<><span className="text-muted-foreground">Municipality</span><span className="capitalize">{profile.municipality}</span></>)}
                  {profile.position && (<><span className="text-muted-foreground">Position</span><span>{profile.position}</span></>)}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>E-Signature</CardTitle>
              <CardDescription>Upload your signature image. It will appear on FAAS forms you sign during the review workflow.</CardDescription>
            </CardHeader>
            <CardContent>
              <SignatureUpload />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
