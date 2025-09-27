
"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Animal = {
  id: number;
  codigo_identificacion: string;
  raza: string;
  peso: number;
  sexo: string;
  fecha_nacimiento: string | null;
  fecha_ultimo_chequeo: string | null;
  estado_salud: string;
  ubicacion: string;
  observacion: string | null;
};

export default function AnimalesTable() {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar registros
  useEffect(() => {
    const fetchAnimales = async () => {
      const { data, error } = await supabase.from("animales").select("*");
      if (error) {
        console.error("Error cargando animales:", error.message);
      } else {
        setAnimales(data as Animal[]);
      }
      setLoading(false);
    };

    fetchAnimales();
  }, []);

  // 🔹 Eliminar registro
  const handleDelete = async (codigo_animal: number) => {
    if (!confirm("¿Seguro que quieres eliminar este animal?")) return;

    const { error } = await supabase.from("animales").delete().eq("id", codigo_identificacion);
    if (error) {
      console.error("Error eliminando:", error.message);
    } else {
      setAnimales(animales.filter((a) => a.codigo_identificacion !== codigo_identificacion));
    }
  };

  // 🔹 Editar (placeholder)
  const handleEdit = (id: number) => {
    alert(`Editar animal con ID interno: ${id} `);
    // Aquí abrirías un modal o redirigirías a un form de edición
  };

  if (loading) return <p className="text-center">Cargando...</p>;

  return (
    <div className="mt-10">
      <h2 className="mb-4 font-bold text-cyan-700 text-2xl">Animales Registrados</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Raza</TableHead>
            <TableHead>Peso (kg)</TableHead>
            <TableHead>Sexo</TableHead>
            <TableHead>Estado Salud</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {animales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-gray-500 text-center">
                No hay registros de animales aún 🐄
              </TableCell>
            </TableRow>
          ) : (
            animales.map((animal) => (
              <TableRow key={animal.id}>
                <TableCell>{animal.codigo_identificacion}</TableCell>
                <TableCell>{animal.raza}</TableCell>
                <TableCell>{animal.peso}</TableCell>
                <TableCell className="capitalize">{animal.sexo}</TableCell>
                <TableCell>{animal.estado_salud}</TableCell>
                <TableCell>{animal.ubicacion}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => alert(JSON.stringify(animal, null, 2))}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(animal.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(animal.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

