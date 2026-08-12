// EIF509 · Demo Sesión 4 — Consultas sobre bitacora_pedidos
//
// Se usa print/printjson para que la salida se vea igual si ejecutan
// el script con mongosh o lo pegan en un playground de Compass.

db = db.getSiblingDB('eif509');

// --- 1. find por campo simple ----------------------------------------
// Todos los pedidos de un cliente. Igual que un WHERE en SQL.
print("\n== 1. Pedidos de Ana Rojas ==");
printjson(db.bitacora_pedidos.find({ cliente: "Ana Rojas" }).toArray());

// --- 2. find DENTRO del arreglo anidado (momento clave de la demo) ---
// "eventos.tipo" con notación de punto busca dentro de la lista:
// devuelve los pedidos que tienen AL MENOS un evento de tipo "pagado".
// En SQL esto sería un JOIN contra la tabla de eventos; aquí es una
// consulta directa sobre el documento.
print("\n== 2. Pedidos con algún evento 'pagado' ==");
printjson(db.bitacora_pedidos.find({ "eventos.tipo": "pagado" }).toArray());

// --- 3. Proyección: traer solo los campos que interesan --------------
// Segundo parámetro de find: 1 = incluir campo, 0 = excluir.
// _id viene siempre salvo que se excluya explícitamente.
print("\n== 3. Solo pedido_id y cliente ==");
printjson(
  db.bitacora_pedidos
    .find({}, { pedido_id: 1, cliente: 1, _id: 0 })
    .toArray()
);

// --- 4. countDocuments: contar sin traer los documentos --------------
print("\n== 4. ¿Cuántos pedidos ya fueron enviados? ==");
print(db.bitacora_pedidos.countDocuments({ "eventos.tipo": "enviado" }));
