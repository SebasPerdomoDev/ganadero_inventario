"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

interface InventoryItem {
  id: string;
  nombre: string;
  cantidad: number;
}

interface FeedingLog {
  id: string;
  fecha: string;
  ubicacion: string;
  alimento_id: string;
  alimento_nombre: string;
  cantidad: number;
}

export default function FeedingLogsPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>([]);
  const [ubicaciones, setUbicaciones] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    ubicacion: "",
    alimento_id: "",
    cantidad: "",
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<FeedingLog | null>(null);

  // =============================
  // 📦 Cargar datos iniciales
  // =============================
  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("inventario")
      .select("id, nombre, cantidad");
    if (!error && data) setInventory(data);
  };

  const fetchUbicaciones = async () => {
    const { data, error } = await supabase.from("animales").select("ubicacion");
    if (error) {
      toast.error("Error al cargar ubicaciones desde animales.");
      return;
    }

    const uniqueUbicaciones = Array.from(
      new Set((data || []).map((a) => a.ubicacion).filter(Boolean))
    );
    setUbicaciones(uniqueUbicaciones);
  };

  const fetchFeedingLogs = async () => {
    const { data, error } = await supabase
      .from("alimentaciones")
      .select(
        "id, fecha, cantidad, ubicacion, inventario:alimento_id (id, nombre)"
      )
      .order("fecha", { ascending: false });

    if (!error && data) {
      const formattedLogs = data.map((log: any) => ({
        id: log.id,
        fecha: new Date(log.fecha + "T00:00:00").toLocaleDateString("es-CO"),
        ubicacion: log.ubicacion,
        alimento_id: log.inventario?.id,
        alimento_nombre: log.inventario?.nombre,
        cantidad: log.cantidad,
      }));
      setFeedingLogs(formattedLogs);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchUbicaciones();
    fetchFeedingLogs();
  }, []);

  // =============================
  // 🐟 Registrar alimentación
  // =============================
  const handleRegisterFeeding = async () => {
    if (!formData.ubicacion || !formData.alimento_id || !formData.cantidad) {
      toast.error("Por favor, complete todos los campos.");
      return;
    }

    const cantidad = parseFloat(formData.cantidad);
    const selectedItem = inventory.find(
      (item) => item.id === formData.alimento_id
    );
    if (!selectedItem) return toast.error("El alimento no existe.");

    if (selectedItem.cantidad < cantidad)
      return toast.error("No hay suficiente cantidad disponible.");

    const { error } = await supabase.from("alimentaciones").insert([
      {
        ubicacion: formData.ubicacion,
        alimento_id: formData.alimento_id,
        cantidad,
        fecha: new Date().toISOString().split("T")[0],
      },
    ]);

    if (error) return toast.error("Error al registrar alimentación.");

    await supabase
      .from("inventario")
      .update({ cantidad: selectedItem.cantidad - cantidad })
      .eq("id", selectedItem.id);

    toast.success("✅ Alimentación registrada.");
    setFormData({ ubicacion: "", alimento_id: "", cantidad: "" });
    fetchInventory();
    fetchFeedingLogs();
  };

  // =============================
  // ✏️ Editar alimentación
  // =============================
  const handleEdit = (log: FeedingLog) => {
    setEditingLog(log);
    setFormData({
      ubicacion: log.ubicacion,
      alimento_id: log.alimento_id,
      cantidad: log.cantidad.toString(),
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingLog) return;

    const cantidad = parseFloat(formData.cantidad);
    if (!formData.ubicacion || !formData.alimento_id || !cantidad)
      return toast.error("Complete todos los campos.");

    const { error } = await supabase
      .from("alimentaciones")
      .update({
        ubicacion: formData.ubicacion,
        alimento_id: formData.alimento_id,
        cantidad,
      })
      .eq("id", editingLog.id);

    if (error) {
      toast.error("Error al actualizar alimentación.");
      return;
    }

    toast.success("✅ Alimentación actualizada.");
    setIsEditOpen(false);
    setEditingLog(null);
    fetchFeedingLogs();
  };

  // =============================
  // 🗑️ Eliminar alimentación
  // =============================
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("¿Seguro que deseas eliminar este registro?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("alimentaciones").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar alimentación.");
    } else {
      toast.success("🗑️ Registro eliminado correctamente.");
      fetchFeedingLogs();
    }
  };

  // =============================
  // 🧱 Render UI
  // =============================
  return (
    <div className="flex h-screen w-full gap-8 p-8">
      {/* Formulario */}
      <Card className="w-1/3 h-fit">
        <CardHeader>
          <CardTitle>Registrar Alimentación</CardTitle>
          <span className="text-sm text-muted-foreground">
            Registra una nueva sesión de alimentación.
          </span>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Ubicación */}
          <Select
            value={formData.ubicacion}
            onValueChange={(value) =>
              setFormData({ ...formData, ubicacion: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione la ubicación" />
            </SelectTrigger>
            <SelectContent>
              {ubicaciones.map((u, i) => (
                <SelectItem key={i} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Alimento */}
          <Select
            value={formData.alimento_id}
            onValueChange={(value) =>
              setFormData({ ...formData, alimento_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione el alimento" />
            </SelectTrigger>
            <SelectContent>
              {inventory.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.nombre} ({item.cantidad} kg)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Cantidad */}
          <Input
            placeholder="Cantidad (kg)"
            value={formData.cantidad}
            onChange={(e) =>
              setFormData({ ...formData, cantidad: e.target.value })
            }
          />

          <Button className="w-full" onClick={handleRegisterFeeding}>
            Registrar Alimentación
          </Button>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card className="flex-1 h-fit">
        <CardHeader>
          <CardTitle>Historial de Alimentación</CardTitle>
          <span className="text-sm text-muted-foreground">
            Actividad reciente
          </span>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead className="bg-gray-100">
              <tr className="border-b">
                <th className="py-2 px-4">Fecha</th>
                <th className="py-2 px-4">Ubicación</th>
                <th className="py-2 px-4">Alimento</th>
                <th className="py-2 px-4">Cantidad (kg)</th>
                <th className="py-2 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {feedingLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-gray-500 italic">
                    No hay alimentaciones registradas 🍽️
                  </td>
                </tr>
              ) : (
                feedingLogs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="py-2 px-4">{log.fecha}</td>
                    <td className="py-2 px-4">{log.ubicacion}</td>
                    <td className="py-2 px-4">{log.alimento_nombre}</td>
                    <td className="py-2 px-4 font-semibold">{log.cantidad}</td>
                    <td className="py-2 px-4 flex justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(log)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(log.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal Editar */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Alimentación</DialogTitle>
            <DialogDescription>
              Modifica los datos del registro seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Ubicación */}
            <Select
              value={formData.ubicacion}
              onValueChange={(value) =>
                setFormData({ ...formData, ubicacion: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione ubicación" />
              </SelectTrigger>
              <SelectContent>
                {ubicaciones.map((u, i) => (
                  <SelectItem key={i} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Alimento */}
            <Select
              value={formData.alimento_id}
              onValueChange={(value) =>
                setFormData({ ...formData, alimento_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione alimento" />
              </SelectTrigger>
              <SelectContent>
                {inventory.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Cantidad */}
            <Input
              placeholder="Cantidad (kg)"
              value={formData.cantidad}
              onChange={(e) =>
                setFormData({ ...formData, cantidad: e.target.value })
              }
            />

            <Button className="w-full" onClick={handleUpdate}>
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
