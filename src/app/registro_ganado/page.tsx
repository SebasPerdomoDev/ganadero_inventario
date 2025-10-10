"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import * as React from "react"
import toast, { Toaster } from "react-hot-toast"

export default function Ganado() {
  const [fechaNacimiento, setFechaNacimiento] = React.useState<Date | undefined>()
  const [fechaUltimoChequeo, setFechaUltimoChequeo] = React.useState<Date | undefined>()
  const [fechaMuerte, setFechaMuerte] = React.useState<Date | undefined>()

  // Estados para abrir/cerrar los calendarios
  const [openNacimiento, setOpenNacimiento] = React.useState(false)
  const [openChequeo, setOpenChequeo] = React.useState(false)
  const [openMuerte, setOpenMuerte] = React.useState(false)

  // Código incremental
  const [nuevoCodigo, setNuevoCodigo] = React.useState<number | null>(null)

  // Al cargar, calcular el nuevo código
  React.useEffect(() => {
    const obtenerSiguienteCodigo = async () => {
      const { data, error } = await supabase
        .from("animales")
        .select("codigo_identificacion")
        .order("codigo_identificacion", { ascending: false })
        .limit(1)

      if (error) {
        console.error("❌ Error al obtener código:", error.message)
        toast.error("No se pudo obtener el código automático")
      } else {
        const ultimoCodigo = data?.[0]?.codigo_identificacion
          ? Number(data[0].codigo_identificacion)
          : 0
        setNuevoCodigo(ultimoCodigo + 1)
      }
    }

    obtenerSiguienteCodigo()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const hoy = new Date()

    if (!nuevoCodigo) {
      toast.error("No se pudo generar el código automáticamente")
      return
    }

    // 🧩 Validaciones lógicas
    if (fechaNacimiento && fechaUltimoChequeo && fechaUltimoChequeo < fechaNacimiento) {
      toast.error("❌ La fecha de último chequeo no puede ser menor a la de nacimiento.")
      return
    }
    if (fechaNacimiento && fechaMuerte && fechaMuerte < fechaNacimiento) {
      toast.error("❌ La fecha de muerte no puede ser anterior a la de nacimiento.")
      return
    }

    // 🚫 Validaciones de fechas futuras
    if (fechaNacimiento && fechaNacimiento > hoy) {
      toast.error("❌ La fecha de nacimiento no puede ser posterior a hoy.")
      return
    }
    if (fechaUltimoChequeo && fechaUltimoChequeo > hoy) {
      toast.error("❌ La fecha de último chequeo no puede ser posterior a hoy.")
      return
    }
    if (fechaMuerte && fechaMuerte > hoy) {
      toast.error("❌ La fecha de muerte no puede ser posterior a hoy.")
      return
    }

    const data = {
      codigo_identificacion: nuevoCodigo, // generado automáticamente
      raza: formData.get("raza"),
      peso: Number(formData.get("peso")),
      sexo: formData.get("sexo"),
      fecha_nacimiento: fechaNacimiento ? format(fechaNacimiento, "yyyy-MM-dd") : null,
      fecha_ultimo_chequeo: fechaUltimoChequeo ? format(fechaUltimoChequeo, "yyyy-MM-dd") : null,
      fecha_muerte: fechaMuerte ? format(fechaMuerte, "yyyy-MM-dd") : null,
      estado_salud: formData.get("estadoSalud"),
      ubicacion: formData.get("ubicacion"),
      observacion: formData.get("observacion"),
    }

    const { error } = await supabase.from("animales").insert([data])
    if (error) {
      console.error("❌ Error al registrar:", error.message)
      toast.error("Hubo un error al guardar el animal")
    } else {
      toast.success(`✅ Animal #${nuevoCodigo} registrado con éxito`)
      form.reset()
      setFechaNacimiento(undefined)
      setFechaUltimoChequeo(undefined)
      setFechaMuerte(undefined)
      setNuevoCodigo(nuevoCodigo + 1) // preparar el siguiente
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <Card className="shadow-lg mx-auto mt-5 w-full">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5 w-full">
            <h2 className="mb-4 pb-2 border-b font-semibold text-gray-800 text-xl">
              Información Animal
            </h2>

            <div className="gap-4 grid md:grid-cols-2 w-full">
              {/* Código de identificación automático */}
              <div>
                <Label className="block mb-1 font-medium text-gray-700 text-sm">
                  Código Identificación
                </Label>
                <Input
                  type="number"
                  name="idAnimal"
                  value={nuevoCodigo ?? ""}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Raza */}
              <div>
                <Label className="block mb-1 font-medium text-gray-700 text-sm">Raza</Label>
                <Select name="raza" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona la raza" />
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

              {/* Peso */}
              <div>
                <Label className="block mb-1 font-medium text-gray-700 text-sm">Peso (kg)</Label>
                <Input type="number" name="peso" placeholder="Peso (kg)" step="0.01" required />
              </div>

              {/* Sexo */}
              <div>
                <Label className="block mb-1 font-medium text-gray-700 text-sm">Sexo</Label>
                <Select name="sexo" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona el sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="macho">Macho</SelectItem>
                    <SelectItem value="hembra">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha de Nacimiento */}
              <div className="flex flex-col gap-2">
                <Label className="block mb-1 font-medium text-gray-700 text-sm">
                  Fecha de Nacimiento
                </Label>
                <Popover open={openNacimiento} onOpenChange={setOpenNacimiento}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start w-full font-normal text-left">
                      <CalendarIcon className="mr-2 w-4 h-4" />
                      {fechaNacimiento ? format(fechaNacimiento, "yyyy-MM-dd") : "Selecciona fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={fechaNacimiento}
                      onSelect={(date) => {
                        setFechaNacimiento(date)
                        setOpenNacimiento(false)
                      }}
                      disabled={(date) => date > new Date()}
                      captionLayout="dropdown"
                      fromYear={2000}
                      toYear={2030}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Fecha de Último Chequeo */}
              <div className="flex flex-col gap-2">
                <Label className="block mb-1 font-medium text-gray-700 text-sm">
                  Fecha de Último Chequeo
                </Label>
                <Popover open={openChequeo} onOpenChange={setOpenChequeo}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start w-full font-normal text-left">
                      <CalendarIcon className="mr-2 w-4 h-4" />
                      {fechaUltimoChequeo
                        ? format(fechaUltimoChequeo, "yyyy-MM-dd")
                        : "Selecciona fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={fechaUltimoChequeo}
                      onSelect={(date) => {
                        setFechaUltimoChequeo(date)
                        setOpenChequeo(false)
                      }}
                      disabled={(date) => date > new Date()}
                      captionLayout="dropdown"
                      fromYear={2000}
                      toYear={2030}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Fecha de Muerte */}
              <div className="flex flex-col gap-2 relative">
                <Label className="block mb-1 font-medium text-gray-700 text-sm">Fecha de Muerte</Label>
                <Popover open={openMuerte} onOpenChange={setOpenMuerte}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start w-full font-normal text-left">
                      <CalendarIcon className="mr-2 w-4 h-4" />
                      {fechaMuerte ? format(fechaMuerte, "yyyy-MM-dd") : "Selecciona fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={fechaMuerte}
                      onSelect={(date) => {
                        setFechaMuerte(date)
                        setOpenMuerte(false)
                      }}
                      disabled={(date) => date > new Date()}
                      captionLayout="dropdown"
                      fromYear={2000}
                      toYear={2030}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {fechaMuerte && (
                  <button
                    type="button"
                    onClick={() => setFechaMuerte(undefined)}
                    className="absolute right-3 top-[38px] text-gray-500 hover:text-red-500 transition"
                    title="Borrar fecha"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Estado de Salud */}
              <div>
                <Label className="block mb-1 font-medium text-gray-700 text-sm">Estado de Salud</Label>
                <Select name="estadoSalud" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saludable">Saludable</SelectItem>
                    <SelectItem value="tratamiento">En Tratamiento</SelectItem>
                    <SelectItem value="observacion">En Observación</SelectItem>
                    <SelectItem value="enfermo">Enfermo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ubicación */}
              <div>
                <Label className="block mb-1 font-medium text-gray-700 text-sm">Ubicación</Label>
                <Select name="ubicacion" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="potrero 1">Potrero 1</SelectItem>
                    <SelectItem value="potrero 2">Potrero 2</SelectItem>
                    <SelectItem value="potrero 3">Potrero 3</SelectItem>
                    <SelectItem value="potrero 4">Potrero 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Observación */}
            <div>
              <Label className="block mb-1 font-medium text-gray-700 text-sm">Observación</Label>
              <Textarea name="observacion" placeholder="Notas Adicionales" />
            </div>

            {/* Botón */}
            <div className="text-center">
              <Button type="submit" className="bg-green-600 hover:bg-green-700 w-full md:w-auto">
                + Registrar Animal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
