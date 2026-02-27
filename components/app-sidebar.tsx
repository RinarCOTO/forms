"use client"

import * as React from "react"
import { usePathname } from "next/navigation";
import "./sidebar-active.css";
import { UserProfile } from "@/components/user-profile"
import { ChevronRight, ChevronDown, ClipboardList, ListChecks, PenLine, Calculator, Users, ShieldCheck, StickyNote } from "lucide-react"
import { usePermissions } from "@/app/contexts/permissions-context"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [rpfaasOpen, setRpfaasOpen] = React.useState(true);
  const { role, permissions: perms, loading: isLoading } = usePermissions();

  const can = (feature: string) => perms[feature] === true;

  // Land Assessor section is shown if the user can view any RPFAAS form
  const showLandAssessor =
    can('building_structures.view') ||
    can('land_improvements.view') ||
    can('machinery.view');

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div>
          <h2 className="text-lg font-semibold">Forms</h2>
          <p className="text-xs text-muted-foreground">Select a form to fill or review.</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isLoading && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="space-y-2 px-2 py-1 animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/5" />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Land Assessor group */}
        {!isLoading && showLandAssessor && (
          <SidebarGroup>
            <SidebarGroupLabel>Land Assessor</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={(e) => { e.preventDefault(); setRpfaasOpen((v) => !v); }}>
                    <div className="flex items-center w-full">
                      <ClipboardList className="mr-2 w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">RPFAAS Forms</span>
                      {rpfaasOpen ? (
                        <ChevronDown className="ml-2 w-4 h-4" />
                      ) : (
                        <ChevronRight className="ml-2 w-4 h-4" />
                      )}
                    </div>
                  </SidebarMenuButton>
                  {rpfaasOpen && (
                    <SidebarMenuSub>
                      {can('building_structures.view') && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <a href="/building-other-structure/dashboard" className={pathname.startsWith("/building-other-structure") ? "sidebar-active" : ""}>Building &amp; Structures</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                      {can('land_improvements.view') && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <a href="/land-other-improvements/dashboard" className={pathname.startsWith("/land-other-improvements") ? "sidebar-active" : ""}>Land &amp; Improvements</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                      {can('machinery.view') && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <a href="/machinery/dashboard" className={pathname.startsWith("/machinery") ? "sidebar-active" : ""}>Machinery</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Review Queue — LAOO only */}
        {!isLoading && can('review.laoo') && (
          <SidebarGroup>
            <SidebarGroupLabel>Provincial Review</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/review-queue" className={pathname.startsWith("/review-queue") ? "sidebar-active" : ""}><ListChecks className="w-4 h-4 shrink-0" />Review Queue</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Signature Queue — municipal_tax_mapper, APA, provincial_assessor */}
        {!isLoading && can('review.sign') && (
          <SidebarGroup>
            <SidebarGroupLabel>Signatures</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/signature-queue" className={pathname.startsWith("/signature-queue") ? "sidebar-active" : ""}><PenLine className="w-4 h-4 shrink-0" />Signature Queue</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Accountant group */}
        {!isLoading && can('accounting.view') && (
          <SidebarGroup>
            <SidebarGroupLabel>Accountant</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/accounting" className={pathname.startsWith("/accounting") ? "sidebar-active" : ""}><Calculator className="w-4 h-4 shrink-0" />Accounting</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Super Admin group — role hard-check keeps this locked to super_admin */}
        {!isLoading && role === 'super_admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {can('user_management.view') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/manage-users" className={pathname.startsWith("/manage-users") ? "sidebar-active" : ""}><Users className="w-4 h-4 shrink-0" />Manage Users</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {can('role_management.view') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/manage-roles" className={pathname.startsWith("/manage-roles") ? "sidebar-active" : ""}><ShieldCheck className="w-4 h-4 shrink-0" />Manage Roles</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Notes: visible to all roles */}
        {!isLoading && (
          <SidebarGroup>
            <SidebarGroupLabel>Other</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/notes" className={pathname.startsWith("/notes") ? "sidebar-active" : ""}><StickyNote className="w-4 h-4 shrink-0" />Notes</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <UserProfile />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
