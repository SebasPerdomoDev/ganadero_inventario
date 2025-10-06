"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Eye, Trash2 } from "lucide-react";

// Definición del tipo Animal
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
  // ===== Estados principales =====
  const [animales, setAnimales] = useState<Animal[]>([]); // Todos los animales cargados
  const [animalesFiltrados, setAnimalesFiltrados] = useState<Animal[]>([]); // Animales después de aplicar filtros
  const [loading, setLoading] = useState(true); // Estado de carga

  // ===== Modales y selección =====
  const [openView, setOpenView] = useState(false); // Modal de observaciones
  const [openEdit, setOpenEdit] = useState(false); // Modal de edición
  const [openDelete, setOpenDelete] = useState(false); // Modal de eliminación
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(null); // Animal actualmente seleccionado

  // ===== Formulario de edición =====
  const [form, setForm] = useState<Partial<Animal>>({}); // Estado parcial del formulario para editar

  // ===== Filtros =====
  const [buscarCodigo, setBuscarCodigo] = useState(""); // Filtro por código de identificación
  const [filtroSexo, setFiltroSexo] = useState("todos"); // Filtro por sexo
  const [filtroRaza, setFiltroRaza] = useState("todos"); // Filtro por raza
  const [filtroUbicacion, setFiltroUbicacion] = useState("todos"); // Filtro por ubicación
  const [filtroEstadoSalud, setFiltroEstadoSalud] = useState("todos"); // Filtro por estado de salud
  const [ordenPeso, setOrdenPeso] = useState<"ninguno" | "asc" | "desc">("ninguno"); // Orden de peso

  // ===== Paginación =====
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const itemsPerPage = 9; // Número de items por página

  // ===== Cargar animales desde Supabase =====
  useEffect(() => {
    const fetchAnimales = async () => {
      const { data, error } = await supabase
        .from("animales")
        .select("*")
        .order("codigo_identificacion", { ascending: true }); // Orden por código ascendente
      if (error) {
        console.error("Error cargando animales:", error.message);
      } else {
        setAnimales(data as Animal[]);
        setAnimalesFiltrados(data as Animal[]);
      }
      setLoading(false);
    };
    fetchAnimales();
  }, []);

  // ===== Aplicar filtros y orden =====
  useEffect(() => {
    let filtrados = [...animales];

    // Filtrar por código
    if (buscarCodigo)
      filtrados = filtrados.filter(a =>
        a.codigo_identificacion.toString().includes(buscarCodigo)
      );

    // Filtrar por sexo
    if (filtroSexo !== "todos")
      filtrados = filtrados.filter(a => a.sexo === filtroSexo);

    // Filtrar por raza
    if (filtroRaza !== "todos")
      filtrados = filtrados.filter(a => a.raza === filtroRaza);

    // Filtrar por ubicación
    if (filtroUbicacion !== "todos")
      filtrados = filtrados.filter(a => a.ubicacion === filtroUbicacion);

    // Filtrar por estado de salud
    if (filtroEstadoSalud !== "todos")
      filtrados = filtrados.filter(a => a.estado_salud === filtroEstadoSalud);

    // Ordenar por peso
    if (ordenPeso === "asc") filtrados.sort((a, b) => a.peso - b.peso);
    else if (ordenPeso === "desc") filtrados.sort((a, b) => b.peso - a.peso);

    setAnimalesFiltrados(filtrados);
    setCurrentPage(1); // Reiniciar a la primera página
  }, [buscarCodigo, filtroSexo, filtroRaza, ordenPeso, filtroUbicacion, filtroEstadoSalud, animales]);

  // ===== Editar animal =====
  const handleEdit = (animal: Animal) => {
    setAnimalSeleccionado(animal);
    setForm(animal);
    setOpenEdit(true);
  };

  const handleSave = async () => {
    if (!animalSeleccionado) return;
    const { error } = await supabase
      .from("animales")
      .update({
        raza: form.raza,
        peso: form.peso,
        estado_salud: form.estado_salud,
        ubicacion: form.ubicacion,
        sexo: form.sexo,
        observacion: form.observacion,
      })
      .eq("id", animalSeleccionado.id);

    if (error) toast.error("❌ No se pudo actualizar el animal");
    else {
      const updated = { ...animalSeleccionado, ...form } as Animal;
      // Actualizar estados locales
      setAnimales(prev => prev.map(a => (a.id === animalSeleccionado.id ? updated : a)));
      setAnimalesFiltrados(prev => prev.map(a => (a.id === animalSeleccionado.id ? updated : a)));
      setOpenEdit(false);
      toast.success("✅ Animal actualizado correctamente");
    }
  };

  // ===== Borrar animal =====
  const handleDelete = async () => {
    if (!animalSeleccionado) return;
    const { error } = await supabase.from("animales").delete().eq("id", animalSeleccionado.id);
    if (error) toast.error("❌ No se pudo eliminar el animal");
    else {
      // Actualizar estados locales
      setAnimales(prev => prev.filter(a => a.id !== animalSeleccionado.id));
      setAnimalesFiltrados(prev => prev.filter(a => a.id !== animalSeleccionado.id));
      setOpenDelete(false);
      toast.success("🗑️ Animal eliminado correctamente");
    }
  };

  // ===== Paginación =====
  const totalPages = Math.ceil(animalesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const animalesPaginados = animalesFiltrados.slice(startIndex, endIndex);

  if (loading) return <p className="text-center">Cargando...</p>;

  return (
    <div className="mt-5">
      {/* ================= FILTROS ================= */}
      <div className="flex md:flex-row flex-col items-center gap-2 mb-4">
        {/* Filtro por código */}
        <Input
          placeholder="Buscar por Código de identificación"
          value={buscarCodigo}
          onChange={(e) => setBuscarCodigo(e.target.value)}
          className="md:w-1/4"
        />

        <div className="flex flex-row items-center gap-4">
          <Label>Filtrar Sexo | Raza | Peso | Estado Salud | Ubicacion </Label>

          {/* Filtro por sexo */}
          <Select value={filtroSexo} onValueChange={setFiltroSexo}>
            <SelectTrigger><SelectValue placeholder="Sexo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="macho">Macho</SelectItem>
              <SelectItem value="hembra">Hembra</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por raza */}
          <Select value={filtroRaza} onValueChange={setFiltroRaza}>
            <SelectTrigger><SelectValue placeholder="Raza" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="brahman">Brahman</SelectItem>
              <SelectItem value="holstein">Holstein</SelectItem>
              <SelectItem value="angus">Angus</SelectItem>
              <SelectItem value="simmental">Simmental</SelectItem>
              <SelectItem value="gyr">Gyr</SelectItem>
            </SelectContent>
          </Select>

          {/* Orden por peso */}
          <Select value={ordenPeso} onValueChange={value => setOrdenPeso(value as "ninguno" | "asc" | "desc")}>
            <SelectTrigger><SelectValue placeholder="Ordenar peso" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ninguno">Sin ordenar</SelectItem>
              <SelectItem value="asc">Menor a mayor</SelectItem>
              <SelectItem value="desc">Mayor a menor</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por estado de salud */}
          <Select value={filtroEstadoSalud} onValueChange={setFiltroEstadoSalud}>
            <SelectTrigger><SelectValue placeholder="Estado salud" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="saludable">Saludable</SelectItem>
              <SelectItem value="tratamiento">En tratamiento</SelectItem>
              <SelectItem value="enfermo">Enfermo</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por ubicación */}
          <Select value={filtroUbicacion} onValueChange={setFiltroUbicacion}>
            <SelectTrigger><SelectValue placeholder="Ubicación" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="potrero 1">Potrero 1</SelectItem>
              <SelectItem value="potrero 2">Potrero 2</SelectItem>
              <SelectItem value="potrero 3">Potrero 3</SelectItem>
              <SelectItem value="potrero 4">Potrero 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ================= TABLA ================= */}
      <Table>
        <TableHeader className="font-bold text-xl">
          <TableRow>
            <TableHead className="text-center">Código</TableHead>
            <TableHead className="text-center">Raza</TableHead>
            <TableHead className="text-center">Peso (kg)</TableHead>
            <TableHead className="text-center">Sexo</TableHead>
            <TableHead className="text-center">Estado Salud</TableHead>
            <TableHead className="text-center">Ubicación</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-center">
          {animalesPaginados.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-gray-500 text-center">
                No hay registros de animales aún 🐄
              </TableCell>
            </TableRow>
          ) : (
            animalesPaginados.map((animal) => (
              <TableRow className="capitalize" key={animal.id}>
                <TableCell>{animal.codigo_identificacion}</TableCell>
                <TableCell>{animal.raza}</TableCell>
                <TableCell>{animal.peso}</TableCell>
                <TableCell>{animal.sexo}</TableCell>
                <TableCell>{animal.estado_salud}</TableCell>
                <TableCell>{animal.ubicacion}</TableCell>
                <TableCell className="flex justify-center gap-2">
                  {/* Botones de acciones */}
                  <Button size="icon" variant="secondary" onClick={() => { setAnimalSeleccionado(animal); setOpenView(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => handleEdit(animal)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => { setAnimalSeleccionado(animal); setOpenDelete(true); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* ================= PAGINACIÓN ================= */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink isActive={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* ================= MODALES ================= */}

      {/* Modal Observaciones */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Animal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2 capitalize">
            <p>
              <strong>Último Chequeo:</strong>{" "}
              {animalSeleccionado?.fecha_ultimo_chequeo
                ? new Date(animalSeleccionado.fecha_ultimo_chequeo).toLocaleDateString()
                : "No registrado"}
            </p>
            <p>
              <strong>Estado de Salud:</strong>{" "}
              {animalSeleccionado?.estado_salud || "No registrado"}
            </p>
            <p>
              <strong>Observación:</strong>{" "}
              {animalSeleccionado?.observacion || "No hay observaciones registradas para este animal."}
            </p>
          </div>
        </DialogContent>
      </Dialog>



      {/* Modal Editar */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Animal</DialogTitle>
          </DialogHeader>
          <div className="gap-4 grid py-4">
            {/* Campos del formulario de edición */}
            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Raza</Label>
              <Select
                value={form.raza || ""}
                onValueChange={(value) => setForm({ ...form, raza: value })}
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder="Selecciona raza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brahman">Brahman</SelectItem>
                  <SelectItem value="holstein">Holstein</SelectItem>
                  <SelectItem value="angus">Angus</SelectItem>
                  <SelectItem value="simmental">Simmental</SelectItem>
                  <SelectItem value="gyr">Gyr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Sexo</Label>
              <Select
                value={form.sexo || ""}
                onValueChange={(value) => setForm({ ...form, sexo: value })}
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder="Selecciona sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Peso (kg)</Label>
              <Input
                type="number"
                value={form.peso || ""}
                onChange={(e) =>
                  setForm({ ...form, peso: parseFloat(e.target.value) })
                }
                className="col-span-3"
              />
            </div>

            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Estado Salud</Label>
              <Select
                value={form.estado_salud || ""}
                onValueChange={(value) => setForm({ ...form, estado_salud: value })}
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saludable">Saludable</SelectItem>
                  <SelectItem value="tratamiento">En tratamiento</SelectItem>
                  <SelectItem value="enfermo">Enfermo</SelectItem>
                </SelectContent>
              </Select>
            </div>



            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Ubicación</Label>
              <Select
                value={form.ubicacion || ""}
                onValueChange={(value) => setForm({ ...form, ubicacion: value })}
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder="Seleccione ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="potrero 1">Potrero 1</SelectItem>
                  <SelectItem value="potrero 2">Potrero 2</SelectItem>
                  <SelectItem value="potrero 3">Potrero 3</SelectItem>
                  <SelectItem value="potrero 4">Potrero 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Fecha último chequeo */}
            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Último Chequeo</Label>
              <Input
                type="date"
                value={
                  form.fecha_ultimo_chequeo
                    ? new Date(form.fecha_ultimo_chequeo).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setForm({ ...form, fecha_ultimo_chequeo: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Observación</Label>
              <Input
                value={form.observacion || ""}
                onChange={(e) =>
                  setForm({ ...form, observacion: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Modal Eliminar */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p>¿Seguro que deseas eliminar el animal <strong>{animalSeleccionado?.codigo_identificacion}</strong>?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenDelete(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
