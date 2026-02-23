import React from "react";
import { Toaster } from "sonner";

type Props = {
  children: React.ReactNode;
};

const MainLayout = ({ children }: Props) => {
  return (
    <div
      style={{ backgroundColor: "#cbcfd2" }}
      className="min-h-screen w-full"
    >
      {children}
      <Toaster position="top-center" richColors closeButton duration={3000} />
    </div>
  );
};

export default MainLayout;
