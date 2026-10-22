import React, { useState, useEffect } from 'react';
import { Search, Plus, ClipboardList, CheckCircle2, FileText } from 'lucide-react';
import { Header } from '../components/Header';
import { InspectionCard } from '../components/InspectionCard';
import { db } from '../db/database';
import type { Inspeccion } from '../types';

interface HistorialScreenProps {
  onNewInspection: () => void;
  onSelectInspection: (id: string) => void;
}

export const HistorialScreen: React.FC<HistorialScreenProps> = ({ onNewInspection, onSelectInspection }) => {
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'borradores' | 'completadas'>('borradores');

  useEffect(() => {
    const loadInspecciones = async () => {
      try {
        const data = await db.getAllInspecciones();
        setInspecciones(data);
      } catch (error) {
        console.error('Error loading inspections:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInspecciones();
  }, []);

  const filteredInspecciones = inspecciones.filter((ins) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = (
      (ins.nombreCliente || '').toLowerCase().includes(query) ||
      (ins.direccion || '').toLowerCase().includes(query) ||
      (ins.banco || '').toLowerCase().includes(query)
    );

    if (!matchesSearch) return false;

    if (activeTab === 'borradores') {
      return ins.estado === 'borrador';
    } else {
      return ins.estado === 'finalizada';
    }
  });

  const countDrafts = inspecciones.filter((ins) => ins.estado === 'borrador').length;
  const countCompleted = inspecciones.filter((ins) => ins.estado === 'finalizada').length;

  return (
    <>
      <Header />
      <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <span style={{ 
            position: 'absolute', 
            left: '16px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: 'var(--text-secondary)', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Buscar por cliente, banco o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{
              width: '100%',
              paddingLeft: '48px',
              fontSize: '0.95rem'
            }}
          />
        </div>

        {/* Tabs Segmented Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('borradores')}
            style={{
              padding: '10px 4px',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all var(--transition-normal)',
              backgroundColor: activeTab === 'borradores' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
              color: activeTab === 'borradores' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'borradores' ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            <ClipboardList size={16} />
            Borradores ({countDrafts})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completadas')}
            style={{
              padding: '10px 4px',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all var(--transition-normal)',
              backgroundColor: activeTab === 'completadas' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
              color: activeTab === 'completadas' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'completadas' ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            <CheckCircle2 size={16} />
            Completadas ({countCompleted})
          </button>
        </div>

        {/* List or Empty State */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, color: 'var(--text-secondary)' }}>
            Cargando historial...
          </div>
        ) : filteredInspecciones.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            textAlign: 'center',
            padding: '24px 16px',
            color: 'var(--text-secondary)',
            gap: '16px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px dashed var(--border)',
              color: 'var(--text-muted)'
            }}>
              {activeTab === 'borradores' ? <ClipboardList size={32} /> : <FileText size={32} />}
            </div>
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>
                {searchQuery 
                  ? 'Sin resultados' 
                  : activeTab === 'borradores' 
                    ? 'Sin Borradores' 
                    : 'Sin Inspecciones Completadas'}
              </p>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                {searchQuery 
                  ? 'No se encontraron inspecciones que coincidan con la búsqueda.' 
                  : activeTab === 'borradores'
                    ? 'No tienes borradores pendientes. Comienza una nueva inspección con el botón inferior.'
                    : 'Las inspecciones que finalices aparecerán aquí ordenadas cronológicamente.'}
              </p>
            </div>
            {!searchQuery && activeTab === 'borradores' && (
              <button onClick={onNewInspection} className="btn btn-primary" style={{ marginTop: '8px' }}>
                <Plus size={18} /> Nueva Inspección
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
            {filteredInspecciones.map((ins) => (
              <InspectionCard
                key={ins.id}
                inspeccion={ins}
                onClick={onSelectInspection}
              />
            ))}
          </div>
        )}

        {/* Floating Action Button */}
        {inspecciones.length > 0 && (
          <button 
            className="btn btn-primary fab" 
            onClick={onNewInspection}
          >
            <Plus size={18} strokeWidth={3} />
            <span>Nueva Inspección</span>
          </button>
        )}
      </div>
    </>
  );
};

export default HistorialScreen;
