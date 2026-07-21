# Alberca Santo Niño — Sistema de Gestión y Reservaciones

Sistema web completo desarrollado con Next.js 16 (App Router), Supabase (PostgreSQL + Auth + Storage) y TailwindCSS para la administración y reservación de la **Alberca Santo Niño**.

---

## 🌟 Características Principales

### 📱 Cliente y Público
- **Landing Page Dinámica:** Hero con carrusel de fotografías, información editable de la alberca, precios y horarios.
- **Calendario de Disponibilidad:** Visualización mensual interactiva con codificación de colores según el estatus de la fecha (Disponible, Apartado, Abono, Pagado, Promoción, Mantenimiento).
- **Reservación Directa vía WhatsApp:** Selección de fecha con pre-llenado de datos (nombre y WhatsApp) y generación de enlace directo `wa.me` a los administradores.
- **Panel del Cliente (`/mi-cuenta`):** Consulta del estado de reservaciones, desglose de montos y barra de avance de pago.
- **Comprobantes de Pago:** Carga de imágenes y PDFs de comprobantes de pago/transferencias.

### 🔑 Panel de Administración (`/admin`)
- **Dashboard de Métricas:** Resumen de ingresos mensuales, número de clientes, total de costos y pagos pendientes.
- **Calendario Administrativo (`/admin/calendario`):** Vista completa del calendario con panel lateral para validar pagos, marcar reservaciones como pagadas o recordar cobros mediante WhatsApp pre-redactado.
- **Gestión de Reservaciones (`/admin/reservaciones`):** Tabla con filtros por estatus, búsqueda y creación rápida de apartados.
- **Catálogo de Clientes (`/admin/clientes`):** Listado de usuarios con historial de reservaciones desplegable y enlace directo a WhatsApp.
- **Pagos Pendientes (`/admin/pagos`):** Seguimiento de usuarios con apartados o abonos parciales, vista previa del mensaje de WhatsApp antes de enviarlo y validación rápida.
- **Costos y Facturas (`/admin/costos`):** Registro de gastos de mantenimiento, compras o pago a proveedores con carga de recibos/facturas adjuntas.
- **Eventos y Promociones (`/admin/eventos`):** Creación de descuentos y precios especiales o bloqueo de fechas por mantenimiento.
- **Configuración del Sitio (`/admin/configuracion`):** Edición de imágenes del carrusel, textos principales, precios base, datos bancarios para transferencias y gestión de números de administradores.

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router + React Server Components)
- **Base de Datos & Autenticación:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Almacenamiento de Archivos:** Supabase Storage (`alberca-files`)
- **Estilos:** Vanilla CSS (Design System Tokens) + TailwindCSS
- **Iconos:** Lucide React
- **Despliegue:** Vercel

---

## 🚀 Despliegue en Vercel

1. Subir el código a GitHub.
2. Importar el proyecto en [Vercel](https://vercel.com).
3. Configurar las siguientes **Variables de Entorno** en el panel de Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://oljblmcwebhtqwhqbceg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

4. ¡Desplegar! 🚀
