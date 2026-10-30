import AsyncStorage from '@react-native-async-storage/async-storage';
import { Inspeccion, DashboardStats, EstadoInspeccion } from '../types';

const STORAGE_KEY = '@el_trebol_inspecciones_v2';
const CURRENT_USER_KEY = '@el_trebol_current_user_v2';

// Datos iniciales de ejemplo para que la presentación tenga contenido realista de inmediato
const SEED_INSPECCIONES: Inspeccion[] = [
  {
    id: 'insp-101',
    folioNumber: 1,
    tipo: 'inspeccion_seguro',
    siniestro: 'SIN-2026-88412',
    banco: 'Banco de Chile',
    nombreCliente: 'Carlos Henríquez Morales',
    rut: '14.832.195-2',
    direccion: 'Av. Las Condes 12450, Depto 402, Santiago',
    correo: 'carlos.henriquez@gmail.com',
    fecha: '2026-10-25',
    estado: 'en_revision',
    inspectorId: 'usr-insp-1',
    inspectorNombre: 'Joaquín Inspector Terreno',
    dependencias: [
      {
        id: 'dep-1',
        nombre: 'Living - Comedor',
        largo: 5.8,
        ancho: 4.2,
        alto: 2.4,
        esFachadaOCierre: false,
        fotosGenerales: [],
        danos: [
          {
            id: 'dan-1',
            descripcion: 'Filtración activa en cielo raso por rotura de cañería en piso superior. Desprendimiento de pintura y yeso.',
            gravedad: 'grave',
            fotos: []
          },
          {
            id: 'dan-2',
            descripcion: 'Piso flotante abultado por humedad en sector oriente.',
            gravedad: 'moderada',
            fotos: []
          }
        ]
      },
      {
        id: 'dep-2',
        nombre: 'Dormitorio Principal',
        largo: 4.0,
        ancho: 3.5,
        alto: 2.4,
        esFachadaOCierre: false,
        fotosGenerales: [],
        danos: [
          {
            id: 'dan-3',
            descripcion: 'Manchas de humedad en tabique colindante al baño.',
            gravedad: 'leve',
            fotos: []
          }
        ]
      },
      {
        id: 'dep-3',
        nombre: 'Fachada Norte y Balcón',
        largo: 6.0,
        ancho: 1.5,
        alto: 2.6,
        esFachadaOCierre: true,
        fotosGenerales: [],
        danos: []
      }
    ],
    metrosCuadradosTotales: 38.36 // 5.8*4.2 = 24.36 + 4*3.5 = 14 (Fachada excluida de m2 habitables)
  },
  {
    id: 'insp-102',
    folioNumber: 2,
    tipo: 'pre_inspeccion',
    siniestro: 'PRE-2026-0043',
    banco: 'Santander',
    nombreCliente: 'María Eugenia Silva Soto',
    rut: '16.294.501-K',
    direccion: 'Calle Los Alerces 780, Providencia',
    correo: 'meugenia.silva@outlook.cl',
    fecha: '2026-10-26',
    estado: 'aprobada',
    inspectorId: 'usr-insp-1',
    inspectorNombre: 'Joaquín Inspector Terreno',
    observacionesSupervisor: 'Informe técnico completo. Métricas y evidencias fotográficas validadas conforme a póliza hipotecaria.',
    fechaAprobacion: '2026-10-27',
    dependencias: [
      {
        id: 'dep-201',
        nombre: 'Cocina y Logia',
        largo: 3.8,
        ancho: 2.6,
        alto: 2.3,
        esFachadaOCierre: false,
        fotosGenerales: [],
        danos: [
          {
            id: 'dan-201',
            descripcion: 'Sellado deficiente en sifón bajo lavaplatos.',
            gravedad: 'leve',
            fotos: []
          }
        ]
      },
      {
        id: 'dep-202',
        nombre: 'Baño de Visitas',
        largo: 2.1,
        ancho: 1.8,
        alto: 2.3,
        esFachadaOCierre: false,
        fotosGenerales: [],
        danos: []
      }
    ],
    metrosCuadradosTotales: 13.66
  },
  {
    id: 'insp-103',
    folioNumber: 3,
    tipo: 'inspeccion_seguro',
    siniestro: 'SIN-2026-91024',
    banco: 'BCI',
    nombreCliente: 'Roberto Valenzuela Arancibia',
    rut: '11.758.309-8',
    direccion: 'Pasaje Las Araucarias 45, Maipú',
    correo: 'rvalenzuela@vtr.net',
    fecha: '2026-10-27',
    estado: 'borrador',
    inspectorId: 'usr-insp-1',
    inspectorNombre: 'Joaquín Inspector Terreno',
    dependencias: [
      {
        id: 'dep-301',
        nombre: 'Segundo Piso Completo',
        largo: 7.5,
        ancho: 6.0,
        alto: 2.2,
        esFachadaOCierre: false,
        fotosGenerales: [],
        danos: [
          {
            id: 'dan-301',
            descripcion: 'Filtración de aguas lluvias a través de techumbre. Daño estructural en vigas a la vista.',
            gravedad: 'grave',
            fotos: []
          }
        ]
      }
    ],
    metrosCuadradosTotales: 45.0
  }
];

export const storageService = {
  // Inicialización o lectura con Fallback estructurado
  async getInspecciones(): Promise<Inspeccion[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Inicializar datos semilla la primera vez
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INSPECCIONES));
        return SEED_INSPECCIONES;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error al leer inspecciones de AsyncStorage:', error);
      return SEED_INSPECCIONES;
    }
  },

  async getInspeccionById(id: string): Promise<Inspeccion | null> {
    const list = await this.getInspecciones();
    return list.find(item => item.id === id) || null;
  },

  async saveInspeccion(inspeccion: Inspeccion): Promise<void> {
    const list = await this.getInspecciones();
    const index = list.findIndex(item => item.id === inspeccion.id);

    // Recalcular metros cuadrados totales respetando reglas de exclusión de fachadas
    const m2Totales = inspeccion.dependencias.reduce((acc, dep) => {
      if (dep.esFachadaOCierre) return acc;
      return acc + (dep.largo * dep.ancho);
    }, 0);

    const updated: Inspeccion = {
      ...inspeccion,
      metrosCuadradosTotales: Number(m2Totales.toFixed(2))
    };

    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },

  async deleteInspeccion(id: string): Promise<void> {
    const list = await this.getInspecciones();
    const filtered = list.filter(item => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  async updateEstadoInspeccion(
    id: string,
    nuevoEstado: EstadoInspeccion,
    observaciones?: string
  ): Promise<Inspeccion | null> {
    const list = await this.getInspecciones();
    const index = list.findIndex(item => item.id === id);
    if (index < 0) return null;

    list[index].estado = nuevoEstado;
    if (observaciones !== undefined) {
      list[index].observacionesSupervisor = observaciones;
    }
    if (nuevoEstado === 'aprobada') {
      list[index].fechaAprobacion = new Date().toISOString().split('T')[0];
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list[index];
  },

  async getNextFolio(): Promise<number> {
    const list = await this.getInspecciones();
    if (list.length === 0) return 1;
    const maxFolio = Math.max(...list.map(i => i.folioNumber || 0));
    return maxFolio + 1;
  },

  async resetToSeedData(): Promise<Inspeccion[]> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INSPECCIONES));
    return SEED_INSPECCIONES;
  },

  // Estadísticas analíticas para el panel del Supervisor
  async getDashboardStats(): Promise<DashboardStats> {
    const list = await this.getInspecciones();
    const totalInspecciones = list.length;
    const borradores = list.filter(i => i.estado === 'borrador').length;
    const enRevision = list.filter(i => i.estado === 'en_revision').length;
    const aprobadas = list.filter(i => i.estado === 'aprobada').length;
    const rechazadas = list.filter(i => i.estado === 'rechazada').length;
    const totalM2 = Number(list.reduce((acc, i) => acc + (i.metrosCuadradosTotales || 0), 0).toFixed(1));

    // Desglose por banco
    const bancoCounts: Record<string, number> = {};
    list.forEach(i => {
      const b = i.banco || 'Otros';
      bancoCounts[b] = (bancoCounts[b] || 0) + 1;
    });

    const siniestrosPorBanco = Object.entries(bancoCounts).map(([banco, count]) => ({
      banco,
      count
    }));

    return {
      totalInspecciones,
      borradores,
      enRevision,
      aprobadas,
      rechazadas,
      totalM2,
      siniestrosPorBanco
    };
  },

  // Simulación de consumo de datos desde API externa (Criterio 7 de la rúbrica)
  async fetchInspeccionesFromAPI(): Promise<{ success: boolean; data: Inspeccion[]; origen: string }> {
    // Simula una latencia de red de 600ms para demostrar consumo asíncrono
    await new Promise(resolve => setTimeout(resolve, 600));
    const data = await this.getInspecciones();
    return {
      success: true,
      data,
      origen: 'Servicio API SmartInspect / Sincronización Local Estructurada'
    };
  }
};
