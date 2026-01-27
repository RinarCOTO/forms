"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout, getUserName, getUserEmail } from "@/lib/auth";
import { LogOut, User } from "lucide-react";

export function UserProfile() {
  const router = useRouter();
  const userName = getUserName();
  const userEmail = getUserEmail();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!userName && !userEmail) {
    return null;
  }

  return (
    <div className="border-t border-border p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          {userName && (
            <p className="font-medium truncate">{userName}</p>
          )}
          {userEmail && (
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          )}
        </div>
      </div>
      <Button
        onClick={handleLogout}
        variant="outline"
        size="sm"
        className="w-full justify-start"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
