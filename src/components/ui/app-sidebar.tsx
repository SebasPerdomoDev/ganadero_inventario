"use client";
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
} from "@/components/ui/sidebar";
import { cowHead } from "@lucide/lab";
import {
  ClipboardList,
  Gauge,
  Icon,
  NotebookPen,
  Package,
  Skull,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Componente personalizado para el ícono de vaca
const CowIcon = (props: any) => <Icon iconNode={cowHead} {...props} />;

// Menu items.
const items = [
  {
    title: "Panel de Control",
    url: "/panel_control",
    icon: Gauge, // Dashboard icon
  },
  
  {
    title: "Ganado",
    url: "/ganado",
    icon: ClipboardList, // List of animals
  },
  {
    title: "Ventas",
    url: "/ventas",
    icon: DollarSign, // List of animals
  },
  {
    title: "Inventario",
    url: "/inventario",
    icon: Package,
  },
  {
    title: "Alimentación",
    url: "/registro_alimentacion",
    icon: NotebookPen,
  },
  {
    title: "Nacimientos y Mortalidad",
    url: "/registro_nacimientos_mortalidad",
    icon: Skull,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-3 mt-2">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <CowIcon className="size-6" />
              </div>
              <span className="font-bold text-gray-700 text-xl tracking-wide">
                Fondo Ganadero
              </span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent></SidebarGroupContent>
        </SidebarGroup>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${pathname.startsWith(item.url)
                          ? "bg-gray-200 font-semibold text-blue-700"
                          : "hover:bg-gray-100"
                          }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
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
  );
}
