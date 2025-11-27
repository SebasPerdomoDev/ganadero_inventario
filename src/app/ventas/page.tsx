"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// ===================================
// 🖥️ INTERFACES Y CONSTANTES
// ===================================

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
  } | null;
}

// 💰 Constante de Tasa de IVA (19% para Colombia)
const TASA_IVA = 0.19;

// ⚙️ Función de formato de moneda COP
const formatCOP = (value: number) => {
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// ⚙️ Función para limpiar y formatear el INPUT de precio
const formatNumberInput = (value: string) => {
  // Remover todos los caracteres que no sean dígitos
  const cleanValue = value.replace(/\D/g, "");
  if (!cleanValue) return "";

  // Añadir puntos como separador de miles
  return parseInt(cleanValue, 10).toLocaleString("es-CO");
};

// ===================================
// 💻 COMPONENTE PRINCIPAL
// ===================================

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

  // 🚩 Nuevo handler para el Input de precio
  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatNumberInput(e.target.value);
    setNuevoPrecio({ ...nuevoPrecio, valor_kg: formattedValue });
  };


  // ==========================
  // 🔄 Cargar datos
  // ==========================
  const fetchData = async () => {
    const { data: animalesData } = await supabase.from("animales").select("*");
    const { data: preciosData } = await supabase.from("raza_precios").select("*");

    const { data: ventasData, error: ventasError } = await supabase
      .from("ventas")
      .select(
        `
                id,
                comprador,
                valor,
                peso_al_vender,
                fecha_venta,
                animales:animales(id, codigo_identificacion, raza)
                `
      )
      .order("fecha_venta", { ascending: false });

    if (ventasError) console.error("Error cargando ventas:", ventasError);

    if (animalesData) {
      const razasUnicas = Array.from(new Set(animalesData.map((a) => a.raza))).filter(Boolean);
      setRazas(razasUnicas);
      setAnimales(animalesData as Animal[]);
    }
    if (preciosData) setPrecios(preciosData as RazaPrecio[]);
    if (ventasData) {
      const ventasNormalizadas = ventasData.map((v: any) => ({
        ...v,
        animales: Array.isArray(v.animales) ? v.animales[0] : v.animales,
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

    // 🚩 Limpiamos el valor con formato para obtener el número puro
    const cleanValue = nuevoPrecio.valor_kg.replace(/\./g, "");
    const valor = parseFloat(cleanValue);

    if (isNaN(valor)) {
      toast.error("El valor ingresado no es un número válido.");
      return;
    }

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
  // ⚙️ Calcular total dinámico (incluyendo IVA)
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

    // Calcular el subtotal
    const subtotal = selectedAnimals.reduce((sum, a) => sum + a.peso * precio.valor_kg, 0);

    // Calcular el total con IVA
    const totalConIva = subtotal * (1 + TASA_IVA);

    setValorTotal(totalConIva);
  }, [selectedAnimals, selectedRaza, precios]);

  // ==========================
  // 🧾 Generar PDF individual tipo factura con desglose de IVA (MODIFICADA)
  // ==========================
  const generarFacturaPDF = ({ comprador, raza, animales, valor_kg, subtotal, iva, total, fecha }: any) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Factura de Venta - Ganadería", 14, 20);

    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date(fecha).toLocaleDateString("es-CO")}`, 14, 30);
    doc.text(`Comprador: ${comprador}`, 14, 38);
    doc.text(`Raza: ${raza}`, 14, 46);
    doc.text(`Valor por Kg (Base): ${formatCOP(valor_kg)}`, 14, 54);

    const tabla = animales.map((a: any) => [
      `#${a.codigo_identificacion}`,
      `${a.peso} kg`,
      formatCOP(a.peso * valor_kg),
    ]);

    // 🚩 Nueva estructura para añadir el desglose al final de la tabla
    const tablaConTotales = [
      ...tabla,
      // Fila separadora
      [{ content: "", colSpan: 3, styles: { fillColor: [240, 240, 240] } }],
      // Desglose Subtotal
      [{ content: "SUBTOTAL (BASE)", colSpan: 2, styles: { fontStyle: "bold", halign: "right" } }, formatCOP(subtotal)],
      // Desglose IVA
      [{ content: `IVA (${TASA_IVA * 100}%)`, colSpan: 2, styles: { fontStyle: "bold", halign: "right" } }, formatCOP(iva)],
      // TOTAL A PAGAR (Celda resaltada)
      [{
        content: "TOTAL A PAGAR (IVA INCL.)",
        colSpan: 2,
        styles: { fontStyle: "bold", halign: "right", fontSize: 13, fillColor: [200, 255, 200] }
      },
      {
        content: formatCOP(total),
        styles: { fontStyle: "bold", fontSize: 13, fillColor: [200, 255, 200] }
      }],
    ];

    autoTable(doc, {
      startY: 62,
      head: [["Animal", "Peso", "Subtotal"]],
      body: tablaConTotales,
      headStyles: { fillColor: [200, 200, 200] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.text("Gracias por su compra.", 14, finalY);

    doc.save(`Factura_${comprador}_${Date.now()}.pdf`);
  };

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

    // Calculamos el valor base (subtotal) por animal
    const ventasToInsert = selectedAnimals.map((a) => ({
      id_animal: a.id,
      comprador,
      peso_al_vender: a.peso,
      valor: a.peso * precio.valor_kg, // 👈 Valor base
      fecha_venta: fechaHoy,
    }));

    // Calculamos los totales con IVA para la factura y el Toast
    const subtotal = ventasToInsert.reduce((sum, v) => sum + v.valor, 0);
    const valorIva = subtotal * TASA_IVA;
    const totalConIva = subtotal + valorIva;

    // El valor registrado en la DB sigue siendo el valor base (subtotal)
    const { error } = await supabase.from("ventas").insert(ventasToInsert);

    if (error) {
      console.error(error);
      toast.error("Error al registrar ventas.");
    } else {
      // Marcar los animales vendidos
      const idsVendidos = selectedAnimals.map((a) => a.id);
      const { error: updateError } = await supabase
        .from("animales")
        .update({ vendido: true })
        .in("id", idsVendidos);

      if (updateError) console.error("Error al marcar como vendido:", updateError);

      toast.success(
        `Venta registrada (${ventasToInsert.length} animales). Total (IVA incl.): ${formatCOP(totalConIva)}`
      );

      // Generar automáticamente el PDF de factura
      generarFacturaPDF({
        comprador,
        raza: selectedRaza,
        animales: selectedAnimals,
        valor_kg: precio.valor_kg,
        subtotal: subtotal,
        iva: valorIva,
        total: totalConIva,
        fecha: fechaHoy,
      });

      // Limpieza
      setSelectedRaza("");
      setSelectedAnimals([]);
      setComprador("");
      fetchData();
    }
  };


  // ==========================
  // 💻 Interfaz JSX
  // ==========================
  return (
    <div className="space-y-10 mx-auto p-6 max-w-6xl">
      <h1 className="mb-6 font-bold text-3xl">Ventas de Ganado</h1>
      {/* === GESTIÓN DE PRECIOS POR RAZA === */}
      <section className="shadow p-4 border rounded-lg">
        <h2 className="mb-3 font-semibold text-xl">Precios por Raza</h2>

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

          {/* 🚩 Uso de handlePrecioChange para el formato de miles */}
          <Input
            placeholder="Valor por kg"
            type="text"
            value={nuevoPrecio.valor_kg}
            onChange={handlePrecioChange}
          />
          <Button onClick={handleAddOrUpdatePrecio}>Guardar</Button>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-1">Raza</th>
              <th className="px-3 py-1">Valor/kg (Base)</th>
            </tr>
          </thead>
          <tbody>
            {precios.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="px-3 py-1">{p.raza}</td>
                <td className="px-3 py-1">{formatCOP(p.valor_kg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>



      {/* === REGISTRAR VENTA === */}
      <section className="shadow p-4 border rounded-lg">
        <h2 className="mb-3 font-semibold text-xl">Registrar Venta</h2>

        <div className="flex md:flex-row flex-col gap-3 mb-4">
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
          <p className="mb-2 text-gray-700 text-sm">
            💹 **Valor por Kg (Base, sin IVA):**{" "}
            <strong>
              {precios.find((p) => p.raza === selectedRaza)?.valor_kg
                ? formatCOP(precios.find((p) => p.raza === selectedRaza)!.valor_kg)
                : "Sin definir"}
            </strong>
          </p>
        )}

        {selectedRaza && (
          <div className="gap-2 grid grid-cols-2 md:grid-cols-4 mb-4">
            {animales
              .filter((a) => a.raza === selectedRaza && !a.vendido)
              .map((a) => {
                const isSelected = selectedAnimals.some((sel) => sel.id === a.id);
                return (
                  <button
                    key={a.id}
                    className={`border rounded-md px-2 py-2 text-sm font-medium transition ${isSelected ? "bg-green-200 border-green-500" : "hover:bg-gray-100"
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

        {/* 🚩 Llamada a handleVenta */}
        <Button className="w-full" onClick={handleVenta}>
          Registrar Venta (IVA incluido)
        </Button>

        {valorTotal > 0 && (
          <div className="mt-3 font-semibold text-green-600 text-lg">
            💵 **Total a pagar (IVA 19% incl.):** {formatCOP(valorTotal)}
          </div>
        )}
      </section>



      {/* === HISTORIAL DE VENTAS === */}
      <section className="shadow p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-xl">Historial de Ventas (Valor Base)</h2>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-1">Animal</th>
              <th className="px-3 py-1">Raza</th>
              <th className="px-3 py-1">Comprador</th>
              <th className="px-3 py-1">Peso</th>
              <th className="px-3 py-1">Valor (Base)</th>
              <th className="px-3 py-1">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {ventas.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-3 text-gray-500 text-center italic">
                  No hay ventas registradas aún.
                </td>
              </tr>
            ) : (
              ventas.map((v) => (
                <tr key={v.id} className="border-b">
                  <td className="px-3 py-1">#{v.animales?.codigo_identificacion}</td>
                  <td className="px-3 py-1">{v.animales?.raza || "—"}</td>
                  <td className="px-3 py-1">{v.comprador}</td>
                  <td className="px-3 py-1">{v.peso_al_vender} kg</td>
                  <td className="px-3 py-1">{formatCOP(v.valor)}</td>
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