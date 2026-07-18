# 🏊 Alberca de Eventos — Panel de administración

Web App profesional, responsiva e instalable (PWA) para administrar las rentas
de una alberca para eventos: reservaciones, pagos, disponibilidad, reportes,
sincronización con **Google Calendar** y confirmación por **WhatsApp** (wa.me).

## Tecnologías

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (mobile‑first, modo oscuro)
- **MySQL** + **Prisma ORM**
- **Auth.js / NextAuth v5** con **Google OAuth**
- **Google Calendar API** (sincronización bidireccional)
- **PWA** instalable (manifest + service worker)
- Exportación de reportes a **PDF** (jsPDF) y **Excel** (ExcelJS)

## Funcionalidades

- **Dashboard**: reservaciones del mes, ingresos, pendientes por cobrar,
  próximas reservaciones, días ocupados y disponibles.
- **Reservaciones**: crear / editar / cancelar / eliminar, estados
  (Disponible, Apartado, Liquidado, Cancelado, Mantenimiento), precio sugerido
  según el día, **prevención de doble reservación**.
- **Clientes**: alta/edición/baja con validación.
- **Pagos**: anticipos, pagos parciales y pago final, historial y cálculo
  automático de total y saldo pendiente (liquida la reserva al completarse).
- **Calendario mensual** con eventos por color y detalle al hacer clic.
- **Configuración** persistida en BD: precios por día/temporada/festivos,
  horarios, anticipo mínimo, personas incluidas, capacidad máxima, costo por
  persona extra, amenidades (asador/mobiliario/baños), fechas bloqueadas y de
  mantenimiento, dirección y observaciones.
- **Reportes**: ingresos diarios/mensuales/anuales, reservaciones por mes,
  clientes frecuentes, export a PDF y Excel.
- **Google Calendar**: al crear/editar/cancelar una reservación se
  crea/actualiza/elimina el evento automáticamente.
- **WhatsApp**: botón "Confirmar por WhatsApp" que abre `wa.me` con el mensaje
  precargado (no se envía automáticamente).
- **Seguridad**: login con Google, protección de rutas, validación con Zod,
  confirmación antes de eliminar, manejo de errores.

## Requisitos

- Node.js 20.9+ (recomendado 20.19+ / 22+)
- MySQL 8 (local o gestionado)

## Puesta en marcha (local)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
#   - DATABASE_URL   -> tu MySQL
#   - AUTH_SECRET    -> openssl rand -base64 32
#   - ALLOW_DEV_LOGIN=true  (acceso local sin Google, solo para pruebas)

# 3. Crear el esquema en la base de datos
npm run db:push

# 4. (Opcional) Datos de ejemplo
npm run db:seed

# 5. Desarrollo
npm run dev
```

Abre http://localhost:3000. Con `ALLOW_DEV_LOGIN=true` puedes entrar con
cualquier correo (modo local). En producción, desactívalo y usa Google.

### MySQL rápido con Docker

```bash
docker run -d --name alberca-mysql -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=alberca -p 3306:3306 mysql:8.0
```

## Google OAuth + Calendar

1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   crea credenciales **OAuth 2.0** (tipo *Web application*).
2. Agrega la Redirect URI:
   `https://TU-DOMINIO/api/auth/callback/google`
   (en local: `http://localhost:3000/api/auth/callback/google`).
3. Habilita la **Google Calendar API** en el proyecto.
4. Copia el Client ID / Secret a `.env` (`GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`) y opcionalmente `GOOGLE_CALENDAR_ID`.
5. Inicia sesión con Google; la primera vez se solicita permiso de Calendar y
   se guarda el *refresh token* para sincronizar eventos.

> Si no se configuran las credenciales de Google, la app funciona igual: solo
> se omite la sincronización con Calendar (los eventos no se crean en Google).

## Scripts

| Script            | Descripción                                   |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo                        |
| `npm run build`   | Build de producción (genera Prisma Client)    |
| `npm run start`   | Servidor de producción                        |
| `npm run lint`    | ESLint                                         |
| `npm run typecheck` | Verificación de tipos (tsc)                 |
| `npm run db:push` | Sincroniza el esquema Prisma con MySQL        |
| `npm run db:seed` | Carga datos de ejemplo                         |

## Estructura

```
src/
  app/
    (app)/            # Rutas protegidas (dashboard, calendar, reservations, ...)
    api/              # Route handlers (REST)
    login/            # Inicio de sesión
    manifest.ts       # Manifest PWA
  components/         # UI, shell, toasts, tema
  lib/                # prisma, auth, pricing, availability, whatsapp, calendar
  proxy.ts           # Protección optimista de rutas (antes "middleware")
prisma/
  schema.prisma       # Modelos
  seed.ts             # Datos de ejemplo
```

## Notas

- Los montos se manejan como `Float` (MXN). Para cargas contables de alto
  volumen conviene migrar a `Decimal`.
- El service worker se registra solo en producción.
