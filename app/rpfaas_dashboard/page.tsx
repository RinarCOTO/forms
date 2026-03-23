import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const RPFAAS_FORMS = [
  {
    id: "building-structure",
    title: "Building / Structure",
    description: "Real Property Field Appraisal & Assessment Sheet for Buildings and Structures",
    icon: "🏢",
    fillPath: "/rpfaas/building-structure/fill",
    viewPath: "/rpfaas/building-structure/view",
  },
  {
    id: "land-improvements",
    title: "Land / Other Improvements",
    description: "Real Property Field Appraisal & Assessment Sheet for Land and Other Improvements",
    icon: "🏞️",
    fillPath: "/rpfaas/land-improvements/fill",
    viewPath: "/rpfaas/land-improvements/view",
  },
  {
    id: "machinery",
    title: "Machinery",
    description: "Real Property Field Appraisal & Assessment Sheet for Machinery",
    icon: "⚙️",
    fillPath: "/rpfaas/machinery/fill",
    viewPath: "/rpfaas/machinery/view",
    comingSoon: true,
  },
];

export default function RPFAASPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>RPFAAS Forms</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              Real Property Field Appraisal & Assessment Sheets
            </h1>
            <p className="text-muted-foreground">
              Select a form type to begin data entry or view existing forms
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {RPFAAS_FORMS.map((form) => (
              <div
                key={form.id}
                className="relative flex flex-col gap-4 rounded-lg border p-6 hover:shadow-lg transition-shadow"
              >
                {form.comingSoon && (
                  <span className="absolute top-2 right-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                )}
                
                <div className="text-4xl mb-2">{form.icon}</div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-2">{form.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {form.description}
                  </p>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button 
                    asChild 
                    className="flex-1"
                    disabled={form.comingSoon}
                  >
                    <Link href={form.fillPath}>
                      Fill Form
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline"
                    disabled={form.comingSoon}
                  >
                    <Link href={form.viewPath}>
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-lg bg-muted">
            <h2 className="text-lg font-semibold mb-2">About RPFAAS</h2>
            <p className="text-sm text-muted-foreground">
              The Real Property Field Appraisal and Assessment Sheet (RPFAAS) is used
              for the systematic recording and assessment of real property for taxation
              purposes. Each form type is designed for specific property categories.
            </p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
