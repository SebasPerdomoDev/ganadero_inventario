"use client"

import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

interface ComboboxAnimalProps {
    label: string
    placeholder: string
    animales: { id: number; codigo_identificacion: number; sexo: string }[]
    sexoFiltro: "macho" | "hembra"
    valorSeleccionado: number | null
    onSeleccionar: (id: number) => void
}

export function ComboboxAnimal({
    label,
    placeholder,
    animales,
    sexoFiltro,
    valorSeleccionado,
    onSeleccionar,
}: ComboboxAnimalProps) {
    const [open, setOpen] = React.useState(false)

    const animalesFiltrados = animales.filter(a => a.sexo === sexoFiltro)
    const animalSeleccionado = animalesFiltrados.find(a => a.id === valorSeleccionado)

    return (
        <div className="flex flex-col gap-1.5">
            <Label>{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="justify-between w-full"
                    >
                        {animalSeleccionado
                            ? `${animalSeleccionado.codigo_identificacion}`
                            : placeholder}
                        <ChevronsUpDown className="opacity-50 ml-2 w-4 h-4 shrink-0" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[250px]">
                    <Command>
                        <CommandInput placeholder={`Buscar ${sexoFiltro}`} />
                        <CommandList>
                            <CommandEmpty>No se encontró ningún {sexoFiltro}</CommandEmpty>
                            <CommandGroup>
                                {animalesFiltrados.map(animal => (
                                    <CommandItem
                                        key={animal.id}
                                        onSelect={() => {
                                            onSeleccionar(animal.id)
                                            setOpen(false)
                                        }}
                                        className={cn(
                                            "rounded-md transition-colors cursor-pointer",
                                            "hover:bg-green-100 hover:text-green-900",
                                            valorSeleccionado === animal.id && "bg-green-200 text-green-900"
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 w-4 h-4",
                                                valorSeleccionado === animal.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {animal.codigo_identificacion}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
