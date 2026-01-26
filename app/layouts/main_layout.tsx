import React from "react";

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
    </div>
  );
};

export default MainLayout;
