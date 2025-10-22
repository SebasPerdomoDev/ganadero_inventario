"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { ComboboxAnimal } from "@/components/ui/comboboxAnimal" // Componente personalizado para elegir madre/padre
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import * as React from "react"
import toast, { Toaster } from "react-hot-toast"

// Tipo de datos que representa un animal
type Animal = {
  id: number
  codigo_identificacion: number
  sexo: string
  estado_salud: string
}

export default function RegistroAnimalesTabs() {
  // Estados para registrar Nacimientos
  const [fechaNacimiento, setFechaNacimiento] = React.useState<Date | undefined>()
  const [sexo, setSexo] = React.useState<string>("")
  const [raza, setRaza] = React.useState<string>("")
  const [peso, setPeso] = React.useState<number | undefined>()
  const [madres, setMadres] = React.useState<Animal[]>([])
  const [madreSeleccionada, setMadreSeleccionada] = React.useState<number>(0)
  const [padreSeleccionado, setPadreSeleccionado] = React.useState<number>(0)

  // Estados para registrar Muertes
  const [animalesVivos, setAnimalesVivos] = React.useState<Animal[]>([])
  const [animalSeleccionado, setAnimalSeleccionado] = React.useState<number | undefined>()
  const [fechaMuerte, setFechaMuerte] = React.useState<Date | undefined>()
  const [causaMuerte, setCausaMuerte] = React.useState("")

  // Al cargar el componente, traer todos los animales desde Supabase
  React.useEffect(() => {
    const fetchAnimales = async () => {
      const { data: animalesData } = await supabase
        .from("animales")
        .select("id, codigo_identificacion, sexo, estado_salud")

      if (animalesData) {
        setMadres(animalesData) // se usan para elegir madre/padre
        setAnimalesVivos(animalesData.filter(a => a.estado_salud !== "Muerto")) // solo vivos
      }
    }
    fetchAnimales()
  }, [])

  // Registrar Nacimiento
  const handleSubmitNacimiento = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const codigo = Number(formData.get("codigoIdentificacion"))
    const observacion = formData.get("observacion")?.toString() || ""

    // Validaciones previas
    if (!codigo || isNaN(codigo)) {
      toast.error("El código de identificación es obligatorio.")
      return
    }
    if (!raza) {
      toast.error("Debes seleccionar una raza.")
      return
    }
    if (!sexo) {
      toast.error("Debes seleccionar el sexo.")
      return
    }
    if (!peso || peso <= 0) {
      toast.error("El peso debe ser un número mayor a 0.")
      return
    }
    if (!fechaNacimiento) {
      toast.error("Debes seleccionar una fecha de nacimiento.")
      return
    }
    if (!madreSeleccionada) {
      toast.error("Debes seleccionar una madre.")
      return
    }
    if (!padreSeleccionado) {
      toast.error("Debes seleccionar un padre.")
      return
    }

    // Insertar en la tabla de animales
    const { data: animalNuevo, error: errorAnimal } = await supabase
      .from("animales")
      .insert([
        {
          codigo_identificacion: codigo,
          raza,
          sexo,
          peso,
          fecha_nacimiento: format(fechaNacimiento, "yyyy-MM-dd"),
          estado_salud: "Saludable"
        }
      ])
      .select()
      .single()

    if (errorAnimal || !animalNuevo) {
      console.error(errorAnimal)
      if (errorAnimal?.code === "23505") {
        toast.error("El código de identificación ya existe.")
      } else {
        toast.error("Error al registrar el animal.")
      }
      return
    }

    // Insertar en la tabla nacimientos
    const { error: errorNacimiento } = await supabase
      .from("nacimientos")
      .insert([
        {
          id_animal: animalNuevo.id,
          id_madre: madreSeleccionada,
          id_padre: padreSeleccionado,
          fecha_nacimiento: format(fechaNacimiento, "yyyy-MM-dd"),
          observaciones: observacion
        }
      ])

    if (errorNacimiento) {
      console.error(errorNacimiento)
      toast.error("Error al registrar nacimiento.")
    } else {
      toast.success("Nacimiento registrado con éxito.")
      form.reset()
      setFechaNacimiento(undefined)
      setSexo("")
      setRaza("")
      setPeso(undefined)
      setMadreSeleccionada(0)
      setPadreSeleccionado(0)
    }
  }

  // Registrar Muerte
  const handleSubmitMuerte = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!animalSeleccionado) {
      toast.error("Selecciona un animal.")
      return
    }

    // Insertar en la tabla muertes
    const { error } = await supabase.from("muertes").insert([
      {
        id_animal: animalSeleccionado,
        fecha_muerte: fechaMuerte ? format(fechaMuerte, "yyyy-MM-dd") : null,
        causa_muerte: causaMuerte
      }
    ])

    if (error) {
      toast.error("Error al registrar muerte.")
    } else {
      // Actualizar estado del animal a "Muerto"
      await supabase.from("animales").update({ estado_salud: "Muerto" }).eq("id", animalSeleccionado)
      toast.success("Muerte registrada con éxito.")
      setAnimalSeleccionado(undefined)
      setFechaMuerte(undefined)
      setCausaMuerte("")
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <Card className="shadow-lg mx-auto mt-5 w-full min-h-screen">
        <CardContent>
          <Tabs defaultValue="nacimientos">
            <TabsList className="grid grid-cols-2 mb-4 w-full">
              <TabsTrigger value="nacimientos">Nacimientos</TabsTrigger>
              <TabsTrigger value="muertes">Mortalidad</TabsTrigger>
            </TabsList>

            {/* TAB NACIMIENTOS */}
            <TabsContent value="nacimientos">
              <form onSubmit={handleSubmitNacimiento} className="space-y-5 w-full">
                <div className="gap-4 grid md:grid-cols-2">
                  <div>
                    <Label>Código Identificación</Label>
                    <Input type="number" name="codigoIdentificacion" placeholder="Código" required />
                  </div>

                  {/* Selección de raza */}
                  <div>
                    <Label>Raza</Label>
                    <Select value={raza} onValueChange={setRaza}>
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

                  {/* Selección de sexo */}
                  <div>
                    <Label>Sexo</Label>
                    <Select value={sexo} onValueChange={setSexo}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="macho">Macho</SelectItem>
                        <SelectItem value="hembra">Hembra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Peso */}
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      value={peso || ""}
                      onChange={e => setPeso(Number(e.target.value))}
                      required
                    />
                  </div>

                  {/* Fecha de nacimiento */}
                  <div className="flex flex-col gap-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Popover>
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
                          onSelect={setFechaNacimiento}
                          captionLayout="dropdown"
                          fromYear={2000}
                          toYear={2030}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Madre */}
                  <ComboboxAnimal
                    label="Madre"
                    placeholder="Selecciona la madre"
                    animales={animalesVivos}
                    sexoFiltro="hembra"
                    valorSeleccionado={madreSeleccionada}
                    onSeleccionar={setMadreSeleccionada}
                  />

                  {/* Padre */}
                  <ComboboxAnimal
                    label="Padre"
                    placeholder="Selecciona el padre"
                    animales={animalesVivos}
                    sexoFiltro="macho"
                    valorSeleccionado={padreSeleccionado}
                    onSeleccionar={setPadreSeleccionado}
                  />

                  <div>
                    <Label>Observación</Label>
                    <Input name="observacion" placeholder="Notas" />
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 w-full md:w-auto">
                    + Registrar Nacimiento
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* TAB MUERTES */}
            <TabsContent value="muertes">
              <form onSubmit={handleSubmitMuerte} className="space-y-5 w-full">
                <div className="gap-4 grid md:grid-cols-2">
                  <div>
                    <Label>Selecciona Animal</Label>
                    <Select
                      value={animalSeleccionado?.toString()}
                      onValueChange={v => setAnimalSeleccionado(Number(v))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona animal" />
                      </SelectTrigger>
                      <SelectContent>
                        {animalesVivos.map(a => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            {a.codigo_identificacion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fecha de muerte */}
                  <div className="flex flex-col gap-2">
                    <Label>Fecha de Muerte</Label>
                    <Popover>
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
                          onSelect={setFechaMuerte}
                          captionLayout="dropdown"
                          fromYear={2000}
                          toYear={2030}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Causa de la muerte</Label>
                    <Input
                      value={causaMuerte}
                      onChange={e => setCausaMuerte(e.target.value)}
                      placeholder="Causa"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <Button type="submit" className="bg-red-600 hover:bg-red-700 w-full md:w-auto">
                    + Registrar Muerte
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  )
}
