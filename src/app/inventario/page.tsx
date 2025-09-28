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
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// ✅ CAMBIO 1: id como string (UUID)
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
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [restockAmount, setRestockAmount] = useState<string>("");

  const [formData, setFormData] = useState({
    nombre: "",

    cantidad: "",
    marca: "",
    vencimiento: "",
    lote: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchInventory = async () => {
    const { data, error } = await supabase.from("inventario").select("*");
    if (error) {
      console.error("Error al cargar inventario", error);
      toast.error("Error al cargar inventario.");
    } else {
      setInventory(data as InventarioItem[]);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async () => {
    if (!formData.nombre || !formData.cantidad) {
      toast.error("Por favor, complete todos los campos obligatorios.");
      return;
    }

    const { error } = await supabase.from("inventario").insert([
      {
        nombre: formData.nombre,

        cantidad: parseFloat(formData.cantidad),
        marca: formData.marca,
        vencimiento: formData.vencimiento,
        lote: formData.lote,
      },
    ]);

    if (error) {
      console.error("Error al agregar producto", error);
      toast.error("Error al agregar producto.");
    } else {
      toast.success("Producto agregado exitosamente.");
      setFormData({
        nombre: "",

        cantidad: "",
        marca: "",
        vencimiento: "",
        lote: "",
      });
      setIsDialogOpen(false);
      fetchInventory();
    }
  };

  const handleRestock = async () => {
    console.log("🔁 Reabastecimiento iniciado");
    console.log("👉 selectedProductId:", selectedProductId);
    console.log("👉 restockAmount:", restockAmount);

    const restockKg = parseFloat(restockAmount);

    if (!selectedProductId || isNaN(restockKg) || restockKg <= 0) {
      toast.error("Seleccione un producto y escriba una cantidad válida mayor a 0.");
      return;
    }

    // ✅ CAMBIO 2: comparar UUID como string
    const product = inventory.find((item) => item.id === selectedProductId);

    if (!product) {
      console.log("⛔ Producto no encontrado. IDs disponibles:", inventory.map(i => i.id));
      toast.error("Producto no encontrado.");
      return;
    }

    const nuevaCantidad = product.cantidad + restockKg;

    const { error } = await supabase
      .from("inventario")
      .update({ cantidad: nuevaCantidad })
      .eq("id", product.id);

    if (error) {
      console.error("Error al reabastecer producto", error);
      toast.error("Error al reabastecer.");
    } else {
      toast.success("Producto reabastecido exitosamente.");
      setIsRestockDialogOpen(false);
      setSelectedProductId("");
      setRestockAmount("");
      fetchInventory();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const filteredInventory = inventory
    .filter((item) =>
      item.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) =>
      sortOrder === "asc" ? a.cantidad - b.cantidad : b.cantidad - a.cantidad
    );

  return (
    <div className="space-y-6 mx-auto w-full max-w-7xl min-h-full">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-2xl">Gestión de Inventario</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsDialogOpen(true)}>+ Agregar Producto</Button>
          <Button variant="outline" onClick={() => setIsRestockDialogOpen(true)}>🔄 Reabastecer</Button>
        </div>
      </div>

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

      <div className="bg-white shadow-md p-4 rounded-lg max-h-[500px] overflow-x-auto overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="top-[-20px] z-10 sticky bg-gray-100">
            <tr className="border-b">
              <th className="px-4 py-2">Tipo de Alimento</th>

              <th className="px-4 py-2">Cantidad (kg)</th>
              <th className="px-4 py-2">Marca</th>
              <th className="px-4 py-2">Fecha de Vencimiento</th>
              <th className="px-4 py-2">Lote</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="px-4 py-2">{item.nombre}</td>
                <td className="px-4 py-2 font-bold">{item.cantidad}</td>
                <td className="px-4 py-2">{item.marca}</td>
                <td className="px-4 py-2">{item.vencimiento}</td>
                <td className="px-4 py-2">{item.lote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Agregar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
            <DialogDescription>Ingrese la información del nuevo alimento.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={formData.nombre} onValueChange={(value) => setFormData({ ...formData, nombre: value })}>
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

            <Input placeholder="Cantidad (kg)" name="cantidad" value={formData.cantidad} onChange={handleInputChange} />
            <Input placeholder="Marca" name="marca" value={formData.marca} onChange={handleInputChange} />
            <Input placeholder="Fecha de Vencimiento" name="vencimiento" value={formData.vencimiento} onChange={handleInputChange} />
            <Input placeholder="Lote" name="lote" value={formData.lote} onChange={handleInputChange} />
            <Button className="w-full" onClick={handleAddItem}>Agregar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Reabastecer */}
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
                    {item.nombre} — {item.cantidad}kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Cantidad a añadir (Kg)"
              value={restockAmount}
              onChange={(e) => setRestockAmount(e.target.value)}
            />

            <Button className="w-full" onClick={handleRestock}>
              Confirmar Reabastecimiento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
