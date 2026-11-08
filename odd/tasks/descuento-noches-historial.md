# Descuento de noches e historial

Feature branch: `feature/descuento-noches-historial`.
Backend: endpoints de descuento e historial + filtro por año en curso. Frontend: popup de descuento e historial en la card del accionista.

## Specs

- S1: "se debe mostrar un popup para que se digite el numero de noches que se desean descontar" — desde la card del accionista (botón "Descontar noches", hoy deshabilitado), un modal permite digitar la cantidad de noches.
- S2: "la fecha del dia de descuento se va almacenar y se debe seleccionar, por defecto se selecciona el dia de hoy" — el popup incluye un selector de fecha (default: hoy) y esa fecha se persiste en el movimiento.
- S3: "tambien se pueda habilitar la funcionalidad del historia, mostrando la fecha y las noches que se han tomado" — botón "Ver historial" habilitado que muestra los movimientos con fecha y cantidad de noches.
- S4: "al realizar este descuento se debe deben adaptar las consultas o datos que tengan pendiente este historial cuando se visualicen las noches pendientes para disfrute por parte del accionista" — tras descontar, las noches disponibles de la consulta se actualizan restando el descuento.
- S5: "las noches de beneficio vuelven a su estado normal para todos los accionista el primero de enero del año en curso" — solo los movimientos cuya **fecha de descuento seleccionada** pertenece al año en curso restan del saldo. Movimientos de años anteriores no restan (noches disponibles completas). Decisión del usuario: el año lo define la fecha seleccionada en el popup, no `createdAt`.
- S6: "Cualquier usuario autenticado" puede descontar y ver historial (decisión del usuario; mismo alcance que la consulta).
- S7: La cantidad a descontar debe ser un entero >= 1 y no puede superar las noches disponibles del año en curso; si no hay disponibilidad suficiente, el backend rechaza con 400 y no persiste nada.

## Tasks

- T1 (S2,S5,S7): Backend — agregar campo `fechaDescuento` (Date, opcional para conservar registros históricos; obligatorio en los nuevos descuentos del endpoint) al modelo `MovimientoNoches`. Ruta: inline. Commit: `66e72b6` — `feat(backend): add discount date to night movements`.
- T2 (S5): Backend — `consultarPorDni` filtra movimientos por `fechaDescuento` dentro del año en curso (1 ene 00:00:00.000 UTC <= fecha < 1 ene del año siguiente). Compatibilidad: movimientos sin `fechaDescuento` usan `createdAt`. Ruta: inline. Commit: `bca6fcd` — `feat(backend): reset night balance every January`.
- T3 (S1,S2,S4,S6,S7): Backend — `POST /api/consulta/accionista/dni/:dni/descuento` con body `{ cantidad, fecha }`: valida entero >= 1, fecha válida, disponibilidad suficiente del año de esa fecha; persiste movimiento `descuento` con `fechaDescuento`, `usuario` del token, `saldoAnterior`/`saldoNuevo`; devuelve el resultado actualizado de la consulta. Tests de integración. Ruta: inline. Commit: `1f9ff88` — `feat(backend): add night discount endpoint`.
- T4 (S3,S6): Backend — `GET /api/consulta/accionista/dni/:dni/historial`: devuelve movimientos del accionista ordenados por `fechaDescuento` descendente con fecha, tipo, cantidad, motivo, usuario. Tests de integración. Ruta: inline. Commit: `e0b5eda` — `feat(backend): add night movements history endpoint`.
- T5 (S1,S2,S4): Frontend — modal de descuento (cantidad + fecha default hoy) desde "Descontar noches"; al confirmar llama al endpoint y refresca la card con las noches actualizadas. Tests. Ruta: inline. Commit: `feat(frontend): add night discount popup with selectable date`.
- T6 (S3): Frontend — vista de historial (fecha y noches tomadas, con devoluciones) desde "Ver historial". Tests. Ruta: inline. Commit: `feat(frontend): show night movements history`.

## Log

- L1: "en una nueva branch vamos a implementar la funcionalidad para descontar una noche. Los requerimientos de descuesto es que se debe mostrar un popup para que se digite el numero de noches que se desean descontar, la fecha del dia de descuento se va almacenar y se debe seleccionar, por defecto se selecciona el dia de hoy. Quiero que analises todo para que tambien se pueda habilitar la funcionalidad del historia, mostrando la fecha y las noches que se han tomado. Es muy importante que se tenga muy encuenta que al realizar este descuento se debe deben adaptar las consultas o datos que tengan pendiente este historial cuando se visualicen las noches pendientes para disfrute por pare del accionista, teniendo en cuenta que las noches de beneficio vuelven a su estado nomral para todos los accionista el primero de enero del año en curso."
- L2: Decisiones del usuario: (1) el año de un descuento lo define la fecha seleccionada en el popup; (2) descuentos de años anteriores no restan (noches disponibles completas); (3) cualquier usuario autenticado puede descontar.
