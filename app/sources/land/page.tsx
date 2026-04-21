"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function LandSourcesPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <span className="text-sm font-medium">Sources / Land</span>
        </header>
        <div className="p-6 max-w-4xl">
          <h1 className="text-2xl font-semibold mb-1">Land Sources</h1>
          <p className="text-sm text-muted-foreground">Coming soon.</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
