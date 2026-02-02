import React from "react";

export default function AppHeader() {
  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm flex items-center h-16 px-6 z-10">
      <div className="flex-1 flex items-center">
        <span className="text-xl font-bold tracking-tight text-gray-800">Forms Dashboard</span>
      </div>
      {/* Add user/account menu or actions here if needed */}
    </header>
  );
}
