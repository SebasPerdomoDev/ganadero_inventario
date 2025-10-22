"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";


import { cowHead } from "@lucide/lab"; 
import { Baby, DollarSign, HeartPulse, Icon, ShoppingCart, Skull } from "lucide-react";

export default function Dashboard() {
  // Estados para almacenar estadísticas que se mostrarán en las tarjetas
  const [totalAnimales, setTotalAnimales] = useState<number>(0);
  const [animalesVivos, setAnimalesVivos] = useState<number>(0);
  const [muertesMes, setMuertesMes] = useState<number>(0);
  const [nacimientosMes, setNacimientosMes] = useState<number>(0);
  const [ventasRealizadas, setVentasRealizadas] = useState<number>(0);
  const [totalVentas, setTotalVentas] = useState<number>(0);

  // Llamar a la función fetchDatos apenas se monte el componente
  useEffect(() => {
    fetchDatos();
  }, []);

  // Función que consulta Supabase para obtener los datos
  const fetchDatos = async () => {
    try {
      // Total de animales
      const { count: total } = await supabase
        .from("animales")
        .select("*", { count: "exact", head: true });
      setTotalAnimales(total || 0);

      // Fecha en formato "YYYY-MM"
      const mesActual = new Date().toISOString().slice(0, 7);

      // Muertes en el mes actual
      const { count: muertes } = await supabase
        .from("muertes")
        .select("*", { count: "exact", head: true })
        .gte("fecha_muerte", `${mesActual}-01`) // desde el primer día
        .lte("fecha_muerte", `${mesActual}-31`); // hasta el día 31
      setMuertesMes(muertes || 0);

      // Nacimientos en el mes actual
      const { count: nacimientos } = await supabase
        .from("nacimientos")
        .select("*", { count: "exact", head: true })
        .gte("fecha_nacimiento", `${mesActual}-01`)
        .lte("fecha_nacimiento", `${mesActual}-31`);
      setNacimientosMes(nacimientos || 0);

      // Ventas realizadas (número de registros y total en pesos)
      const { data: ventasData, count: ventasCount } = await supabase
        .from("ventas")
        .select("*", { count: "exact" });
      setVentasRealizadas(ventasCount || 0);

      // Sumar el valor de todas las ventas
      const totalValor = ventasData?.reduce(
        (acc, venta) => acc + (venta.valor || 0),
        0
      );
      setTotalVentas(totalValor || 0);

      // Animales vivos = total - muertos - vendidos
      const { count: muertos } = await supabase
        .from("muertes")
        .select("*", { count: "exact", head: true });
      const { count: vendidos } = await supabase
        .from("ventas")
        .select("*", { count: "exact", head: true });

      setAnimalesVivos((total || 0) - (muertos || 0) - (vendidos || 0));
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    }
  };

  // Configuración de las tarjetas que se mostrarán en el dashboard
  const cards = [
    {
      title: "Total Animales",
      value: totalAnimales,
      // ❌ Aquí "cowHead" no existe.  
      // Deberías usar otro icono válido de "lucide-react".
      icon: <Icon iconNode={cowHead} className="w-6 h-6 text-gray-700" />,
      color: "text-gray-800",
    },
    {
      title: "Animales Vivos",
      value: animalesVivos,
      icon: <HeartPulse className="w-6 h-6 text-green-600" />,
      color: "text-green-600",
    },
    {
      title: "Nacimientos (Mes)",
      value: nacimientosMes,
      icon: <Baby className="w-6 h-6 text-blue-600" />,
      color: "text-blue-600",
    },
    {
      title: "Muertes (Mes)",
      value: muertesMes,
      icon: <Skull className="w-6 h-6 text-red-600" />,
      color: "text-red-600",
    },
    {
      title: "Ventas Realizadas",
      value: ventasRealizadas,
      icon: <ShoppingCart className="w-6 h-6 text-gray-700" />,
      color: "text-gray-700",
    },
    {
      title: "Valor Total Ventas",
      value: `$${totalVentas.toLocaleString("es-CO")}`, // formatea con separadores de miles
      icon: <DollarSign className="w-6 h-6 text-amber-600" />,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="bg-white mx-auto p-4 md:p-8 w-full min-h-screen">
      {/* Grid con todas las tarjetas */}
      <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <Card
            key={index}
            className="flex flex-col justify-between shadow-sm hover:shadow-md border h-[130px] transition"
          >
            {/* Encabezado con título e icono */}
            <CardHeader className="flex flex-row justify-between items-center pb-0">
              <CardTitle className="font-medium text-gray-500 text-sm text-center leading-tight">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>

            {/* Contenido con el valor en grande */}
            <CardContent className="flex justify-start items-end pb-4">
              <div className={`text-3xl font-bold ${card.color}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
