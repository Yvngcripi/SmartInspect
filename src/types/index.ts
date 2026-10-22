export interface Dano {
  id: string;
  descripcion: string;
  fotos: string[]; // Empty in pre_inspeccion, populated in inspeccion
  ubicacion?: string; // e.g. 'Cielo', 'Muro', 'Piso', 'Ventana/Puerta', 'Exterior'
}

export interface Dependencia {
  id: string;
  nombre: string;
  largo: number; // in cm
  ancho: number; // in cm
  alto: number;  // in cm
  danos: Dano[];
  fotosGenerales: string[]; // General reference photos
}

export type EstadoInspeccion = 'borrador' | 'finalizada';
export type TipoInspeccion = 'inspeccion' | 'pre_inspeccion';

export interface Inspeccion {
  id: string;
  tipo: TipoInspeccion; // 'inspeccion' (required photos) or 'pre_inspeccion' (damage text only)
  siniestro: string; // Event type: 'Sismo', 'Rotura de cañería', 'Inundación', 'Filtración de aguas lluvias'
  banco: string; // Bank where the mortgage credit is held
  nombreCliente: string; // Client's full name
  rut: string; // National ID card (RUT)
  direccion: string; // Complete property address
  correo: string; // Client's email address
  fecha: string; // YYYY-MM-DD
  folioNumber?: number;
  estado: EstadoInspeccion;
  dependencias: Dependencia[];
  metrosCuadradosTotales: number;
}
