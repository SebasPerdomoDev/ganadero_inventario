// src/app/prueba/page.tsx

"use client";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export default function PruebaConexion() {
  useEffect(() => {
    const fetchInventario = async () => {
      const { data, error } = await supabase.from("animales").select("*");
      if (error) {
        console.error("Error de conexión:", error.message);
      } else {
        console.log("Conexión exitosa ✅", data);
      }
    };

    fetchInventario();
  }, []);

  return <div className="p-8 text-xl">Revisa la consola 🔍</div>;
}
