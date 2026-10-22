# 🍀 HANDOVER — App El Trébol (Inspecciones)

> **Cómo continuar:** Abre este proyecto en Antigravity en tu PC Windows, abre un chat nuevo y escribe:
> *"Hola, vamos a continuar este proyecto. Lee el archivo HANDOVER.md para entrar en contexto y dime cómo seguimos."*

---

## 1. Descripción del Proyecto

**App El Trébol** es una aplicación móvil Android de inspecciones de siniestros para la empresa *Asesorías El Trébol*. Permite registrar inspecciones de viviendas con dependencias, daños, fotos y generar PDFs profesionales para compartir por WhatsApp.

- **Tipo:** App móvil Android (híbrida web)
- **Stack:** React + TypeScript + Vite + Capacitor (Android nativo)
- **Almacenamiento:** localForage (IndexedDB en WebView de Android)
- **PDF:** jsPDF + html2canvas
- **Compartir:** Capacitor Share Plugin
- **Fotos:** Capacitor Camera Plugin

---

## 2. Arquitectura del Código

```
el trebol/
├── src/
│   ├── App.tsx                    # Navegación principal (estado global)
│   ├── index.css                  # Estilos globales (dark mode, variables CSS)
│   ├── main.tsx                   # Entry point
│   ├── types/
│   │   └── index.ts               # Interfaces TypeScript (Inspeccion, Dependencia, Dano)
│   ├── db/
│   │   └── database.ts            # CRUD con localForage (inspectionStore + metadataStore)
│   ├── screens/
│   │   ├── FormInicialScreen.tsx  # Formulario nueva inspección
│   │   ├── InspeccionScreen.tsx   # Pantalla principal de trabajo (dependencias/daños)
│   │   ├── DetalleScreen.tsx      # Vista detalle + generar PDF + compartir
│   │   └── HistorialScreen.tsx    # Lista de inspecciones guardadas
│   ├── components/
│   │   ├── Header.tsx             # Cabecera de navegación
│   │   ├── InspectionCard.tsx     # Tarjeta resumen de inspección
│   │   ├── ImagePreviewGrid.tsx   # Grid de fotos con zoom
│   │   ├── ImageViewer.tsx        # Visor fullscreen de imágenes (swipe + teclado)
│   │   └── Toast.tsx              # Sistema de notificaciones toast
│   └── utils/
│       ├── pdfGenerator.ts        # Generador de PDF completo (jsPDF)
│       ├── areaHelper.ts          # Cálculo de M² por tipo de dependencia
│       └── imageCompressor.ts     # Compresión de imágenes antes de guardar
├── android/                       # Proyecto Android nativo (Capacitor)
│   └── app/src/main/
│       └── AndroidManifest.xml    # Configuración Android (portrait lock)
├── capacitor.config.ts            # Config de Capacitor
├── package.json
└── vite.config.ts
```

---

## 3. Modelos de Datos (Types)

```typescript
// src/types/index.ts

interface Dano {
  id: string;
  descripcion: string;
  fotos: string[];           // Base64 de imágenes
}

interface Dependencia {
  id: string;
  nombre: string;            // "Dormitorio", "Baño", "Fachada", etc.
  largo: number;
  ancho: number;
  alto: number;
  fotosGenerales: string[];  // Base64
  danos: Dano[];
}

interface Inspeccion {
  id: string;
  folioNumber?: number;      // Auto-incremental: #001, #002...
  tipo: 'pre_inspeccion' | 'inspeccion_seguro';
  nombreCliente: string;
  banco: string;
  siniestro: string;
  direccion?: string;
  fecha: string;             // ISO string
  dependencias: Dependencia[];
  metrosCuadradosTotales: number;
  estado: 'en_progreso' | 'completada';
}
```

---

## 4. Base de Datos (database.ts)

- Usa **localForage** con dos stores:
  - `inspectionStore`: datos completos de inspecciones (con fotos en base64)
  - `metadataStore`: índice ligero (sin fotos) para el historial

- **Funciones principales:**
  - `crearInspeccion(data)` → retorna `id`
  - `getInspeccionById(id)` → busca en inspectionStore, fallback a metadataStore
  - `updateInspeccion(id, data)` → actualiza ambos stores
  - `getAllInspecciones()` → lista desde metadataStore (rápido)
  - `deleteInspeccion(id)` → elimina de ambos stores
  - `completarInspeccion(id)` → cambia estado a 'completada'

---

## 5. Pantallas y Flujo

```
App inicia
  └─► HomeScreen (lista de inspecciones en_progreso)
        ├─► [+ Nueva] → FormInicialScreen → crea Inspeccion → InspeccionScreen
        ├─► [tarjeta] → InspeccionScreen (continuar)
        └─► [Historial] → HistorialScreen
              └─► [tarjeta] → DetalleScreen
                    ├─► Generar PDF → compartir por WhatsApp/correo
                    ├─► Compartir resumen de texto → WhatsApp
                    └─► Eliminar inspección
```

---

## 6. Funcionalidades Implementadas

### Core
- Crear/editar/eliminar inspecciones
- Agregar dependencias (habitaciones) con largo/ancho/alto
- Agregar daños dentro de cada dependencia
- Tomar/adjuntar múltiples fotos por dependencia y por daño
- Guardar automáticamente al cambiar de pantalla
- Búsqueda de dependencias en InspeccionScreen

### PDF
- Portada con logo, datos del cliente, folio, fecha
- Tabla ejecutiva de resumen (M² por dependencia)
- Página por dependencia con fotos
- Marca de agua diagonal "BORRADOR"
- Fachadas y cierres perimetrales NO suman M² (solo largo x alto)
- Auto-detección de formato de imagen (PNG/JPEG/WebP) para evitar crash
- Compartir PDF por WhatsApp/correo vía Capacitor Share

### UX/UI
- Dark mode (diseño verde/oscuro de marca)
- Sistema de Toast notifications
- Visor fullscreen de imágenes (swipe táctil + teclado)
- Folio numérico auto-incremental (#001, #002...)
- Contador de daños y fotos en tarjetas
- Compartir resumen de texto formateado para WhatsApp
- Confirmación de borrado inline (sin window.confirm)
- Pantalla bloqueada en modo retrato (AndroidManifest.xml)

---

## 7. Bugs Resueltos

| Bug | Causa | Fix |
|-----|-------|-----|
| App se cerraba al registrar muchas fotos | Acumulación de base64 en memoria | Compresión de imágenes antes de guardar (imageCompressor.ts) |
| Error al generar PDF de inspecciones completadas | getInspeccionById retornaba undefined | Fallback a metadataStore en database.ts |
| Botón "Agregar Dependencia" no aparecía | Se perdió en refactor de UI | Restaurado en header, estado vacío y barra inferior |
| PDF crasheaba con imágenes PNG | doc.addImage con formato hardcodeado 'JPEG' | Auto-detect formato desde data URL prefix |
| Fachadas sumaban M² incorrectamente | Se calculaba largo×ancho×alto igual que cuartos | isFachadaOCierre() retorna 0 M² en área total |
| Share cancel mostraba error | Capacitor lanzaba excepción al cancelar | Try/catch ignorando cancelación del usuario |

---

## 8. Cómo Compilar y Correr

### Desarrollo (web)
```bash
npm install
npm run dev
```

### Build para Android
```bash
npm run build
npx cap sync
# Luego abrir android/ en Android Studio y generar APK/AAB
```

### Comandos útiles
```bash
npx cap open android       # Abrir Android Studio
npx cap run android        # Correr en dispositivo conectado
```

---

## 9. Dependencias Clave

- @capacitor/core, android, camera, share, filesystem
- jspdf + html2canvas (PDF)
- localforage (almacenamiento)
- lucide-react (iconos)
- react 18 + typescript + vite 6

---

## 10. Estado Actual

**Estado:** ESTABLE — todos los bugs conocidos están corregidos.

**Último commit:** App El Trébol - Inspecciones completas con PDF, fotos y WhatsApp sharing

### Posibles mejoras futuras (no implementadas)
- Sincronización en la nube (Firebase/Supabase)
- Exportar a Excel además de PDF
- Firma digital del cliente en el PDF
- Plantillas de dependencias predefinidas por tipo de propiedad

---

## 11. Repositorio

- **GitHub:** https://github.com/Yvngcripi/app-el-trebol (privado)
- **Rama principal:** main

```bash
# Clonar en Windows:
git clone https://github.com/Yvngcripi/app-el-trebol.git
cd app-el-trebol
npm install
```

---

*Documento generado el 2026-10-22 — Asesorías El Trébol*
