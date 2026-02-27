"use client";

import { useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { AdminOrderNotifications } from "./admin-order-notifications";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <AdminOrderNotifications />
      <div className="flex min-h-screen">
        <AppSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${
            sidebarOpen ? "ml-64" : "ml-16"
          }`}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </>
  );
}
