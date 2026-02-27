import React from "react";
import { Toaster } from "sonner";
import { PermissionsProvider } from "@/app/contexts/permissions-context";

type Props = {
  children: React.ReactNode;
};

const MainLayout = ({ children }: Props) => {
  return (
    <PermissionsProvider>
      <div
        style={{ backgroundColor: "#cbcfd2" }}
        className="min-h-screen w-full"
      >
        {children}
        <Toaster position="top-center" richColors closeButton duration={3000} />
      </div>
    </PermissionsProvider>
  );
};

export default MainLayout;
