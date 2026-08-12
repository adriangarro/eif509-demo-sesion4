// EIF509 · Demo Sesión 4 — Inserción de documentos
// Colección: bitacora_pedidos
//
// Cada documento es la bitácora de UN pedido: sus datos básicos y un
// arreglo anidado "eventos" con el historial de lo que le ha pasado.
// Esto es lo que en el modelo relacional serían dos tablas con JOIN;
// aquí viaja todo junto en un solo documento.

// Seleccionar la base de datos eif509.
// getSiblingDB funciona igual en mongosh y en los playgrounds de Compass.
db = db.getSiblingDB('eif509');

// --- insertOne: el ejemplo de la clase -------------------------------
// Un pedido de Ana Rojas con dos eventos en su historial.
db.bitacora_pedidos.insertOne({
  pedido_id: 1001,
  cliente: "Ana Rojas",
  eventos: [
    { tipo: "creado", fecha: new Date() },
    { tipo: "pagado", fecha: new Date() }
  ]
});

// --- insertMany: más pedidos para que las consultas tengan datos -----
db.bitacora_pedidos.insertMany([
  {
    pedido_id: 1002,
    cliente: "Luis Mora",
    eventos: [
      { tipo: "creado", fecha: new Date() }
    ]
  },
  {
    pedido_id: 1003,
    cliente: "Carmen Solís",
    eventos: [
      { tipo: "creado", fecha: new Date() },
      { tipo: "pagado", fecha: new Date() },
      { tipo: "enviado", fecha: new Date() }
    ]
  },
  {
    pedido_id: 1004,
    cliente: "Luis Mora",
    eventos: [
      { tipo: "creado", fecha: new Date() },
      { tipo: "pagado", fecha: new Date() }
    ]
  }
]);
