"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RazaPrecio {
  id: number;
  raza: string;
  valor_kg: number;
}

interface Animal {
  id: number;
  codigo_identificacion: number;
  raza: string;
  peso: number;
  vendido?: boolean;
}

interface Venta {
  id: number;
  comprador: string;
  valor: number;
  peso_al_vender: number;
  fecha_venta: string;
  animales?: {
    id: number;
    codigo_identificacion: number;
    raza: string;
  } | null; // 👈 puede venir como objeto o null
}


export default function VentasPage() {
  const [razas, setRazas] = useState<string[]>([]);
  const [precios, setPrecios] = useState<RazaPrecio[]>([]);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);

  const [selectedRaza, setSelectedRaza] = useState("");
  const [selectedAnimals, setSelectedAnimals] = useState<Animal[]>([]);
  const [comprador, setComprador] = useState("");
  const [valorTotal, setValorTotal] = useState<number>(0);
  const [nuevoPrecio, setNuevoPrecio] = useState({ raza: "", valor_kg: "" });

  // ==========================
  // 🔄 Cargar datos
  // ==========================
  const fetchData = async () => {
    const { data: animalesData } = await supabase.from("animales").select("*");
    const { data: preciosData } = await supabase.from("raza_precios").select("*");

    // ✅ Trae ventas con JOIN a animales
    const { data: ventasData, error: ventasError } = await supabase
      .from("ventas")
      .select(`
        id,
        comprador,
        valor,
        peso_al_vender,
        fecha_venta,
        animales:animales(id, codigo_identificacion, raza)
      `)
      .order("fecha_venta", { ascending: false });

    if (ventasError) console.error("Error cargando ventas:", ventasError);

    if (animalesData) {
      const razasUnicas = Array.from(new Set(animalesData.map((a) => a.raza))).filter(Boolean);
      setRazas(razasUnicas);
      setAnimales(animalesData as Animal[]);
    }
    if (preciosData) setPrecios(preciosData as RazaPrecio[]);
    if (ventasData) {
  // 👇 Normaliza el campo animales (Supabase a veces lo devuelve como array)
  const ventasNormalizadas = ventasData.map((v: any) => ({
    ...v,
    animales: Array.isArray(v.animales) ? v.animales[0] : v.animales, // ✅ toma el primer objeto
  }));
  setVentas(ventasNormalizadas as Venta[]);
}

  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================
  // 💲 Agregar o actualizar valor por kg
  // ==========================
  const handleAddOrUpdatePrecio = async () => {
    if (!nuevoPrecio.raza || !nuevoPrecio.valor_kg) {
      toast.error("Selecciona raza y valor.");
      return;
    }

    const valor = parseFloat(nuevoPrecio.valor_kg);
    const { data: existe } = await supabase
      .from("raza_precios")
      .select("*")
      .eq("raza", nuevoPrecio.raza)
      .maybeSingle();

    if (existe) {
      const { error } = await supabase
        .from("raza_precios")
        .update({ valor_kg: valor })
        .eq("raza", nuevoPrecio.raza);
      if (error) toast.error("Error al actualizar precio.");
      else toast.success("Precio actualizado.");
    } else {
      const { error } = await supabase
        .from("raza_precios")
        .insert([{ raza: nuevoPrecio.raza, valor_kg: valor }]);
      if (error) toast.error("Error al agregar precio.");
      else toast.success("Precio agregado.");
    }

    setNuevoPrecio({ raza: "", valor_kg: "" });
    fetchData();
  };

  // ==========================
  // ⚙️ Calcular total dinámico
  // ==========================
  useEffect(() => {
    if (!selectedRaza || selectedAnimals.length === 0) {
      setValorTotal(0);
      return;
    }

    const precio = precios.find((p) => p.raza === selectedRaza);
    if (!precio) {
      setValorTotal(0);
      return;
    }

    const total = selectedAnimals.reduce((sum, a) => sum + a.peso * precio.valor_kg, 0);
    setValorTotal(total);
  }, [selectedAnimals, selectedRaza, precios]);

  // ==========================
  // 💰 Registrar venta múltiple con PDF automático
  // ==========================
  const handleVenta = async () => {
    if (!selectedRaza || selectedAnimals.length === 0 || !comprador) {
      toast.error("Selecciona una raza, al menos un animal y comprador.");
      return;
    }

    const precio = precios.find((p) => p.raza === selectedRaza);
    if (!precio) {
      toast.error("Define el valor por kg para esta raza.");
      return;
    }

    const fechaHoy = new Date().toISOString().split("T")[0];

    const ventasToInsert = selectedAnimals.map((a) => ({
      id_animal: a.id,
      comprador,
      peso_al_vender: a.peso,
      valor: a.peso * precio.valor_kg,
      fecha_venta: fechaHoy,
    }));

    const total = ventasToInsert.reduce((sum, v) => sum + v.valor, 0);
    setValorTotal(total);

    const { error } = await supabase.from("ventas").insert(ventasToInsert);

    if (error) {
      console.error(error);
      toast.error("Error al registrar ventas.");
    } else {
      // ✅ Marcar los animales vendidos
      const idsVendidos = selectedAnimals.map((a) => a.id);
      const { error: updateError } = await supabase
        .from("animales")
        .update({ vendido: true })
        .in("id", idsVendidos);

      if (updateError) console.error("Error al marcar como vendido:", updateError);

      toast.success(
        `Venta registrada (${ventasToInsert.length} animales). Total: $${total.toFixed(2)}`
      );

      // ✅ Generar automáticamente el PDF de factura
      generarFacturaPDF({
        comprador,
        raza: selectedRaza,
        animales: selectedAnimals,
        valor_kg: precio.valor_kg,
        total,
        fecha: fechaHoy,
      });

      // Limpieza
      setSelectedRaza("");
      setSelectedAnimals([]);
      setComprador("");
      fetchData();
    }
  };

  // 🧾 Generar PDF individual tipo factura
  const generarFacturaPDF = ({ comprador, raza, animales, valor_kg, total, fecha }: any) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Factura de Venta - Ganadería", 14, 20);

    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date(fecha).toLocaleDateString("es-CO")}`, 14, 30);
    doc.text(`Comprador: ${comprador}`, 14, 38);
    doc.text(`Raza: ${raza}`, 14, 46);
    doc.text(`Valor por Kg: $${valor_kg.toLocaleString("es-CO")}`, 14, 54);

    const tabla = animales.map((a: any) => [
      `#${a.codigo_identificacion}`,
      `${a.peso} kg`,
      `$${(a.peso * valor_kg).toLocaleString("es-CO")}`,
    ]);

    autoTable(doc, {
      startY: 62,
      head: [["Animal", "Peso", "Subtotal"]],
      body: tabla,
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(` Total: $${total.toLocaleString("es-CO")}`, 14, finalY);

    doc.save(`Factura_${comprador}_${Date.now()}.pdf`);
  };

  // ==========================
  // 💻 Interfaz
  // ==========================
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-3xl font-bold mb-6">💰 Ventas de Ganado</h1>

      {/* === GESTIÓN DE PRECIOS POR RAZA === */}
      <section className="p-4 border rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">Precios por Raza</h2>

        <div className="flex gap-2 mb-4">
          <Select
            value={nuevoPrecio.raza}
            onValueChange={(v) => setNuevoPrecio({ ...nuevoPrecio, raza: v })}
          >
            <SelectTrigger className="w-1/3">
              <SelectValue placeholder="Seleccionar raza" />
            </SelectTrigger>
            <SelectContent>
              {razas.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Valor por kg"
            type="number"
            value={nuevoPrecio.valor_kg}
            onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, valor_kg: e.target.value })}
          />
          <Button onClick={handleAddOrUpdatePrecio}>Guardar</Button>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-1">Raza</th>
              <th className="px-3 py-1">Valor/kg</th>
            </tr>
          </thead>
          <tbody>
            {precios.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="px-3 py-1">{p.raza}</td>
                <td className="px-3 py-1">${p.valor_kg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* === REGISTRAR VENTA === */}
      <section className="p-4 border rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">Registrar Venta</h2>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Select value={selectedRaza} onValueChange={setSelectedRaza}>
            <SelectTrigger className="w-full md:w-1/3">
              <SelectValue placeholder="Seleccionar raza" />
            </SelectTrigger>
            <SelectContent>
              {razas.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedRaza && (
          <p className="mb-2 text-sm text-gray-700">
            💹 Valor por Kg de esta raza:{" "}
            <strong>
              $
              {precios.find((p) => p.raza === selectedRaza)?.valor_kg?.toLocaleString("es-CO") ||
                "Sin definir"}
            </strong>
          </p>
        )}

        {selectedRaza && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {animales
              .filter((a) => a.raza === selectedRaza && !a.vendido)
              .map((a) => {
                const isSelected = selectedAnimals.some((sel) => sel.id === a.id);
                return (
                  <button
                    key={a.id}
                    className={`border rounded-md px-2 py-2 text-sm font-medium transition ${
                      isSelected ? "bg-green-200 border-green-500" : "hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      if (isSelected)
                        setSelectedAnimals(selectedAnimals.filter((sel) => sel.id !== a.id));
                      else setSelectedAnimals([...selectedAnimals, a]);
                    }}
                  >
                    🐄 #{a.codigo_identificacion} ({a.peso} kg)
                  </button>
                );
              })}
          </div>
        )}

        <Input
          placeholder="Nombre del comprador"
          value={comprador}
          onChange={(e) => setComprador(e.target.value)}
          className="mb-4"
        />

        <Button className="w-full" onClick={handleVenta}>
          Registrar Venta
        </Button>

        {valorTotal > 0 && (
          <div className="mt-3 text-lg font-semibold text-green-600">
            💵 Total actual: ${valorTotal.toLocaleString("es-CO")}
          </div>
        )}
      </section>

      {/* === HISTORIAL DE VENTAS === */}
      <section className="p-4 border rounded-lg shadow">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Historial de Ventas</h2>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-1">Animal</th>
              <th className="px-3 py-1">Raza</th>
              <th className="px-3 py-1">Comprador</th>
              <th className="px-3 py-1">Peso</th>
              <th className="px-3 py-1">Valor</th>
              <th className="px-3 py-1">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {ventas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-3 text-gray-500 italic">
                  No hay ventas registradas aún.
                </td>
              </tr>
            ) : (
              ventas.map((v) => (
                <tr key={v.id} className="border-b">
                  <td className="px-3 py-1">🐄 #{v.animales?.codigo_identificacion}</td>
                  <td className="px-3 py-1">{v.animales?.raza || "—"}</td>
                  <td className="px-3 py-1">{v.comprador}</td>
                  <td className="px-3 py-1">{v.peso_al_vender} kg</td>
                  <td className="px-3 py-1">${v.valor}</td>
                  <td className="px-3 py-1">
                    {new Date(v.fecha_venta).toLocaleDateString("es-CO")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
