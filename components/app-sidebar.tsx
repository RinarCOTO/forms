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
  const [rpfaasOpen, setRpfaasOpen] = React.useState(false)
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div>
          <h2 className="text-lg font-semibold">Forms</h2>
          <p className="text-xs text-muted-foreground">Select a form to fill or review.</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
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
  )
}
