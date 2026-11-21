# Food Store

Trabajo Práctico Integrador · Programación 4 · UTN (Tecnicatura Universitaria en Programación)

Tienda de comida con catálogo, carrito, pedidos y panel de administración.
Backend en **FastAPI + SQLModel + PostgreSQL** y frontend en **React + TypeScript + Tailwind**.

## Enlaces de la entrega

| Recurso | URL |
| --- | --- |
| Repositorio público en GitHub | https://github.com/EmmanuelJG/TPI_Prog4_FoodStore |
| Video de demostración (10 a 15 min) | https://www.youtube.com/watch?v=N6SikL_Wau8&t=2s |

## Requisitos

| Herramienta | Versión mínima | Nota |
| --- | --- | --- |
| Python | 3.11 | Probado con 3.13 |
| PostgreSQL | 14 | Probado con 16 |
| Node.js | 20.19 (o 22.12+) | Lo exige Vite 8 |
| pnpm | 9 | Probado con 10 |

## Estructura

```
.
├── README.md
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   └── app/
│       ├── main.py              # FastAPI, CORS y routers bajo /api/v1
│       ├── core/                # config, database, security, deps, Unit of Work, repositorio base
│       ├── db/seed.py           # carga inicial (admin, categorías y productos)
│       └── modules/             # auth, usuarios, categorias, productos, pedidos
│           └── <módulo>/        # models · schemas · repository · unit_of_work · service · router
└── frontend/
    ├── .env.example
    ├── package.json
    └── src/
        ├── features/            # auth, catalog, cart, orders, users, admin
        ├── routes/              # AppRouter, ProtectedRoute, PublicOnlyRoute
        ├── stores/              # Zustand: authStore y cartStore
        └── shared/              # api (Axios), ui, components, utils, hooks
```

## Backend

Todos los comandos se ejecutan desde la carpeta `backend/`.

### 1. Crear la base de datos

Con PostgreSQL en marcha, creá un usuario y una base (los nombres deben coincidir con `DATABASE_URL`):

```bash
psql -U postgres -c "CREATE USER foodstore WITH PASSWORD 'foodstore';"
psql -U postgres -c "CREATE DATABASE foodstore_db OWNER foodstore;"
```

### 2. Entorno virtual y dependencias

```bash
python -m venv venv

# Linux / macOS
source venv/bin/activate
# Windows (PowerShell)
venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### 3. Variables de entorno

Copiá el ejemplo y ajustá `DATABASE_URL` con tus credenciales:

```bash
cp .env.example .env          # Windows: copy .env.example .env
```

| Variable | Descripción | Valor de ejemplo |
| --- | --- | --- |
| `DATABASE_URL` | Conexión a la base | `postgresql://foodstore:foodstore@localhost:5432/foodstore_db` |
| `SECRET_KEY` | Clave para firmar el JWT (mínimo 32 caracteres; **COMPLETAR**) | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración de la sesión (cookie y token) | `30` |
| `FRONTEND_ORIGIN` | Origen permitido por CORS | `http://localhost:5173` |

### 4. Cargar los datos iniciales (seed)

```bash
python -m app.db.seed
```

Crea las tablas si no existen y carga el usuario administrador, 4 categorías y 8 productos con stock.
Es **idempotente**: se puede ejecutar varias veces sin duplicar datos.

### 5. Levantar el servidor

```bash
uvicorn app.main:app --reload
```

- API: <http://localhost:8000/api/v1>
- Documentación interactiva (Swagger): <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

## Frontend

Todos los comandos se ejecutan desde la carpeta `frontend/`.

```bash
cp .env.example .env          # Windows: copy .env.example .env
pnpm install
pnpm build
pnpm dev
```

| Variable | Descripción | Valor de ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API del backend | `http://localhost:8000/api/v1` |

La aplicación queda en <http://localhost:5173>. Ese puerto es el que el backend permite en CORS por defecto
(`FRONTEND_ORIGIN`); si lo cambiás, actualizá también esa variable.

`pnpm build` compila con TypeScript en modo estricto y genera `dist/`. No hace falta para desarrollar,
pero sirve para comprobar que el proyecto compila sin errores.

## Usuario administrador (seed)

| Campo | Valor |
| --- | --- |
| Usuario | `admin` |
| Contraseña | `Admin1234!` |
| Email | `admin@foodstore.com` |
| Rol | `admin` |

Los clientes se crean desde la pantalla **Registrarse** (el registro público siempre crea rol `user`).

## Qué hace cada rol

**Visitante**: ve el catálogo (búsqueda, filtro por categoría, paginación), se registra e inicia sesión.

**Cliente (`user`)**: arma el carrito, confirma el pedido (dirección, forma de pago, notas), ve sus pedidos
y cancela los que están pendientes.

**Administrador (`admin`)**: gestiona pedidos (cambio de estado, cancelación, resumen del día),
productos (alta, edición, ajuste de stock y disponibilidad, baja), categorías y usuarios (activar y desactivar).

## Reglas de negocio

| Regla | Descripción |
| --- | --- |
| RN-01 | Un pedido solo se crea con productos activos, disponibles y con stock suficiente. El stock se descuenta al crearlo y no se admiten productos repetidos. La creación es atómica: si algo falla no se guarda nada. |
| RN-02 | Estados: `PENDIENTE → EN_PREPARACION → ENTREGADO`, y `CANCELADO` desde `PENDIENTE` o `EN_PREPARACION`. `ENTREGADO` y `CANCELADO` son terminales. Cualquier otra transición responde 400. |
| RN-03 | Al cancelar un pedido se restituye el stock de todas sus líneas, en la misma transacción. |
| RN-04 | El cliente solo ve y cancela sus propios pedidos (y solo en `PENDIENTE`). El admin ve todos y cambia el estado. |
| RN-05 | Cada línea guarda una copia del nombre y del precio del producto al momento de la compra, y el total queda fijo: no cambia si el producto se edita o se elimina después. |
| RN-06 | La forma de pago es `EFECTIVO` o `TRANSFERENCIA`. |

Las categorías, los productos y los usuarios no se borran: tienen **baja lógica** (`activo` / `disabled`).
Dar de baja una categoría no libera su nombre único ni oculta sus productos.

## Endpoints principales

Todos bajo el prefijo `/api/v1`.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/auth/register` | Público | Registro (rol `user`) |
| POST | `/auth/token` | Público | Login; deja el JWT en una cookie HttpOnly |
| POST | `/auth/logout` | Público | Cierra la sesión |
| GET | `/auth/me` | Sesión | Usuario actual |
| GET | `/categorias`, `/categorias/{id}` | Público | Categorías activas |
| POST, PUT, DELETE | `/categorias`, `/categorias/{id}` | Admin | Alta, edición y baja lógica |
| GET | `/productos` | Público | Listado paginado: `page`, `size`, `search`, `categoria_id`, `disponible` |
| GET | `/productos/{id}` | Público | Detalle |
| POST, PUT, DELETE | `/productos`, `/productos/{id}` | Admin | Alta, edición y baja lógica |
| PATCH | `/productos/{id}/stock` | Admin | Ajusta `stock` y `disponible` |
| POST | `/pedidos` | Sesión | Crea un pedido |
| GET | `/pedidos`, `/pedidos/{id}` | Sesión | Propios (cliente) o todos (admin) |
| PATCH | `/pedidos/{id}/cancelar` | Dueño | Cancela un pedido `PENDIENTE` |
| PATCH | `/pedidos/{id}/estado` | Admin | Cambia el estado |
| GET | `/pedidos/resumen` | Admin | Conteos por estado, pedidos de hoy e ingresos |
| GET | `/admin/usuarios` | Admin | Lista de usuarios |
| POST | `/admin/usuarios/{id}/activar`, `/desactivar` | Admin | Baja lógica de usuarios |

## Decisiones técnicas

- **Sesión con cookie HttpOnly**: el JWT nunca llega al JavaScript del navegador ni a `localStorage`. El frontend
  consulta `GET /auth/me` al arrancar y Axios envía las credenciales con `withCredentials`.
- **Capas por módulo**: router → service → repository, con un **Unit of Work** que abre la sesión, confirma o
  revierte la transacción y la cierra. Las reglas de negocio viven en el service.
- **Concurrencia**: al crear o cancelar un pedido se leen los productos con `SELECT … FOR UPDATE`, para que dos
  pedidos simultáneos no vendan el mismo stock.
- **Fechas**: se guardan en UTC y el frontend las muestra en la hora local del navegador.
- **Frontend por features**: estado del servidor con TanStack Query, formularios con TanStack Form, tablas del
  panel con TanStack Table y estado global (sesión y carrito) con Zustand. Las rutas se protegen por rol y el
  panel de administración se carga solo cuando entra un admin.

## Problemas frecuentes

- **`password authentication failed` o `connection refused` al iniciar el backend**: revisá `DATABASE_URL` y que
  PostgreSQL esté corriendo.
- **El navegador muestra errores de CORS o el login no mantiene la sesión**: el frontend debe correr en
  `http://localhost:5173` (o el valor de `FRONTEND_ORIGIN`) y la API en `localhost`, no en `127.0.0.1`.
- **`pnpm dev` falla porque el puerto 5173 está ocupado**: el puerto es fijo a propósito por el CORS; cerrá el
  proceso que lo usa.
