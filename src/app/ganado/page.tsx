
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toast from "react-hot-toast";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // Estados modales
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(
    null
  );

  // Estado para edición
  const [form, setForm] = useState<Partial<Animal>>({});

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

  // 🔹 Abrir modal de edición
  const handleEdit = (animal: Animal) => {
    setAnimalSeleccionado(animal);
    setForm(animal);
    setOpenEdit(true);
  };

  // 🔹 Guardar cambios
  const handleSave = async () => {
    if (!animalSeleccionado) return;

    const { error } = await supabase
      .from("animales")
      .update({
        raza: form.raza,
        peso: form.peso,
        estado_salud: form.estado_salud,
        ubicacion: form.ubicacion,
        observacion: form.observacion,
      })
      .eq("id", animalSeleccionado.id);

    if (error) {
      toast.error("❌ No se pudo actualizar el animal");
    } else {
      setAnimales((prev) =>
        prev.map((a) =>
          a.id === animalSeleccionado.id ? { ...a, ...form } as Animal : a
        )
      );
      setOpenEdit(false);
      toast.success("✅ Animal actualizado correctamente");
    }
  };

  // 🔹 Eliminar registro
  const handleDelete = async () => {
    if (!animalSeleccionado) return;

    const { error } = await supabase
      .from("animales")
      .delete()
      .eq("id", animalSeleccionado.id);

    if (error) {
      toast.error("❌ No se pudo eliminar el animal");
    } else {
      setAnimales(animales.filter((a) => a.id !== animalSeleccionado.id));
      setOpenDelete(false);
      toast.success("🗑️ Animal eliminado correctamente");
    }
  };

  if (loading) return <p className="text-center">Cargando...</p>;

  return (
    <div className="mt-10">
      <h2 className="mb-4 font-bold text-cyan-700 text-2xl">
        Animales Registrados
      </h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Raza</TableHead>
            <TableHead>Peso (kg)</TableHead>
            <TableHead>Sexo</TableHead>
            <TableHead>Estado Salud</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
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
                <TableCell className="flex justify-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setAnimalSeleccionado(animal);
                      setOpenView(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleEdit(animal)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => {
                      setAnimalSeleccionado(animal);
                      setOpenDelete(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* 🔹 Modal Observaciones */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observaciones</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p>
              {animalSeleccionado?.observacion
                ? animalSeleccionado.observacion
                : "No hay observaciones registradas para este animal."}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔹 Modal Editar */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Animal</DialogTitle>
          </DialogHeader>

          <div className="gap-4 grid py-4">
            {/* Raza */}
            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Raza</Label>
              <div className="col-span-3">
                <Select
                  value={form.raza || ""}
                  onValueChange={(value) => setForm({ ...form, raza: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona raza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holstein">Holstein</SelectItem>
                    <SelectItem value="brahman">Brahman</SelectItem>
                    <SelectItem value="angus">Angus</SelectItem>
                    <SelectItem value="simmental">Simmental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Peso */}
            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Peso (kg)</Label>
              <Input
                type="number"
                value={form.peso || ""}
                onChange={(e) => setForm({ ...form, peso: parseFloat(e.target.value) })}
                className="col-span-3"
              />
            </div>

            {/* Estado de Salud */}
            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Estado de Salud</Label>
              <div className="col-span-3">
                <Select
                  value={form.estado_salud || ""}
                  onValueChange={(value) => setForm({ ...form, estado_salud: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona estado de salud" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saludable">Saludable</SelectItem>
                    <SelectItem value="enfermo">Enfermo</SelectItem>
                    <SelectItem value="tratamiento">En tratamiento</SelectItem>

                  </SelectContent>
                </Select>
              </div>
            </div>


            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Ubicación</Label>
              <Select
                value={form.ubicacion || ""}
                onValueChange={(value) => setForm({ ...form, ubicacion: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccione ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="potrero1">Potrero 1</SelectItem>
                  <SelectItem value="potrero2">Potrero 2</SelectItem>
                  <SelectItem value="potrero3">Potrero 3</SelectItem>
                  <SelectItem value="potrero4">Potrero 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observación */}
            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Observación</Label>
              <Input
                value={form.observacion || ""}
                onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔹 Modal Confirmación de Borrado */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p>
            ¿Seguro que deseas eliminar el animal{" "}
            <strong>{animalSeleccionado?.codigo_identificacion}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

