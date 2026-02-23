"use client"

import * as React from "react"
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
  const [rpfaasOpen, setRpfaasOpen] = React.useState(false);
  const [user, setUser] = React.useState<{ role: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchUser = React.useCallback(() => {
    setIsLoading(true);
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
        setIsLoading(false);
      });
  }, []);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Listen for storage events to refresh user data
  React.useEffect(() => {
    const handleStorageChange = () => {
      fetchUser();
    };
    
    window.addEventListener('user-role-updated', handleStorageChange);
    return () => window.removeEventListener('user-role-updated', handleStorageChange);
  }, [fetchUser]);

  // Helper: check role
  const hasRole = (roles: string[]) => {
    const userRole = user?.role;
    if (!user || !userRole) return false;
    return roles.includes(userRole);
  };

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
        {/* Land Assessor group: visible to super_admin, admin, tax_mapper, municipal_tax_mapper */}
        {!isLoading && hasRole(["super_admin", "admin", "tax_mapper", "municipal_tax_mapper"]) && (
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
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/building-other-structure/dashboard">Building &amp; Structures</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/land-other-improvements/dashboard">Land &amp; Improvements</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/machinery/dashboard">Machinery</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Accountant group: visible to accountant, super_admin, admin */}
        {!isLoading && hasRole(["accountant", "super_admin", "admin"]) && (
          <SidebarGroup>
            <SidebarGroupLabel>Accountant</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/accounting">Accounting</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Super Admin group: visible to super_admin only */}
        {!isLoading && hasRole(["super_admin"]) && (
          <SidebarGroup>
            <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/signup">Manage Users</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
                    <a href="/notes">Notes</a>
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
