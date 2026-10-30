# 🍀 ESTRUCTURA DE PRESENTACIÓN CANVA (MÁXIMO 8 DIAPOSITIVAS)
### App El Trébol — Siniestros e Inspecciones Técnicas
**Asignatura:** Desarrollo de Aplicaciones Móviles con React Native  
**Evaluación 2:** Presentación MVP  

---

## 🎨 GUÍA DE ESTILO PARA CANVA
* **Paleta de Colores:**
  * Fondo principal: Blanco `#FFFFFF` o Gris muy suave `#F8FAFC`.
  * Verde Institucional (Primario): `#064E3B` (Verde bosque) y `#059669` (Esmeralda).
  * Acentos de rol: Morado `#7C3AED` (Supervisor) y Verde Menta `#D1FAE5`.
* **Tipografía recomendada en Canva:** *Montserrat*, *Inter* o *Poppins* (Títulos en Bold / Negrita, texto en Regular).

---

## 📄 DIAPOSITIVA 1: Portada
* **Título:** App El Trébol
* **Subtítulo:** Sistema Móvil de Inspecciones y Siniestros Habitacionales
* **Etiqueta superior:** EVALUACIÓN 2 — PRESENTACIÓN MVP
* **Datos al pie:**
  * Asignatura: Desarrollo de Aplicaciones Móviles con React Native
  * Empresa: Asesorías El Trébol SpA
  * Integrantes: Joaquín C. y Equipo
* **Elemento visual Canva:** Mockup de un celular con la app o el logo de trébol verde.

---

## 📄 DIAPOSITIVA 2: Problemática en Terreno (Criterio 1)
* **Título:** El Desafío en la Liquidación de Siniestros
* **3 Puntos Clave:**
  1. **Toma de datos en papel:** Pérdida de notas en terreno y retraso de 3 a 5 días hábiles en transcribir antecedentes.
  2. **Discrepancias en $M^2$:** Errores humanos al sumar áreas de fachadas y cierres perimetrales a la superficie habitable interior.
  3. **Falta de auditoría previa:** Informes enviados a aseguradoras sin control de calidad técnico, generando rechazos bancarios.
* **Elemento visual Canva:** Íconos de advertencia, documentos con tachaduras y reloj de retraso.

---

## 📄 DIAPOSITIVA 3: Propuesta de Valor y Público Objetivo (Criterio 1)
* **Título:** Nuestra Solución y Mercado Objetivo
* **Público Objetivo:**
  * **Peritos e Inspectores:** Levantamiento ágil de datos y evidencias en terreno.
  * **Supervisores de Siniestros:** Auditoría técnica previa a la indemnización.
  * **Entidades Mandantes:** Banco de Chile, Santander, BCI y aseguradoras asociadas.
* **Propuesta de Valor:**
  * Digitalización 100% móvil y cálculo automático de superficies normadas.
  * Trazabilidad fotográfica por cada daño individual.
  * Operatividad garantizada en terreno (modo offline con persistencia local).
* **Elemento visual Canva:** Gráfico comparativo Antes (Papel/Desorden) vs Después (App El Trébol).

---

## 📄 DIAPOSITIVA 4: Stack Tecnológico y Arquitectura (Criterios 3 y 4)
* **Título:** Tecnologías Oficiales de la Asignatura
* **Columna Izquierda (Tecnologías Core):**
  * **React Native 0.88.0 + Expo SDK 58:** Desarrollo nativo multiplataforma.
  * **TypeScript 6.0 Estricto:** Tipado robusto en modelos e interfaces sin errores de compilación (`0 errors`).
  * **AsyncStorage:** Almacenamiento local estructurado en JSON.
* **Columna Derecha (Arquitectura de Navegación):**
  * **Stack Navigation:** Flujo jerárquico (Lista $\rightarrow$ Detalle $\rightarrow$ Dependencias $\rightarrow$ Edición).
  * **Bottom Tab Navigation:** 4 accesos directos con badges interactivos.
  * **Total:** 7 pantallas funcionales sin rutas huérfanas.
* **Elemento visual Canva:** Logos de React Native, TypeScript, Expo y diagrama de árbol de pantallas.

---

## 📄 DIAPOSITIVA 5: Doble Rol de Usuario y Permisos (Criterio 6)
* **Título:** Seguridad y Diferenciación de Roles
* **Tarjeta 1 — Inspector de Terreno (Operativo):**
  * Registro de nuevas inspecciones.
  * Medición dimensional de habitaciones ($M^2$) y registro de daños con fotos.
  * Envío de informe a estado *"En Revisión"*.
* **Tarjeta 2 — Supervisor de Siniestros (Auditoría):**
  * Acceso exclusivo al **Dashboard de KPIs** y gráficos por banco.
  * Dictamen técnico: **Aprobación** o **Rechazo con observaciones**.
  * Restricción estricta: Separación total protegida por inicio de sesión formal.
* **Elemento visual Canva:** Dos tarjetas divididas: una verde (Inspector) y una morada (Supervisor) con íconos de escudo y credencial.

---

## 📄 DIAPOSITIVA 6: Funcionalidades Core y Reglas de Negocio (Criterios 5 y 7)
* **Título:** Funcionalidades Operativas Implementadas
* **Grid de 4 Módulos:**
  1. **Login y Autenticación:** Validación de credenciales corporativas y control de sesiones.
  2. **CRUD Completo:** Creación, lectura, edición y eliminación de inspecciones y dependencias.
  3. **Filtros en Vivo:** Búsqueda en tiempo real por asegurado, siniestro, RUT, banco y estado.
  4. **Motor Normativo de $M^2$:** Algoritmo que calcula superficie y **excluye fachadas y cierres** del metraje habitable.
* **Elemento visual Canva:** Capturas de pantalla reales de la app mostrando las tarjetas con badges y el buscador.

---

## 📄 DIAPOSITIVA 7: Planificación y Distribución del Equipo (Criterio 2)
* **Título:** Metodología y Estado de Avance
* **Sprint Roadmap (Metodología Ágil):**
  * *Sprint 1:* Requerimientos y modelo de datos $\rightarrow$ **100%**
  * *Sprint 2:* Arquitectura React Native y Navegación $\rightarrow$ **100%**
  * *Sprint 3:* Roles, AsyncStorage y Cálculo $M^2$ $\rightarrow$ **100%**
  * *Sprint 4 (Actual):* Validación MVP y pruebas $\rightarrow$ **100%**
* **Distribución de Roles:**
  * **Joaquín C.:** Líder Técnico & Desarrollo Frontend React Native.
  * **Integrante 2:** Arquitectura de Datos, AsyncStorage y Modelos.
  * **Integrante 3:** Diseño UX/UI, Dashboard de Supervisión y Filtros.
* **Elemento visual Canva:** Barra de progreso de Sprints y tabla de tareas por integrante.

---

## 📄 DIAPOSITIVA 8: Demostración en Vivo y Conclusión (Criterio 8)
* **Título:** Demostración MVP y Ronda de Preguntas
* **Pasos de la Demo en Vivo:**
  1. *Login corporativo y selección de rol.*
  2. *Búsqueda y filtros por banco (Banco de Chile / Santander).*
  3. *Levantamiento técnico de $M^2$ y registro de daños.*
  4. *Cierre de sesión, ingreso como Supervisor y aprobación del siniestro.*
* **Texto de Cierre:**
  * *"Cumplimiento del 100% de los criterios técnicos de la rúbrica oficial."*
  * **¡Muchas gracias! ¿Preguntas?**
* **Elemento visual Canva:** Mockup final de la app con el equipo y espacio para preguntas.
