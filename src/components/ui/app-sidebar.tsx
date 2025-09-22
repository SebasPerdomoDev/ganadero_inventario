"use client"
import { ChartColumn,NotebookPen, Fish, Package , } from "lucide-react"
import { PiCowFill } from "react-icons/pi";
import { FaClipboardList } from "react-icons/fa";
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { use } from "react"
import { usePathname } from "next/navigation"

// Menu items.
const items = [
  {
    title: "Panel de Control",
    url: "/panel_control",
    icon: Fish,
  },
  {
    title: "Registro Ganado",
    url: "/registro_ganado",
    icon: PiCowFill,
  },
  {
    title: "Ganado",
    url: "/ganado",
    icon: FaClipboardList,
  },
  {
    title: "Inventario",
    url: "/inventario",
    icon: Package,
  },
  {
    title: "Registro de alimentacion",
    url: "/registro_alimentacion",
    icon: NotebookPen,
  },
  {
    title: "Reporte de consumo",
    url: "/reporte_consumo",
    icon: ChartColumn,
  },
  
]

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <Sidebar>
      <SidebarHeader>
        
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-3 mt-2">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                <Fish className="size-6" />
              </div>
              <span className="text-xl font-bold tracking-wide text-gray-700">Fondo Ganadero </span>
            </div>

          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegacion</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}
                      className={`flex items-center gap-2 px-2 py-1 rounded ${
                          pathname.startsWith(item.url) ? 'bg-gray-200 font-semibold' : ''
                        }`}>
                        <item.icon />
                        <span className=" active:font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarHeader>
    </Sidebar>
  )
}