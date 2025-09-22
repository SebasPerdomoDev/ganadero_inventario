"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Edit, Trash2, Eye } from "lucide-react";

type Ganado = {
  id: number;
  id_animal: number;
  raza: string;
  peso: number;
  sexo: string;
  fecha_nacimiento: string;
  fecha_ultimo_chequeo: string;
  estado_salud: string;
  ubicacion: string;
  observacion: string | null;
};

export default function GanadoTable() {
  const [ganado, setGanado] = useState<Ganado[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar registros
  useEffect(() => {
    const fetchGanado = async () => {
      const { data, error } = await supabase.from("ganado").select("*");
      if (error) {
        console.error("Error cargando ganado:", error.message);
      } else {
        setGanado(data as Ganado[]);
      }
      setLoading(false);
    };

    fetchGanado();
  }, []);

  // 🔹 Eliminar registro
  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este animal?")) return;

    const { error } = await supabase.from("ganado").delete().eq("id", id);
    if (error) {
      console.error("Error eliminando:", error.message);
    } else {
      setGanado(ganado.filter((g) => g.id !== id));
    }
  };

  // 🔹 Editar (aquí solo placeholder)
  const handleEdit = (id: number) => {
    alert(`Editar animal con ID interno: ${id}`);
    // Aquí abrirías un modal o redirigirías a un form de edición
  };

  if (loading) return <p className="text-center">Cargando...</p>;

  return (
    <div className="mt-10 overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4 text-cyan-700">Ganado Registrado</h2>
      <table className="w-full border border-gray-200 rounded-lg shadow-md">
        <thead className="bg-cyan-800 text-white">
          <tr>
            <th className="p-2 text-left">ID Animal</th>
            <th className="p-2 text-left">Raza</th>
            <th className="p-2 text-left">Peso (kg)</th>
            <th className="p-2 text-left">Sexo</th>
            <th className="p-2 text-left">Estado</th>
            <th className="p-2 text-left">Ubicación</th>
            <th className="p-2 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ganado.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-4 text-center text-gray-500">
                No hay registros de ganado aún 🐄
              </td>
            </tr>
          ) : (
            ganado.map((animal) => (
              <tr key={animal.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{animal.id_animal}</td>
                <td className="p-2">{animal.raza}</td>
                <td className="p-2">{animal.peso}</td>
                <td className="p-2 capitalize">{animal.sexo}</td>
                <td className="p-2">{animal.estado_salud}</td>
                <td className="p-2">{animal.ubicacion}</td>
                <td className="p-2 text-center flex gap-2 justify-center">
                  <button
                    onClick={() => alert(JSON.stringify(animal, null, 2))}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    title="Ver"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(animal.id)}
                    className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(animal.id)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
