# 📱 SmartInspect — Sistema Móvil de Inspecciones y Siniestros

**SmartInspect** es una aplicación móvil desarrollada con **React Native** y **TypeScript** para la gestión técnica, levantamiento en terreno y auditoría de siniestros habitacionales e hipotecarios para entidades aseguradoras y bancarias.

Proyecto desarrollado para la asignatura **Desarrollo de Aplicaciones Móviles con React Native** (Evaluación 2: Presentación MVP).

---

## 🚀 Tecnologías Utilizadas

- **Framework Móvil:** React Native 0.88.0 + Expo SDK 58
- **Lenguaje:** TypeScript 6.0 con verificación estricta de tipos (`strict: true`)
- **Navegación:**
  - `@react-navigation/native`
  - `@react-navigation/native-stack` (Stack Navigator jerárquico)
  - `@react-navigation/bottom-tabs` (Tab Navigator principal)
- **Persistencia Local:** `@react-native-async-storage/async-storage` con estructuras JSON serializadas y datos semilla
- **Iconos y Componentes Nativos:** `@expo/vector-icons` (Ionicons), `View`, `Text`, `TextInput`, `TouchableOpacity`, `ScrollView`, `FlatList`, `SafeAreaView`

---

## 👥 Sistema de 2 Roles de Usuario

La aplicación cuenta con control de acceso por inicio de sesión diferenciado para 2 perfiles:

1. **🛠️ Inspector de Terreno (Operativo):**
   - Registro de nuevas inspecciones con folio numérico incremental.
   - Medición dimensional de habitaciones ($M^2$) con algoritmo normativo (exclusión de fachadas y cierres del metraje habitable interior).
   - Levantamiento de daños técnicos con fotografías de evidencia (`expo-image-picker`).
   - Envío de expedientes al estado *"En Revisión"*.

2. **🛡️ Supervisor de Siniestros (Auditoría Técnica):**
   - Acceso exclusivo al **Dashboard de Métricas & KPIs** (gráficos porcentuales por banco mandante y $M^2$ globales auditados).
   - Dictamen técnico: **Aprobación** de siniestros o **Rechazo con observaciones técnicas**.
   - Acceso a simulación de consumo asíncrono de API externa.

---

## 🔑 Credenciales de Acceso Rápido

| Perfil | Correo | Contraseña |
|---|---|---|
| **Inspector** | `inspector@smartinspect.cl` | `smart2026` |
| **Supervisor** | `supervisor@smartinspect.cl` | `admin2026` |

*(La pantalla de inicio de sesión incluye tarjetas de acceso rápido con 1 solo toque).*

---

## 💻 Instrucciones de Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/SmartInspect.git
cd SmartInspect
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Ejecutar la aplicación

- **Modo Web (Navegador):**
  ```bash
  npm run web
  ```
  *(Se abrirá automáticamente en `http://localhost:8081` con vista adaptada para móvil).*

- **Modo Móvil con Expo Go (Android / iOS):**
  ```bash
  npx expo start
  ```
  *(Escanea el código QR desde la aplicación Expo Go en tu teléfono).*

---

## 📋 Cumplimiento de Rúbrica de Evaluación

- **Criterio 1 (Contexto):** Respaldo de problemática real y valor agregado documentado en `PRESENTACION_MVP.md`.
- **Criterio 2 (Planificación):** Cronograma de 4 Sprints y distribución técnica de tareas por integrante.
- **Criterio 3 (Interfaz):** 7 pantallas nativas implementadas en React Native puro con paleta de colores consistente.
- **Criterio 4 (Navegación):** Stack Navigation + Bottom Tab Navigation sin pantallas huérfanas ni caminos sin retorno.
- **Criterio 5 (Funcionalidades Core):** Login validado, CRUD completo de inspecciones, CRUD de dependencias/daños, filtros en tiempo real y cálculo normativo de $M^2$.
- **Criterio 6 (Roles):** 2 roles con vistas y permisos estrictamente diferenciados y protegidos por login.
- **Criterio 7 (Consumo de Datos):** Almacenamiento local estructurado en `AsyncStorage` y servicio de consumo asíncrono API.
- **Criterio 8 (Presentación Oral):** Guión técnico minuto a minuto preparado en `PRESENTACION_MVP.md`.
