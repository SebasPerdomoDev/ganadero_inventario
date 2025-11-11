

// src/app/layout.tsx

import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

import Header from "@/components/ui/header";


export const metadata: Metadata = {
  title: "Inventario Ganadero",
  description: "Sistema de alimentación y gestión de inventario en tiempo real",
};

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="es">
      <body className="flex min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 p-6">
            <Header></Header>


            {children}
          </main>
          <Toaster position="top-right" />
        </SidebarProvider>
      </body>
    </html>
  );
}
