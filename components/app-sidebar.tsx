"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation";
import "./sidebar-active.css";
import { UserProfile } from "@/components/user-profile"
import { ChevronRight, ChevronDown, ClipboardList, ListChecks, Calculator, Users, ShieldCheck, StickyNote, Settings, ScrollText } from "lucide-react"
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
  const [smvOpen, setSmvOpen] = React.useState(true);
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
                            <Link href="/building-other-structure/dashboard" className={pathname.startsWith("/building-other-structure") ? "sidebar-active" : ""}>Building &amp; Structures</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                      {can('land_improvements.view') && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link href="/land-other-improvements/dashboard" className={pathname.startsWith("/land-other-improvements") ? "sidebar-active" : ""}>Land &amp; Improvements</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                      {can('machinery.view') && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link href="/machinery/dashboard" className={pathname.startsWith("/machinery") ? "sidebar-active" : ""}>Machinery</Link>
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
        {!isLoading && showLandAssessor && (
          <SidebarGroup>
            <SidebarGroupLabel>SMV</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={(e) => { e.preventDefault(); setSmvOpen((v) => !v); }}>
                    <div className="flex items-center w-full">
                      <Settings className="mr-2 w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">SMV</span>
                      {smvOpen ? (
                      <ChevronDown className="ml-2 w-4 h-4" />
                      ) : (
                      <ChevronRight className="ml-2 w-4 h-4" />
                      )}
                    </div>
                  </SidebarMenuButton>
                  {smvOpen && (
                    <SidebarMenuSub>
                      {can('building_structures.view') && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link href="/smv/building-other-structures/dashboard" className={pathname.startsWith("/smv/building-other-structures") ? "sidebar-active" : ""}>Building &amp; Structures</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                      {can('land_improvements.view') && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link href="/smv/land-other-improvements/dashboard" className={pathname.startsWith("/smv/land-other-improvements") ? "sidebar-active" : ""}>Land &amp; Improvements</Link>
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

        {/* Review Queue — all review roles */}
        {!isLoading && (can('review.laoo') || can('review.sign')) && (
          <SidebarGroup>
            <SidebarGroupLabel>Review</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/review-queue" className={pathname.startsWith("/review-queue") ? "sidebar-active" : ""}><ListChecks className="w-4 h-4 shrink-0" />Review Queue</Link>
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
                    <Link href="/accounting" className={pathname.startsWith("/accounting") ? "sidebar-active" : ""}><Calculator className="w-4 h-4 shrink-0" />Accounting</Link>
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
                      <Link href="/manage-users" className={pathname.startsWith("/manage-users") ? "sidebar-active" : ""}><Users className="w-4 h-4 shrink-0" />Manage Users</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {can('role_management.view') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/manage-roles" className={pathname.startsWith("/manage-roles") ? "sidebar-active" : ""}><ShieldCheck className="w-4 h-4 shrink-0" />Manage Roles</Link>
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
                    <Link href="/notes" className={pathname.startsWith("/notes") ? "sidebar-active" : ""}><StickyNote className="w-4 h-4 shrink-0" />Notes</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {role && ['laoo', 'admin', 'super_admin', 'assistant_provincial_assessor', 'provincial_assessor'].includes(role) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/tax-declaration" className={pathname.startsWith("/tax-declaration") ? "sidebar-active" : ""}><ScrollText className="w-4 h-4 shrink-0" />Tax Declaration</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
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
