import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Share2, Edit2, Trash2, Calendar, MapPin, Mail, Landmark, CreditCard, FlameKindling, MessageSquare } from 'lucide-react';
import type { Inspeccion } from '../types';
import { generateInspeccionPDF, shareOrDownloadPDF } from '../utils/pdfGenerator';
import { ImagePreviewGrid } from '../components/ImagePreviewGrid';
import { getRoomArea, isFachadaOCierre } from '../utils/areaHelper';

interface DetalleScreenProps {
  inspeccion: Inspeccion;
  onBack: () => void;
  onEdit: () => void;
  onDelete: (id: string) => Promise<void>;
}

export const DetalleScreen: React.FC<DetalleScreenProps> = ({
  inspeccion,
  onBack,
  onEdit,
  onDelete
}) => {
  const [generating, setGenerating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleGeneratePDF = async () => {
    setGenerating(true);
    // Give browser a frame to show loading UI
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      const doc = generateInspeccionPDF(inspeccion);
      await shareOrDownloadPDF(inspeccion, doc);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

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

  const handleShareSummary = async () => {
    const deps = (inspeccion.dependencias ?? []);
    const totalDanos = deps.reduce((acc, d) => acc + (d.danos?.length ?? 0), 0);
    const folio = inspeccion.folioNumber ? `Folio #${String(inspeccion.folioNumber).padStart(3, '0')} | ` : '';
    let text = `🍀 *Asesorías El Trébol*\n`;
    text += `${folio}${inspeccion.tipo === 'pre_inspeccion' ? 'Pre-inspección' : 'Inspección Seguro'}\n`;
    text += `📋 *Cliente:* ${inspeccion.nombreCliente}\n`;
    text += `🏦 *Banco:* ${inspeccion.banco}\n`;
    text += `📍 *Dirección:* ${inspeccion.direccion || 'No registrada'}\n`;
    text += `⚡ *Siniestro:* ${inspeccion.siniestro}\n`;
    text += `📅 *Fecha:* ${formattedDate}\n\n`;
    text += `📐 *Superficie total:* ${(inspeccion.metrosCuadradosTotales ?? 0).toFixed(2)} M²\n`;
    text += `🏠 *Dependencias:* ${deps.length}\n`;
    text += `⚠️ *Daños registrados:* ${totalDanos}\n\n`;
    if (deps.length > 0) {
      text += `*Detalle por dependencia:*\n`;
      deps.forEach((dep, i) => {
        const isFachada = isFachadaOCierre(dep.nombre);
        const area = getRoomArea(dep.largo, dep.ancho, dep.alto, dep.nombre);
        const areaStr = isFachada ? '(Fachada/Cierre)' : `${area.toFixed(2)} M²`;
        text += `${i + 1}. ${dep.nombre} — ${areaStr}`;
        if (dep.danos?.length) text += ` (${dep.danos.length} daño${dep.danos.length > 1 ? 's' : ''})`;
        text += `\n`;
      });
    }
    text += `\n_Generado por Asesorías El Trébol_`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Resumen copiado al portapapeles');
      }
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  return (
    <>
      <Header title="Detalle de Inspección" onBack={onBack} />
      <div className="screen" style={{ paddingBottom: '100px' }}>
        
        {/* Client Metadata Card */}
        <div 
          className="glass-card" 
          style={{ 
            marginBottom: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            borderLeft: `4px solid ${isFinalizada ? 'var(--primary)' : 'var(--accent)'}`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {inspeccion.nombreCliente}
              </h3>
              {inspeccion.folioNumber && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Folio #{String(inspeccion.folioNumber).padStart(3, '0')}</span>
              )}
              <span style={{ 
                fontSize: '0.725rem', 
                fontWeight: 600, 
                color: inspeccion.tipo === 'pre_inspeccion' ? '#38bdf8' : 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {inspeccion.tipo === 'pre_inspeccion' ? '📋 Pre-inspección' : '🛡️ Inspección Seguro'}
              </span>
            </div>
            <span className={`badge ${isFinalizada ? 'badge-completed' : 'badge-draft'}`}>
              {isFinalizada ? 'Finalizada' : 'Borrador'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Landmark size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>Banco: <strong>{inspeccion.banco}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <FlameKindling size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span>Siniestro: <strong style={{ color: '#fca5a5' }}>{inspeccion.siniestro}</strong></span>
            </div>
            {inspeccion.tipo === 'inspeccion' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <CreditCard size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span>RUT: <strong>{inspeccion.rut}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span>{inspeccion.direccion}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Mail size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span>{inspeccion.correo}</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Calendar size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>Inspeccionado el: {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Total Square Metres Highlight */}
        <div 
          className="glass-card" 
          style={{ 
            marginBottom: '20px', 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1.5px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Superficie Total Estimada
          </span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {(inspeccion.metrosCuadradosTotales ?? 0).toFixed(2)} M²
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Calculado sobre {(inspeccion.dependencias ?? []).length} dependencias registradas
          </span>
        </div>

        {/* Dependencias breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Detalle de Habitaciones / Áreas
          </h3>

          {(inspeccion.dependencias ?? []).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', fontStyle: 'italic', padding: '10px' }}>
              No hay dependencias registradas en esta inspección.
            </p>
          ) : (
            (inspeccion.dependencias ?? []).map((dep, index) => {
              const area = getRoomArea(dep.largo, dep.ancho, dep.alto, dep.nombre);
              return (
                <div 
                  key={dep.id}
                  className="glass-card"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {index + 1}. {dep.nombre}
                    </h4>
                    <span style={{ fontSize: '0.85rem', color: isFachadaOCierre(dep.nombre) ? 'var(--text-muted)' : 'var(--primary)', fontWeight: 600 }}>
                      {isFachadaOCierre(dep.nombre) ? '-' : `${area.toFixed(2)} M²`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.825rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    {dep.largo > 0 && (
                      <>
                        <span>Largo: <strong>{dep.largo}cm</strong></span>
                        {((dep.ancho && dep.ancho > 0) || (dep.alto && dep.alto > 0)) && <span>•</span>}
                      </>
                    )}
                    {dep.ancho > 0 && (
                      <>
                        <span>Ancho: <strong>{dep.ancho}cm</strong></span>
                        {(dep.alto && dep.alto > 0) && <span>•</span>}
                      </>
                    )}
                    {dep.alto > 0 && (
                      <span>Alto: <strong>{dep.alto}cm</strong></span>
                    )}
                  </div>

                  {/* General Photos */}
                  {dep.fotosGenerales && dep.fotosGenerales.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                        Fotos Generales ({dep.fotosGenerales.length})
                      </span>
                      <ImagePreviewGrid images={dep.fotosGenerales} readOnly={true} />
                    </div>
                  )}

                  {/* Structured Damages List */}
                  {dep.danos && dep.danos.length > 0 ? (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Daños Registrados ({dep.danos.length})
                      </span>
                      {dep.danos.map((d) => (
                        <div 
                          key={d.id} 
                          style={{ 
                            padding: '8px 12px', 
                            backgroundColor: 'rgba(239, 68, 68, 0.05)', 
                            borderLeft: '2.5px solid var(--danger)', 
                            borderRadius: '4px' 
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span>⚠️ </span>
                            {d.ubicacion && (
                              <span style={{
                                fontSize: '0.675rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                textTransform: 'uppercase',
                                marginRight: '4px'
                              }}>
                                {d.ubicacion}
                              </span>
                            )}
                            <span>{d.descripcion}</span>
                          </div>
                          <ImagePreviewGrid images={d.fotos} readOnly={true} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                      Sin registro de daños estructurales o cosméticos.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action Panel */}
        <div className="bottom-bar" style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'linear-gradient(to top, var(--bg-app) 85%, transparent)' }}>
          
          <button 
            onClick={handleGeneratePDF} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px' }}
            disabled={generating}
          >
            {generating ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span>Generando Reporte...</span>
              </div>
            ) : (
              <>
                <Share2 size={18} />
                <span>Generar Reporte PDF</span>
              </>
            )}
          </button>

          <button onClick={handleShareSummary} className="btn btn-secondary" style={{ width: '100%' }}>
            <MessageSquare size={18} />
            <span>Compartir Resumen WhatsApp</span>
          </button>

          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            {!isFinalizada && (
              <button 
                onClick={onEdit} 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
              >
                <Edit2 size={16} />
                <span>Editar</span>
              </button>
            )}
            <button 
              onClick={handleDelete} 
              className="btn btn-secondary" 
              style={{ flex: 1, borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                e.currentTarget.style.borderColor = 'var(--danger)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              }}
            >
              <Trash2 size={16} />
              <span>Eliminar</span>
            </button>
          </div>
        </div>

        {/* CSS Spin Keyframes for button spinner */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />

        {showDeleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>¿Eliminar inspección?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Esta acción no se puede deshacer. Se eliminará permanentemente del historial.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={async () => { setShowDeleteConfirm(false); await onDelete(inspeccion.id); }} className="btn btn-secondary" style={{ flex: 1, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.4)' }}>Sí, Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DetalleScreen;
