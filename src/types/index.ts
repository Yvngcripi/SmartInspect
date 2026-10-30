export type UserRole = 'inspector' | 'supervisor';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  cargo: string;
}

export interface Dano {
  id: string;
  descripcion: string;
  gravedad: 'leve' | 'moderada' | 'grave';
  fotos: string[]; // URIs o base64
}

export interface Dependencia {
  id: string;
  nombre: string; // ej: "Living-Comedor", "Dormitorio Principal", "Baño", "Cocina", "Fachada Norte"
  largo: number;
  ancho: number;
  alto: number;
  esFachadaOCierre?: boolean;
  fotosGenerales: string[];
  danos: Dano[];
}

export type EstadoInspeccion = 'borrador' | 'en_revision' | 'aprobada' | 'rechazada';

export interface Inspeccion {
  id: string;
  folioNumber: number;
  tipo: 'pre_inspeccion' | 'inspeccion_seguro';
  siniestro: string;
  banco: string;
  nombreCliente: string;
  rut: string;
  direccion: string;
  correo: string;
  fecha: string;
  estado: EstadoInspeccion;
  inspectorId: string;
  inspectorNombre: string;
  observacionesSupervisor?: string;
  fechaAprobacion?: string;
  dependencias: Dependencia[];
  metrosCuadradosTotales: number;
}

export interface DashboardStats {
  totalInspecciones: number;
  borradores: number;
  enRevision: number;
  aprobadas: number;
  rechazadas: number;
  totalM2: number;
  siniestrosPorBanco: { banco: string; count: number }[];
}
