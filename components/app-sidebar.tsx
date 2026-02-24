"use client"

import * as React from "react"
import { usePathname } from "next/navigation";
import "./sidebar-active.css";
import { UserProfile } from "@/components/user-profile"
import { ChevronRight, ChevronDown } from "lucide-react"

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
  const [role, setRole] = React.useState<string | null>(null);
  const [perms, setPerms] = React.useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchPerms = React.useCallback(() => {
    setIsLoading(true);
    fetch("/api/my-permissions")
      .then((res) => res.json())
      .then((data) => {
        setRole(data.role ?? null);
        setPerms(data.permissions ?? {});
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching permissions:", error);
        setIsLoading(false);
      });
  }, []);

  React.useEffect(() => {
    fetchPerms();
  }, [fetchPerms]);

  // Refresh when role changes elsewhere in the app
  React.useEffect(() => {
    const handleRoleUpdate = () => fetchPerms();
    window.addEventListener('user-role-updated', handleRoleUpdate);
    return () => window.removeEventListener('user-role-updated', handleRoleUpdate);
  }, [fetchPerms]);

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

        {/* Accountant group */}
        {!isLoading && can('accounting.view') && (
          <SidebarGroup>
            <SidebarGroupLabel>Accountant</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/accounting" className={pathname.startsWith("/accounting") ? "sidebar-active" : ""}>Accounting</a>
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
                      <a href="/manage-users" className={pathname.startsWith("/manage-users") ? "sidebar-active" : ""}>Manage Users</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {can('role_management.view') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/manage-roles" className={pathname.startsWith("/manage-roles") ? "sidebar-active" : ""}>Manage Roles</a>
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
                    <a href="/notes" className={pathname.startsWith("/notes") ? "sidebar-active" : ""}>Notes</a>
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
