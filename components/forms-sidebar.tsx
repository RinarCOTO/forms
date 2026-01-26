"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";

interface FormsSidebarProps {
  className?: string;
}

export function FormsSidebar({ className }: FormsSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col gap-4 border-r bg-secondary/40 p-4 text-sm",
        className,
      )}
    >
      <div>
        <h2 className="text-lg font-semibold">Forms Navigation</h2>
        <p className="text-xs text-muted-foreground">
          Select a form to fill up or review.
        </p>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 pr-2">
          <Link
            href="/building-other-structure/fill"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "justify-start bg-primary/10 font-medium",
            )}
          >
            RPFAAS - Building & Other Structures
          </Link>
          <Link
            href="/land-other-improvements"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "justify-start",
            )}
          >
            Land & Other Improvements
          </Link>
          <Link
            href="/notes"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "justify-start",
            )}
          >
            Notes
          </Link>
          {/* Add more form links here as you build them */}
        </nav>
      </ScrollArea>

      <p className="mt-auto text-[11px] leading-snug text-muted-foreground">
        Tip: Use the printable form link on the right after filling up.
      </p>
    </aside>
  );
}
