import localforage from 'localforage';
import type { Inspeccion } from '../types';

// Configure main full store (contains dependencias + photos)
const inspectionStore = localforage.createInstance({
  name: 'AsesoriasElTrebol',
  storeName: 'inspecciones',
  description: 'Base de datos local completa (con fotos y detalles)'
});

// Configure lightweight metadata store (contains dependencias count and info, but NO photos)
const metadataStore = localforage.createInstance({
  name: 'AsesoriasElTrebol',
  storeName: 'inspecciones_metadata',
  description: 'Base de datos optimizada en memoria para listados sin fotos'
});

/**
 * Creates a lightweight clone of the inspection by stripping large Base64 photo payloads.
 */
function getMiniInspeccion(inspeccion: Inspeccion): Inspeccion {
  return {
    ...inspeccion,
    dependencias: inspeccion.dependencias ? inspeccion.dependencias.map(dep => ({
      ...dep,
      fotosGenerales: [],
      danos: dep.danos ? dep.danos.map(dano => ({
        ...dano,
        fotos: []
      })) : []
    })) : []
  };
}

export const db = {
  /**
   * Get all inspections from IndexedDB, sorted chronologically (newest first).
   * This uses the metadata store (no photo strings) to prevent WebView Out of Memory (OOM) crashes.
   */
  async getAllInspecciones(): Promise<Inspeccion[]> {
    try {
      // One-time migration: ensure every key in the main store also exists in the metadata store
      // Per-key check prevents stuck state if a previous migration was interrupted
      const metaKeys = await metadataStore.keys();
      const mainKeys = await inspectionStore.keys();
      const metaKeySet = new Set(metaKeys);

      for (const key of mainKeys) {
        if (!metaKeySet.has(key)) {
          // This key is in main but missing from metadata — migrate it
          const item = await inspectionStore.getItem<Inspeccion>(key);
          if (item) {
            const mini = getMiniInspeccion(item);
            await metadataStore.setItem(key, mini);
          }
        }
      }

      // 2. Fetch lightweight records
      const keys = await metadataStore.keys();
      const inspections: Inspeccion[] = [];
      
      for (const key of keys) {
        const item = await metadataStore.getItem<Inspeccion>(key);
        if (item) {
          inspections.push(item);
        }
      }
      
      // Sort: Newest date first.
      return inspections.sort((a, b) => {
        const timeA = a.fecha ? new Date(a.fecha).getTime() : 0;
        const timeB = b.fecha ? new Date(b.fecha).getTime() : 0;
        const dateA = isNaN(timeA) ? 0 : timeA;
        const dateB = isNaN(timeB) ? 0 : timeB;
        return dateB - dateA || b.id.localeCompare(a.id);
      });
    } catch (error) {
      console.error('Error fetching inspections from IndexedDB:', error);
      return [];
    }
  },

  /**
   * Get a single inspection by its ID. (Loads full dependencias and base64 photos for active review/edit).
   * Falls back to metadataStore if full record is missing.
   */
  async getInspeccionById(id: string): Promise<Inspeccion | null> {
    try {
      const full = await inspectionStore.getItem<Inspeccion>(id);
      if (full) return full;
      // Fallback to metadata store if full store item is missing
      const mini = await metadataStore.getItem<Inspeccion>(id);
      return mini;
    } catch (error) {
      console.error(`Error fetching inspection with ID ${id} from main store:`, error);
      try {
        return await metadataStore.getItem<Inspeccion>(id);
      } catch (e) {
        return null;
      }
    }
  },

  /**
   * Save or update an inspection in IndexedDB.
   * Saves the full record to the main store and a stripped version to the metadata store.
   */
  async saveInspeccion(inspeccion: Inspeccion): Promise<void> {
    try {
      // Save full object
      await inspectionStore.setItem(inspeccion.id, inspeccion);
      
      // Save lightweight metadata clone
      const mini = getMiniInspeccion(inspeccion);
      await metadataStore.setItem(inspeccion.id, mini);
    } catch (error) {
      console.error('Error saving inspection to IndexedDB:', error);
      throw error;
    }
  },

  /**
   * Delete an inspection by its ID.
   */
  async deleteInspeccion(id: string): Promise<void> {
    try {
      await inspectionStore.removeItem(id);
      await metadataStore.removeItem(id);
    } catch (error) {
      console.error(`Error deleting inspection with ID ${id}:`, error);
      throw error;
    }
  }
};
export default db;
