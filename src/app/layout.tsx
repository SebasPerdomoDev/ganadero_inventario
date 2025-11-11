// src/app/layout.tsx
"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Header from "@/components/ui/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  // 🔹 Define el título del navegador manualmente
  useEffect(() => {
    document.title = "Inventario Ganadero";
  }, []);

  return (
    <html lang="es">
      <body className="flex min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 p-6">
            <Header />
            {children}
          </main>
          <Toaster position="top-right" />
        </SidebarProvider>
      </body>
    </html>
  );
}
