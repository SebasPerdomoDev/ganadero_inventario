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
  const [animalesFiltrados, setAnimalesFiltrados] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(null);

  const [form, setForm] = useState<Partial<Animal>>({});

  // Filtros
  const [buscarCodigo, setBuscarCodigo] = useState("");
  const [filtroSexo, setFiltroSexo] = useState("todos");
  const [filtroRaza, setFiltroRaza] = useState("todos");
  const [filtroUbicacion, setFiltroUbicacion] = useState("todos");
  const [filtroEstadoSalud, setFiltroEstadoSalud] = useState("todos");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Cargar animales
  useEffect(() => {
    const fetchAnimales = async () => {
      const { data, error } = await supabase
        .from("animales")
        .select("*")
        .order("codigo_identificacion", { ascending: true });
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

  // Filtrar
  useEffect(() => {
    let filtrados = [...animales];
    if (buscarCodigo) filtrados = filtrados.filter(a => a.codigo_identificacion.toLowerCase().includes(buscarCodigo.toLowerCase()));
    if (filtroSexo !== "todos") filtrados = filtrados.filter(a => a.sexo === filtroSexo);
    if (filtroRaza !== "todos") filtrados = filtrados.filter(a => a.raza === filtroRaza);
    if (filtroUbicacion !== "todos") filtrados = filtrados.filter(a => a.ubicacion === filtroUbicacion);
    if (filtroEstadoSalud !== "todos") filtrados = filtrados.filter(a => a.estado_salud === filtroEstadoSalud);
    setAnimalesFiltrados(filtrados);
    setCurrentPage(1);
  }, [buscarCodigo, filtroSexo, filtroRaza, filtroUbicacion, filtroEstadoSalud, animales]);

  // Editar
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
      setAnimales(prev => prev.map(a => (a.id === animalSeleccionado.id ? updated : a)));
      setAnimalesFiltrados(prev => prev.map(a => (a.id === animalSeleccionado.id ? updated : a)));
      setOpenEdit(false);
      toast.success("✅ Animal actualizado correctamente");
    }
  };

  // Borrar
  const handleDelete = async () => {
    if (!animalSeleccionado) return;
    const { error } = await supabase.from("animales").delete().eq("id", animalSeleccionado.id);
    if (error) toast.error("❌ No se pudo eliminar el animal");
    else {
      setAnimales(prev => prev.filter(a => a.id !== animalSeleccionado.id));
      setAnimalesFiltrados(prev => prev.filter(a => a.id !== animalSeleccionado.id));
      setOpenDelete(false);
      toast.success("🗑️ Animal eliminado correctamente");
    }
  };

  // Paginación
  const totalPages = Math.ceil(animalesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const animalesPaginados = animalesFiltrados.slice(startIndex, endIndex);

  if (loading) return <p className="text-center">Cargando...</p>;

  return (
    <div className="mt-5">
      {/* Filtros */}
      <div className="flex md:flex-row flex-col items-center gap-2 mb-4">
        <Input
          placeholder="Buscar por ID"
          value={buscarCodigo}
          onChange={(e) => setBuscarCodigo(e.target.value)}
          className="md:w-1/4"
        />
        <div className="flex flex-row items-center gap-4">
          <Label>Filtros:</Label>
          <Select value={filtroSexo} onValueChange={setFiltroSexo}>
            <SelectTrigger><SelectValue placeholder="Sexo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="macho">Macho</SelectItem>
              <SelectItem value="hembra">Hembra</SelectItem>
            </SelectContent>
          </Select>
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
          <Select value={filtroEstadoSalud} onValueChange={setFiltroEstadoSalud}>
            <SelectTrigger><SelectValue placeholder="Estado salud" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="saludable">Saludable</SelectItem>
              <SelectItem value="tratamiento">En tratamiento</SelectItem>
              <SelectItem value="enfermo">Enfermo</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Tabla */}
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
              <TableRow key={animal.id}>
                <TableCell>{animal.codigo_identificacion}</TableCell>
                <TableCell>{animal.raza}</TableCell>
                <TableCell>{animal.peso}</TableCell>
                <TableCell>{animal.sexo}</TableCell>
                <TableCell>{animal.estado_salud}</TableCell>
                <TableCell>{animal.ubicacion}</TableCell>
                <TableCell className="flex justify-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => { setAnimalSeleccionado(animal); setOpenView(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={() => handleEdit(animal)}>
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

      {/* Paginación */}
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

      {/* Observaciones */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observaciones</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p>{animalSeleccionado?.observacion || "No hay observaciones registradas para este animal."}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Animal</DialogTitle>
          </DialogHeader>
          <div className="gap-4 grid py-4">
            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Raza</Label>
              <Select value={form.raza || "brahman"} onValueChange={value => setForm({ ...form, raza: value })} className="col-span-3">
                <SelectTrigger><SelectValue placeholder="Selecciona raza" /></SelectTrigger>
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
              <Select value={form.sexo || "macho"} onValueChange={value => setForm({ ...form, sexo: value })} className="col-span-3">
                <SelectTrigger><SelectValue placeholder="Selecciona sexo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Peso (kg)</Label>
              <Input type="number" value={form.peso || 0} onChange={e => setForm({ ...form, peso: parseFloat(e.target.value) })} className="col-span-3" />
            </div>
            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Estado Salud</Label>
              <Select value={form.estado_salud || "saludable"} onValueChange={value => setForm({ ...form, estado_salud: value })} className="col-span-3">
                <SelectTrigger><SelectValue placeholder="Selecciona estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="saludable">Saludable</SelectItem>
                  <SelectItem value="tratamiento">En tratamiento</SelectItem>
                  <SelectItem value="enfermo">Enfermo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Ubicación</Label>
              <Select value={form.ubicacion || "potrero 1"} onValueChange={value => setForm({ ...form, ubicacion: value })} className="col-span-3">
                <SelectTrigger><SelectValue placeholder="Seleccione ubicación" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="potrero 1">Potrero 1</SelectItem>
                  <SelectItem value="potrero 2">Potrero 2</SelectItem>
                  <SelectItem value="potrero 3">Potrero 3</SelectItem>
                  <SelectItem value="potrero 4">Potrero 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="items-center gap-2 grid grid-cols-4">
              <Label className="text-right">Observación</Label>
              <Input value={form.observacion || ""} onChange={e => setForm({ ...form, observacion: e.target.value })} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
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
