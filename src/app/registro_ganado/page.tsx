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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const data = {
      codigo_identificacion: formData.get("idAnimal"),
      raza: formData.get("raza"),
      peso: Number(formData.get("peso")),
      sexo: formData.get("sexo"),
      fecha_nacimiento: fechaNacimiento ? format(fechaNacimiento, "yyyy-MM-dd") : null,
      fecha_ultimo_chequeo: fechaUltimoChequeo ? format(fechaUltimoChequeo, "yyyy-MM-dd") : null,
      estado_salud: formData.get("estadoSalud"),
      ubicacion: formData.get("ubicacion"),
      observacion: formData.get("observacion"),
    }

    const { error } = await supabase.from("animales").insert([data])
    if (error) {
      console.error("❌ Error al registrar:", error.message)
      toast.error("Hubo un error al guardar el animal")
    } else {
      toast.success("✅ Animal registrado con éxito")
      form.reset()
      setFechaNacimiento(undefined)
      setFechaUltimoChequeo(undefined)
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <Card className="shadow-lg mx-auto mt-5 w-full">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5 w-full">
            <h2 className="mb-4 pb-2 border-b font-semibold text-gray-800 text-xl">Información Animal</h2>

            <div className="gap-4 grid md:grid-cols-2 w-full">
              {/* ID del Animal */}
              <div>
                <Label className="block mb-1 font-medium text-gray-700 text-sm">Codigo Identificación</Label>
                <Input type="number" name="idAnimal" placeholder="Codigo" required />
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
                <Label className="block mb-1 font-medium text-gray-700 text-sm">Fecha de Nacimiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start w-full font-normal text-left"
                    >
                      <CalendarIcon className="mr-2 w-4 h-4" />
                      {fechaNacimiento ? format(fechaNacimiento, "yyyy-MM-dd") : "Selecciona fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={fechaNacimiento}
                      onSelect={setFechaNacimiento}
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
                <Label className="block mb-1 font-medium text-gray-700 text-sm">Fecha de Último Chequeo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start w-full font-normal text-left"
                    >
                      <CalendarIcon className="mr-2 w-4 h-4" />
                      {fechaUltimoChequeo ? format(fechaUltimoChequeo, "yyyy-MM-dd") : "Selecciona fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={fechaUltimoChequeo}
                      onSelect={setFechaUltimoChequeo}
                      captionLayout="dropdown"
                      fromYear={2000}
                      toYear={2030}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                Registrar Animal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
