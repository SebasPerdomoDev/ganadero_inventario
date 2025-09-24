"use client";

import { supabase } from "@/lib/supabase";

export default function Ganado() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const data = {
      id_animal: formData.get("idAnimal"),
      raza: formData.get("raza"),
      peso: Number(formData.get("peso")),
      sexo: formData.get("sexo"),
      fecha_nacimiento: formData.get("fechaNacimiento"),
      fecha_ultimo_chequeo: formData.get("fechaUltimoChequeo"),
      estado_salud: formData.get("estadoSalud"),
      ubicacion: formData.get("ubicacion"),
      observacion: formData.get("observacion"),
    };

    const { error } = await supabase.from("ganado").insert([data]);

    if (error) {
      console.error("❌ Error al registrar:", error.message);
      alert("Hubo un error al guardar el animal");
    } else {
      console.log("✅ Registro guardado:", data);
      alert("Animal registrado con éxito");
      form.reset();
    }
  };

  return (
    <section className="bg-white shadow-lg mx-auto mt-10 p-6 border border-gray-200 rounded-xl max-w-3xl">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="font-bold text-cyan-700 text-3xl">Registro de Ganado 🐄</h1>
        <span className="text-gray-600 text-sm">
          Completa la información del nuevo animal
        </span>
      </header>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <h2 className="mb-4 pb-2 border-b font-semibold text-gray-800 text-xl">
          Información Animal
        </h2>

        {/* Grid de inputs */}
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
          <div>
            <label className="block font-medium text-gray-700 text-sm">
              ID del Animal
            </label>
            <input
              type="number"
              name="idAnimal"
              placeholder="ID del Animal"
              required
              className="mt-1 p-2 border focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500 w-full"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 text-sm">
              Raza
            </label>
            <input
              type="text"
              name="raza"
              placeholder="Raza"
              required
              className="mt-1 p-2 border focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500 w-full"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 text-sm">
              Peso (kg)
            </label>
            <input
              type="number"
              name="peso"
              placeholder="Peso (kg)"
              required
              className="mt-1 p-2 border focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500 w-full"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 text-sm">Sexo</label>
            <select
              name="sexo"
              required
              className="mt-1 p-2 border focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500 w-full"
            >
              <option value="">Selecciona el sexo</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 text-sm">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              name="fechaNacimiento"
              required
              className="mt-1 p-2 border focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500 w-full cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 text-sm">
              Fecha de Último Chequeo
            </label>
            <input
              type="date"
              name="fechaUltimoChequeo"
              required
              className="mt-1 p-2 border focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500 w-full cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 text-sm">
              Estado de Salud
            </label>
            <select
              name="estadoSalud"
              required
              className="mt-1 p-2 border focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500 w-full cursor-pointer"
            >
              <option value="">Selecciona</option>
              <option value="saludable">Saludable</option>
              <option value="tratamiento">En Tratamiento</option>
              <option value="observacion">En Observación</option>
              <option value="enfermo">Enfermo</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 text-sm">
              Ubicación
            </label>
            <select
              name="ubicacion"
              required
              className="mt-1 p-2 border focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500 w-full cursor-pointer"
            >
              <option value="">Selecciona</option>
              <option value="rancho1">Rancho 1</option>
              <option value="rancho2">Rancho 2</option>
              <option value="rancho3">Rancho 3</option>
            </select>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block font-medium text-gray-700 text-sm">
            Observación
          </label>
          <textarea
            name="observacion"
            placeholder="Notas Adicionales"
            className="mt-1 p-2 border focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500 w-full"
          />
        </div>


        <div className="text-center">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 shadow px-6 py-2 rounded-lg font-semibold text-white transition cursor-pointer"
          >
            Registrar Animal
          </button>
        </div>
      </form>
    </section>
  );
}
