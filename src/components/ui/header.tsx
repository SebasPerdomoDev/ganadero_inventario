// src/components/Header.tsx
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

import { SeparatorVerticalIcon } from "lucide-react";

function getSectionTitle(pathname: string) {
  const sectionTitles: Record<string, string> = {
    "/": "Panel de Control",
    "/inventario": "Inventario",
    "/registro_alimentacion": "Registro de Alimentación",
    "/reporte_consumo": "Reporte de Consumo de Alimento",
    "/registro_ganado": "Registro de Ganado",
    "/ganado": "Ganado Registrado",
  };
  return sectionTitles[pathname] || "Panel de Control";
}

export default function Header() {
  const pathname = usePathname();
  const activeSection = getSectionTitle(pathname);

  return (
    <header className="flex justify-start items-center mb-4">
      <SidebarTrigger className="hover:bg-gray-100 p-2 border rounded-lg w-12 h-12" />
      <SeparatorVerticalIcon className="mx-4 h-8" />
      <h1 className="font-bold text-3xl">{activeSection}</h1>
    </header>
  );

}
