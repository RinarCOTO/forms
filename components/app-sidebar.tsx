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
  const [user, setUser] = React.useState(null);
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

  // Only show sidebar after user is loaded
  if (isLoading) return null;

  // Helper: check role
  const hasRole = (roles) => {
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
        {/* Land Assessor group: visible to super_admin, admin, tax_mapper, municipal_tax_mapper */}
        {hasRole(["super_admin", "admin", "tax_mapper", "municipal_tax_mapper"]) && (
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
                          <a href="/rpfaas/land-improvements/view">Land &amp; Improvements</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/rpfaas/machinery">Machinery</a>
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
        {hasRole(["accountant", "super_admin", "admin"]) && (
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
        {hasRole(["super_admin"]) && (
          <SidebarGroup>
            <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/signup">Create New User</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Notes: visible to all roles */}
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
      </SidebarContent>

      <SidebarFooter>
        <UserProfile />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
