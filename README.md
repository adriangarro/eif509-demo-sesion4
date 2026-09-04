# EIF509 · Demo Sesión 4 — MongoDB junto a PostgreSQL (persistencia políglota)

Repositorio de demostración del curso **EIF509 "Desarrollo de Aplicaciones
Basadas en Web"** (Universidad Nacional, Costa Rica).

Esta demo continúa el sistema de pedidos de la
[Sesión 3 (PostgreSQL + Flyway)](https://github.com/adriangarro/eif509-demo-sesion3):
ahora agregamos **MongoDB** al lado de PostgreSQL y aplicamos los criterios
para decidir cuándo conviene una base documental.

## ¿Qué van a construir?

Al final de esta guía tendrán:

- **Dos bases de datos en ejecución simultánea en Docker**: PostgreSQL 16 (el
  núcleo transaccional de pedidos, visto en la Sesión 3) y MongoDB 7
  (la parte documental). A esto se le llama **persistencia políglota**:
  cada subdominio usa el tipo de base que mejor se ajusta a sus necesidades.
- Una colección `bitacora_pedidos` donde cada documento guarda el
  historial de un pedido como un **arreglo anidado de eventos**: lo que
  en el modelo relacional serían dos tablas con JOIN, aquí se almacena en un
  solo documento.
- Consultas que buscan **dentro de esos arreglos anidados** con la
  notación de punto (`"eventos.tipo"`), el momento clave de la demo.

## Requisitos previos

| Herramienta | Versión mínima | Descarga oficial | Cómo verificar |
|---|---|---|---|
| Docker Desktop (incluye Docker Compose) | 4.x | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) | `docker --version` |
| MongoDB Compass (interfaz gráfica, recomendado) | 1.40 | [mongodb.com/products/tools/compass](https://www.mongodb.com/products/tools/compass) | Se abre la aplicación |
| mongosh (alternativa por terminal) | 2.0 | [mongodb.com/docs/mongodb-shell](https://www.mongodb.com/docs/mongodb-shell/) | `mongosh --version` |
| Git | 2.30 | [git-scm.com/downloads](https://git-scm.com/downloads) | `git --version` |

Notas por sistema operativo:

- **Windows**: Docker Desktop requiere **WSL2** habilitado (el instalador
  lo indica y guía). Ejecuten los comandos de esta guía en PowerShell o en
  la terminal de WSL2.
- **macOS**: si usan Homebrew, pueden instalar todo con
  `brew install --cask docker-desktop mongodb-compass` y `brew install mongosh`.
- **Linux**: en lugar de Docker Desktop pueden usar Docker Engine con el
  plugin de Compose (`docker compose`, sin guion).
- **mongosh** viene incluido dentro de Compass (pestaña `_MONGOSH` en la
  parte inferior), así que si instalan Compass no necesitan instalarlo
  aparte; solo lo necesitan por separado si prefieren trabajar únicamente
  en la terminal.

No necesitan instalar PostgreSQL ni MongoDB en su máquina: ambos corren
dentro de contenedores Docker.

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/adriangarro/eif509-demo-sesion4.git
cd eif509-demo-sesion4
```

### 2. Verificar que Docker Desktop está en ejecución

Abran Docker Desktop y esperen a que el ícono de la ballena quede estable
(en verde). Para confirmarlo desde la terminal:

```bash
docker info
```

Si responde con información del servidor (versión, contenedores, etc.),
está en ejecución. Si ven `Cannot connect to the Docker daemon`, Docker
Desktop no está abierto: ábranlo y esperen unos segundos antes de
reintentar.

### 3. Levantar los dos servicios

```bash
docker compose up -d
```

La bandera `-d` (*detached*) deja los contenedores en ejecución en segundo
plano y les devuelve la terminal. La **primera vez** Docker descarga las
imágenes `postgres:16` y `mongo:7` (varios cientos de MB; puede tardar
unos minutos según su conexión). Las siguientes veces arranca en
segundos.

### 4. Verificar que ambos contenedores están en ejecución

```bash
docker ps
```

Salida esperada — **dos** contenedores en estado `Up`:

```text
CONTAINER ID   IMAGE         COMMAND                  CREATED         STATUS         PORTS                                             NAMES
f0fd2b270255   postgres:16   "docker-entrypoint.s…"   6 seconds ago   Up 5 seconds   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp       eif509-demo-sesion4-db-1
cd852b7e7447   mongo:7       "docker-entrypoint.s…"   6 seconds ago   Up 5 seconds   0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp   eif509-demo-sesion4-mongo-1
```

Si solo aparece uno (o ninguno), revisen la sección
[Solución de problemas](#solución-de-problemas).

### 5. Conectarse a MongoDB

**Vía A — Compass (gráfica, recomendada):**

1. Abran MongoDB Compass.
2. En la pantalla de conexión, usen la cadena:

   ```text
   mongodb://localhost:27017
   ```

3. Botón **Connect**.
4. Al conectar verán la lista de bases internas (`admin`, `config`,
   `local`). La base `eif509` aparecerá **después** de ejecutar el script
   de inserción del paso 6.

**Vía B — mongosh (terminal):**

```bash
mongosh
```

Sin argumentos se conecta a `localhost:27017`. Deben ver el prompt
`test>`. Salgan con `exit` o `Ctrl+D` cuando lo deseen.

## Ejecución de la demo

### 6. Insertar los documentos

Desde la **raíz del repositorio**:

```bash
mongosh --quiet < mongo/01-insertar-documentos.mongodb.js
```

Salida esperada (los `ObjectId` serán distintos en cada máquina):

```text
eif509> {
  acknowledged: true,
  insertedId: ObjectId('6a7bd5c533876fa790182958')
}
eif509> {
  acknowledged: true,
  insertedIds: {
    '0': ObjectId('6a7bd5c533876fa790182959'),
    '1': ObjectId('6a7bd5c533876fa79018295a'),
    '2': ObjectId('6a7bd5c533876fa79018295b')
  }
}
```

`acknowledged: true` significa que MongoDB confirmó la escritura. El
`insertOne` creó el pedido de Ana Rojas (el ejemplo de la clase) y el
`insertMany` agregó tres pedidos más.

*Alternativa en Compass*: abran el archivo
`mongo/01-insertar-documentos.mongodb.js`, copien su contenido y péguenlo
en la pestaña `_MONGOSH` (parte inferior de Compass), o en un playground
si usan la extensión MongoDB de VS Code.

### 7. Ver los documentos creados

**En Compass**: refresquen (ícono de recarga junto a "Databases") →
base **eif509** → colección **bitacora_pedidos**. Verán 4 documentos;
expandan cualquiera para ver el arreglo `eventos` anidado adentro.

**En mongosh**:

```bash
mongosh
```

```javascript
use eif509
db.bitacora_pedidos.find()
```

Deben aparecer los 4 documentos, cada uno con su arreglo `eventos`.

### 8. Ejecutar las consultas

Desde la raíz del repositorio:

```bash
mongosh --quiet < mongo/02-consultas.mongodb.js
```

El script ejecuta 4 consultas. Qué observar en cada una:

1. **`{ cliente: "Ana Rojas" }`** — filtro por campo simple, equivalente
   a un `WHERE` de SQL. Devuelve 1 documento.
2. **`{ "eventos.tipo": "pagado" }`** — el momento clave: la **notación
   de punto** busca **dentro del arreglo anidado**. Devuelve los 3
   pedidos que tienen al menos un evento `"pagado"` (los de Ana, Carmen
   y el 1004 de Luis). En SQL esto habría requerido un JOIN contra una
   tabla de eventos; aquí es una consulta directa sobre el documento.
3. **Proyección** `{ pedido_id: 1, cliente: 1, _id: 0 }` — obtener solo
   los campos que interesan. Devuelve los 4 documentos pero únicamente
   con `pedido_id` y `cliente`.
4. **`countDocuments({ "eventos.tipo": "enviado" })`** — contar sin
   recuperar documentos. Devuelve `1` (solo el pedido de Carmen Solís fue
   enviado).

## Comandos útiles

| Acción | Comando |
|---|---|
| Levantar los servicios | `docker compose up -d` |
| Detener (conserva los datos) | `docker compose down` |
| Detener **eliminando los datos** | `docker compose down -v`; úsenlo para reiniciar la demo desde cero o si insertaron datos duplicados |
| Ver logs de MongoDB | `docker compose logs -f mongo` |
| Ver logs de PostgreSQL | `docker compose logs -f db` |
| Reiniciar desde cero | `docker compose down -v && docker compose up -d` |

Importante: si ejecutan el script de inserción dos veces sin reiniciar, los
documentos quedan duplicados (MongoDB genera un `_id` nuevo cada vez).
Solución: `docker compose down -v`, levantar de nuevo e insertar una vez.

## Solución de problemas

| Problema | Causa | Solución |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop no está en ejecución | Abrir Docker Desktop y esperar el ícono estable; reintentar |
| `port is already allocated` en 27017 | Ya hay un MongoDB local en ejecución | En `docker-compose.yml` cambiar a `"27018:27017"` y conectarse con `mongodb://localhost:27018` (Compass) o `mongosh --port 27018` |
| `port is already allocated` en 5432 | Ya hay un PostgreSQL local en ejecución | En `docker-compose.yml` cambiar a `"5433:5432"` |
| Compass no se conecta | El contenedor no está en ejecución, o el puerto cambió | Verificar con `docker ps` que `mongo` está `Up` y que la cadena de conexión usa el puerto correcto |
| La imagen no descarga (red lenta o caída) | Problemas de conexión | Descargar de previo con `docker compose pull` desde una conexión estable (por ejemplo, antes de la clase) |
| `mongosh: command not found` | mongosh no instalado o no está en el PATH | Instalarlo (ver Requisitos previos) o usar la pestaña `_MONGOSH` de Compass |

## Relación con el Laboratorio 2

Este repositorio muestra la **mecánica**: levantar ambas bases, insertar
documentos anidados y consultarlos. En el Laboratorio 2 ustedes deben
elegir su **propio subdominio documental** dentro de su proyecto y
**justificar** la decisión de incrustar (documento anidado) o referenciar
(colecciones separadas), según los criterios vistos en clase.

---

> **Material de referencia del curso.** El esquema de su laboratorio debe
> nacer de su propio dominio; no copien este ejemplo.
