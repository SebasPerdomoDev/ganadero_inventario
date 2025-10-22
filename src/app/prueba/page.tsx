// src/app/prueba/page.tsx

"use client"; 
// Esto indica que el componente corre en el cliente (necesario porque usa hooks de React)

import { supabase } from "@/lib/supabase"; 
import { useEffect } from "react";

export default function PruebaConexion() {
  useEffect(() => {
    // Función asincrónica que consulta la tabla "animales"
    const fetchInventario = async () => {
      const { data, error } = await supabase.from("animales").select("*");

      if (error) {
        // Si ocurre un error (API key inválida, RLS, tabla no existe, etc.)
        console.error("Error de conexión:", error.message);
      } else {
        // Si funciona, imprime los registros obtenidos
        console.log("Conexión exitosa", data);
      }
    };

    // Ejecutar la consulta al cargar el componente
    fetchInventario();
  }, []);

  return <div className="p-8 text-xl">Revisa la consola</div>;
}
