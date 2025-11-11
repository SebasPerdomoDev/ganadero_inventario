"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface InventarioItem {
  id: string;
  nombre: string;
  cantidad: number;
  marca: string;
  vencimiento: string;
  lote: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventarioItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [restockAmount, setRestockAmount] = useState<string>("");
  const [editingItem, setEditingItem] = useState<InventarioItem | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    cantidad: "",
    marca: "",
    lote: "",
  });

  const [vencimiento, setVencimiento] = useState<Date | undefined>();
  const [openVencimiento, setOpenVencimiento] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  //  Evita errores de hidratación
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = useMemo(() => new Date(), []);

  // =========================
//  📦 CARGAR INVENTARIO (fix IDs)
// =========================
const fetchInventory = async () => {
  const { data, error } = await supabase
    .from("inventario")
    .select("id, nombre, cantidad, marca, vencimiento, lote");

  if (error) {
    console.error("❌ Error al cargar inventario:", error);
    toast.error("Error al cargar inventario.");
    return;
  }

  if (!data || data.length === 0) {
    console.log("⚠️ No hay registros en inventario aún.");
    setInventory([]);
    return;
  }

  // 🔧 Normaliza campos y fuerza el id
  const normalized = data.map((item: any) => ({
    id: item.id ?? item.Id ?? item.ID ?? "",
    nombre: item.nombre ?? "",
    cantidad: item.cantidad ?? 0,
    marca: item.marca ?? "",
    vencimiento: item.vencimiento ?? "",
    lote: item.lote ?? "",
  }));

  console.table(normalized); // ✅ Muestra los IDs reales
  setInventory(normalized);
};

  // =========================
  //  AGREGAR NUEVO PRODUCTO
  // =========================
  const handleAddItem = async () => {
    if (!formData.nombre || !formData.cantidad) {
      toast.error("Por favor, complete todos los campos obligatorios.");
      return;
    }

    if (vencimiento && vencimiento.getTime() < today.setHours(0, 0, 0, 0)) {
      toast.error(" La fecha de vencimiento no puede ser menor al día de hoy.");
      return;
    }

    const { error } = await supabase.from("inventario").insert([
      {
        nombre: formData.nombre,
        cantidad: parseFloat(formData.cantidad),
        marca: formData.marca || null,
        // Evita desfase UTC
        vencimiento: vencimiento ? vencimiento.toISOString().split("T")[0] : null,
        lote: formData.lote || null,
      },
    ]);

    if (error) {
      toast.error(" Error al agregar producto.");
      console.error(error);
    } else {
      toast.success(" Producto agregado exitosamente.");
      resetForm();
      fetchInventory();
      setIsDialogOpen(false);
    }
  };

  // =========================
  // ✏️ EDITAR PRODUCTO
  // =========================
  const handleEditItem = (item: InventarioItem) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      cantidad: item.cantidad.toString(),
      marca: item.marca || "",
      lote: item.lote || "",
    });
    setVencimiento(item.vencimiento ? new Date(item.vencimiento + "T00:00:00") : undefined);
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    if (!formData.nombre || !formData.cantidad) {
      toast.error("Por favor, complete todos los campos obligatorios.");
      return;
    }

    if (vencimiento && vencimiento.getTime() < today.setHours(0, 0, 0, 0)) {
      toast.error(" La fecha de vencimiento no puede ser menor al día de hoy.");
      return;
    }

    const { error } = await supabase
      .from("inventario")
      .update({
        nombre: formData.nombre,
        cantidad: parseFloat(formData.cantidad),
        marca: formData.marca || null,
        // ✅ Evita desfase UTC
        vencimiento: vencimiento ? vencimiento.toISOString().split("T")[0] : null,
        lote: formData.lote || null,
      })
      .eq("id", editingItem.id);

    if (error) {
      console.error(error);
      toast.error(" Error al actualizar producto.");
    } else {
      toast.success(" Producto actualizado correctamente.");
      resetForm();
      setIsEditDialogOpen(false);
      fetchInventory();
    }
  };
// =========================
// 🗑️ ELIMINAR PRODUCTO (UUID FIX)
// =========================
const handleDeleteItem = async (id: string) => {
  console.log("🧠 ID recibido para eliminar:", JSON.stringify(id));

  const confirmDelete = confirm("¿Seguro que deseas eliminar este producto?");
  if (!confirmDelete) return;

  // Limpia comillas accidentales y espacios
  const cleanId = id.trim().replace(/^"|"$/g, "");

  // 🔍 Verificación previa opcional (puedes quitar si quieres)
  const { data: found, error: selectError } = await supabase
    .from("inventario")
    .select("id")
    .eq("id", cleanId);

  console.log("🔍 Resultado test select:", found, selectError);

  if (!found || found.length === 0) {
    toast.error("⚠️ No se encontró el producto a eliminar (ID no existe).");
    return;
  }

  // 🧹 Eliminar producto (versión estable sin returning)
  const { error: deleteError } = await supabase
    .from("inventario")
    .delete()
    .eq("id", cleanId);

  if (deleteError) {
    console.error("❌ Error al eliminar producto:", deleteError);
    toast.error("Error al eliminar producto.");
    return;
  }

  toast.success("🗑️ Producto eliminado correctamente.");
  fetchInventory(); // 🔄 refresca lista
};



  // =========================
  //  REABASTECER PRODUCTO
  // =========================
  const handleRestock = async () => {
    const restockKg = parseFloat(restockAmount);

    if (!selectedProductId || isNaN(restockKg) || restockKg <= 0) {
      toast.error("Seleccione un producto y escriba una cantidad válida mayor a 0.");
      return;
    }

    const product = inventory.find((item) => item.id === selectedProductId);
    if (!product) {
      toast.error("Producto no encontrado.");
      return;
    }

    const nuevaCantidad = product.cantidad + restockKg;

    const { error } = await supabase
      .from("inventario")
      .update({ cantidad: nuevaCantidad })
      .eq("id", product.id);

    if (error) {
      toast.error(" Error al reabastecer producto.");
      console.error(error);
    } else {
      toast.success(" Producto reabastecido correctamente.");
      setIsRestockDialogOpen(false);
      setSelectedProductId("");
      setRestockAmount("");
      fetchInventory();
    }
  };

  const resetForm = () => {
    setFormData({ nombre: "", cantidad: "", marca: "", lote: "" });
    setVencimiento(undefined);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredInventory = inventory
    .filter((item) =>
      item.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) =>
      sortOrder === "asc" ? a.cantidad - b.cantidad : b.cantidad - a.cantidad
    );

  // =========================
  //  INTERFAZ
  // =========================
  return (
    <div className="space-y-6 mx-auto w-full max-w-7xl min-h-full">
      {/* Barra de acciones */}
      <div className="flex justify-end items-center">
        <div className="flex gap-2">
          <Button onClick={() => setIsDialogOpen(true)}>+ Agregar Producto</Button>
          <Button variant="outline" onClick={() => setIsRestockDialogOpen(true)}>
            🔄 Reabastecer
          </Button>
        </div>
      </div>

      {/* Buscador y orden */}
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Buscar por nombre"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-1/2"
        />

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Ordenar por cantidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Menor a mayor</SelectItem>
            <SelectItem value="desc">Mayor a menor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-md p-4 rounded-lg max-h-[500px] overflow-x-auto overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-gray-100">
            <tr className="border-b">
              <th className="px-4 py-2">Tipo de Alimento</th>
              <th className="px-4 py-2">Cantidad (kg)</th>
              <th className="px-4 py-2">Marca</th>
              <th className="px-4 py-2">Fecha de Vencimiento</th>
              <th className="px-4 py-2">Lote</th>
              <th className="px-4 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-3 text-gray-500">
                  No hay productos registrados 🧺
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-4 py-2">{item.nombre}</td>
                  <td className="px-4 py-2 font-bold">{item.cantidad}</td>
                  <td className="px-4 py-2">{item.marca}</td>
                  <td className="px-4 py-2">
                    {/*  Sin desfase horario */}
                    {item.vencimiento
                      ? new Date(item.vencimiento + "T00:00:00").toLocaleDateString("es-CO")
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{item.lote}</td>
                  <td className="px-4 py-2 text-center flex gap-3 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditItem(item)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        console.log("🧩 ID del producto a eliminar (frontend):", JSON.stringify(item.id));
                        handleDeleteItem(item.id);
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Formularios reusables */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
            <DialogDescription>Ingrese la información del nuevo alimento.</DialogDescription>
          </DialogHeader>
          {renderForm(handleAddItem)}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>Modifica la información del producto seleccionado.</DialogDescription>
          </DialogHeader>
          {renderForm(handleUpdateItem)}
        </DialogContent>
      </Dialog>

      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabastecer Producto</DialogTitle>
            <DialogDescription>Seleccione un producto y una cantidad en kg para reabastecer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {inventory.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nombre} — {item.cantidad} kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Cantidad a añadir (Kg)"
              value={restockAmount}
              onChange={(e) => setRestockAmount(e.target.value)}
              min="0"
            />
            <Button className="w-full" onClick={handleRestock}>
              Confirmar Reabastecimiento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // =========================
  // 📦 Formulario reusado
  // =========================
  function renderForm(onSubmit: () => void) {
    return (
      <div className="space-y-4">
        <Select
          value={formData.nombre}
          onValueChange={(value) => setFormData({ ...formData, nombre: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tipo de alimento" />
          </SelectTrigger>
          <SelectContent>
            {[
              "45% HARINA",
              "45% INICIACION",
              "38% 1.8 mm",
              "34% 3 mm",
              "32% 2.5 mm",
              "32% 3.5 mm",
              "32% 4.7 mm",
              "28% 4.7 mm",
            ].map((tipo) => (
              <SelectItem key={tipo} value={tipo}>
                {tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Cantidad (kg)"
          name="cantidad"
          value={formData.cantidad}
          onChange={handleInputChange}
          min="0"
        />
        <Input
          placeholder="Marca"
          name="marca"
          value={formData.marca}
          onChange={handleInputChange}
        />

        {/* ✅ Calendario sin desfase */}
        <div className="flex flex-col gap-2">
          <label className="block mb-1 font-medium text-gray-700 text-sm">
            Fecha de Vencimiento
          </label>
          {mounted ? (
            <Popover open={openVencimiento} onOpenChange={setOpenVencimiento}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start w-full font-normal text-left">
                  <CalendarIcon className="mr-2 w-4 h-4" />
                  {vencimiento ? format(vencimiento, "yyyy-MM-dd") : "Selecciona fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Calendar
                  mode="single"
                  selected={vencimiento}
                  onSelect={(date) => {
                    if (date) {
                      // 🔧 fuerza fecha sin hora
                      const fixed = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      setVencimiento(fixed);
                    }
                    setOpenVencimiento(false);
                  }}
                  disabled={(date) => date < today}
                  captionLayout="dropdown"
                  fromYear={2024}
                  toYear={2035}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Button variant="outline" className="justify-start w-full font-normal text-left">
              <CalendarIcon className="mr-2 w-4 h-4" />
              Cargando calendario...
            </Button>
          )}
        </div>

        <Input
          placeholder="Lote"
          name="lote"
          value={formData.lote}
          onChange={handleInputChange}
        />
        <Button className="w-full" onClick={onSubmit}>
          Guardar
        </Button>
      </div>
    );
  }
}
