let accionistas = [
  {
    id: 1,
    nombre: "Juan",
    apellido: "Pérez",
    dni: "30111222",
    email: "juan.perez@email.com",
    porcentajeAcciones: 25.5,
    fechaIngreso: "2020-03-15",
    telefono: "+5491112345678",
    direccion: "Av. Libertador 1000, Buenos Aires"
  },
  {
    id: 2,
    nombre: "María",
    apellido: "González",
    dni: "28222333",
    email: "maria.gonzalez@email.com",
    porcentajeAcciones: 15.0,
    fechaIngreso: "2021-01-10",
    telefono: "+5491198765432",
    direccion: "Calle Florida 500, Buenos Aires"
  },
  {
    id: 3,
    nombre: "Carlos",
    apellido: "Rodríguez",
    dni: "35444555",
    email: "carlos.rodriguez@email.com",
    porcentajeAcciones: 10.0,
    fechaIngreso: "2022-06-20",
    telefono: "+5491133322211",
    direccion: "Av. Corrientes 800, Buenos Aires"
  }
];

let nextId = 4;

function findAll() {
  return accionistas;
}

function findById(id) {
  return accionistas.find(a => a.id === Number(id));
}

function create(data) {
  const nuevo = {
    id: nextId++,
    nombre: data.nombre || "",
    apellido: data.apellido || "",
    dni: data.dni || "",
    email: data.email || "",
    porcentajeAcciones: Number(data.porcentajeAcciones) || 0,
    fechaIngreso: data.fechaIngreso || new Date().toISOString().split("T")[0],
    telefono: data.telefono || "",
    direccion: data.direccion || ""
  };
  accionistas.push(nuevo);
  return nuevo;
}

function update(id, data) {
  const idx = accionistas.findIndex(a => a.id === Number(id));
  if (idx === -1) return null;
  accionistas[idx] = {
    ...accionistas[idx],
    ...data,
    id: accionistas[idx].id
  };
  return accionistas[idx];
}

function remove(id) {
  const idx = accionistas.findIndex(a => a.id === Number(id));
  if (idx === -1) return false;
  accionistas.splice(idx, 1);
  return true;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};
