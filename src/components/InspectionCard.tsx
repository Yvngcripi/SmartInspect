import React from 'react';
import { Calendar, MapPin, ChevronRight, FileText } from 'lucide-react';
import type { Inspeccion } from '../types';

interface InspectionCardProps {
  inspeccion: Inspeccion;
  onClick: (id: string) => void;
}

export const InspectionCard: React.FC<InspectionCardProps> = ({ inspeccion, onClick }) => {
  const isFinalizada = inspeccion.estado === 'finalizada';

  // Format date DD/MM/YYYY
  let formattedDate = inspeccion.fecha;
  try {
    const [year, month, day] = inspeccion.fecha.split('-');
    if (year && month && day) {
      formattedDate = `${day}/${month}/${year}`;
    }
  } catch (e) {
    // Keep fallback
  }

  const totalDanos = (inspeccion.dependencias ?? []).reduce((acc, dep) => acc + (dep.danos?.length ?? 0), 0);
  const totalFotos = (inspeccion.dependencias ?? []).reduce((acc, dep) => acc + (dep.fotosGenerales?.length ?? 0) + (dep.danos ?? []).reduce((a, d) => a + (d.fotos?.length ?? 0), 0), 0);

  return (
    <div 
      className="glass-card" 
      onClick={() => onClick(inspeccion.id)}
      style={{
        cursor: 'pointer',
        marginBottom: '16px',
        transition: 'all var(--transition-normal)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.7)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {inspeccion.nombreCliente}
          </h3>
          {inspeccion.folioNumber && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              #{String(inspeccion.folioNumber).padStart(3, '0')}
            </span>
          )}
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 600, 
            color: inspeccion.tipo === 'pre_inspeccion' ? '#38bdf8' : 'var(--primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '2px'
          }}>
            {inspeccion.tipo === 'pre_inspeccion' ? '📋 Pre-inspección' : '🛡️ Inspección Seguro'}
          </span>
        </div>
        <span className={`badge ${isFinalizada ? 'badge-completed' : 'badge-draft'}`}>
          {isFinalizada ? 'Finalizada' : 'Borrador'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <MapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '380px' }}>
            {inspeccion.direccion}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <Calendar size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span>{formattedDate}</span>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {isFinalizada ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>
            <FileText size={14} />
            <span>{(inspeccion.metrosCuadradosTotales ?? 0).toFixed(2)} M² Totales</span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500 }}>
              {(inspeccion.dependencias ?? []).length} {(inspeccion.dependencias ?? []).length === 1 ? 'dep.' : 'deps.'}
            </span>
            {totalDanos > 0 && (
              <span style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: 500, backgroundColor: 'rgba(239,68,68,0.08)', padding: '2px 7px', borderRadius: '999px' }}>
                ⚠️ {totalDanos} daños
              </span>
            )}
            {totalFotos > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500, backgroundColor: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: '999px' }}>
                📸 {totalFotos} fotos
              </span>
            )}
          </div>
        )}
        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  );
};

export default InspectionCard;
