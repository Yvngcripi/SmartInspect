import React, { useState } from 'react';
import { Header } from '../components/Header';
import { ArrowRight, User, MapPin, Mail, Calendar, Landmark, CreditCard, ClipboardList, ShieldCheck, FlameKindling } from 'lucide-react';
import type { Inspeccion, TipoInspeccion } from '../types';

interface FormInicialScreenProps {
  onBack: () => void;
  onSubmit: (data: Omit<Inspeccion, 'id' | 'dependencias' | 'estado' | 'metrosCuadradosTotales'>) => void;
  initialData?: Inspeccion | null;
}

const BANCOS_SUGERIDOS = [
  'Banco Estado',
  'Banco de Chile',
  'Santander',
  'BCI',
  'Scotiabank',
  'Itaú',
  'Banco Falabella',
  'Banco BICE'
];

const SINIESTROS_SUGERIDOS = [
  'Sismo',
  'Rotura de cañería',
  'Inundación',
  'Filtración de aguas lluvias'
];

export const FormInicialScreen: React.FC<FormInicialScreenProps> = ({ onBack, onSubmit, initialData }) => {
  const [tipo, setTipo] = useState<TipoInspeccion>(initialData?.tipo || 'inspeccion');
  const [siniestro, setSiniestro] = useState(initialData?.siniestro || '');
  const [banco, setBanco] = useState(initialData?.banco || '');
  const [nombreCliente, setNombreCliente] = useState(initialData?.nombreCliente || '');
  const [rut, setRut] = useState(initialData?.rut || '');
  const [direccion, setDireccion] = useState(initialData?.direccion || '');
  const [correo, setCorreo] = useState(initialData?.correo || '');
  const [fecha, setFecha] = useState(() => {
    if (initialData?.fecha) return initialData.fecha;
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Helper to format Chilean RUT (e.g. 12.345.678-K)
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^0-9kK]/g, '');
    
    if (value.length === 0) {
      setRut('');
      return;
    }

    if (value.length === 1) {
      setRut(value.toUpperCase());
      return;
    }

    const dv = value.slice(-1).toUpperCase();
    const body = value.slice(0, -1);
    
    let formattedBody = '';
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) {
        formattedBody = '.' + formattedBody;
      }
      formattedBody = body[i] + formattedBody;
    }

    setRut(`${formattedBody}-${dv}`);
    if (errors.rut) setErrors(prev => ({ ...prev, rut: '' }));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!siniestro.trim()) newErrors.siniestro = 'El tipo de siniestro es obligatorio';
    if (!banco.trim()) newErrors.banco = 'El banco del crédito es obligatorio';
    if (!nombreCliente.trim()) newErrors.nombreCliente = 'El nombre del cliente es obligatorio';
    
    if (tipo === 'inspeccion') {
      if (!rut.trim()) {
        newErrors.rut = 'El RUT es obligatorio';
      } else if (rut.replace(/[^0-9kK]/g, '').length < 8) {
        newErrors.rut = 'Ingresa un RUT válido';
      }
      if (!direccion.trim()) newErrors.direccion = 'La dirección es obligatoria';
      if (!correo.trim()) {
        newErrors.correo = 'El correo electrónico es obligatorio';
      } else if (!/\S+@\S+\.\S+/.test(correo)) {
        newErrors.correo = 'Ingresa un correo electrónico válido';
      }
    }
    
    if (!fecha) newErrors.fecha = 'La fecha es obligatoria';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        tipo,
        siniestro: siniestro.trim(),
        banco: banco.trim(),
        nombreCliente: nombreCliente.trim(),
        rut: tipo === 'inspeccion' ? rut.trim() : '',
        direccion: tipo === 'inspeccion' ? direccion.trim() : '',
        correo: tipo === 'inspeccion' ? correo.trim() : '',
        fecha
      });
    }
  };

  return (
    <>
      <Header title={initialData ? "Editar Datos Iniciales" : "Nueva Inspección"} onBack={onBack} />
      <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            
            {/* Tipo de Registro (Pre-inspección vs Inspección) */}
            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label">Tipo de Servicio</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginTop: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setTipo('pre_inspeccion');
                    setErrors({});
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)',
                    backgroundColor: tipo === 'pre_inspeccion' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.01)',
                    borderColor: tipo === 'pre_inspeccion' ? 'var(--primary)' : 'var(--border)',
                    color: tipo === 'pre_inspeccion' ? 'var(--primary)' : 'var(--text-secondary)'
                  }}
                >
                  <ClipboardList size={22} style={{ marginBottom: '6px' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Pre-inspección</span>
                  <span style={{ fontSize: '0.675rem', opacity: 0.8, marginTop: '2px', textAlign: 'center' }}>
                    Daños escritos, sin fotos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTipo('inspeccion');
                    setErrors({});
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)',
                    backgroundColor: tipo === 'inspeccion' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.01)',
                    borderColor: tipo === 'inspeccion' ? 'var(--primary)' : 'var(--border)',
                    color: tipo === 'inspeccion' ? 'var(--primary)' : 'var(--text-secondary)'
                  }}
                >
                  <ShieldCheck size={22} style={{ marginBottom: '6px' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Inspección Seguro</span>
                  <span style={{ fontSize: '0.675rem', opacity: 0.8, marginTop: '2px', textAlign: 'center' }}>
                    Requiere fotos de daños
                  </span>
                </button>
              </div>
            </div>

            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Datos del Cliente / Siniestro
            </h2>

            {/* Tipo de Siniestro */}
            <div className="form-group">
              <label className="form-label">Tipo de Siniestro</label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-secondary)', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <FlameKindling size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Selecciona o escribe el siniestro..."
                  value={siniestro}
                  onChange={(e) => {
                    setSiniestro(e.target.value);
                    if (errors.siniestro) setErrors(prev => ({ ...prev, siniestro: '' }));
                  }}
                  className="form-input"
                  style={{ 
                    width: '100%', 
                    paddingLeft: '48px', 
                    borderColor: errors.siniestro ? 'var(--danger)' : undefined 
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {SINIESTROS_SUGERIDOS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSiniestro(s);
                      if (errors.siniestro) setErrors(prev => ({ ...prev, siniestro: '' }));
                    }}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1.5px solid var(--border)',
                      backgroundColor: siniestro === s ? 'var(--primary-light)' : 'transparent',
                      color: siniestro === s ? 'var(--primary)' : 'var(--text-secondary)',
                      borderColor: siniestro === s ? 'var(--primary)' : 'var(--border)',
                      cursor: 'pointer'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.siniestro && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '2px' }}>
                  {errors.siniestro}
                </span>
              )}
            </div>

            {/* Banco del Crédito */}
            <div className="form-group">
              <label className="form-label">Banco del Crédito Hipotecario</label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-secondary)', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <Landmark size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Selecciona o escribe el banco..."
                  value={banco}
                  onChange={(e) => {
                    setBanco(e.target.value);
                    if (errors.banco) setErrors(prev => ({ ...prev, banco: '' }));
                  }}
                  className="form-input"
                  style={{ 
                    width: '100%', 
                    paddingLeft: '48px', 
                    borderColor: errors.banco ? 'var(--danger)' : undefined 
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {BANCOS_SUGERIDOS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setBanco(b);
                      if (errors.banco) setErrors(prev => ({ ...prev, banco: '' }));
                    }}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1.5px solid var(--border)',
                      backgroundColor: banco === b ? 'var(--primary-light)' : 'transparent',
                      color: banco === b ? 'var(--primary)' : 'var(--text-secondary)',
                      borderColor: banco === b ? 'var(--primary)' : 'var(--border)',
                      cursor: 'pointer'
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
              {errors.banco && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '2px' }}>
                  {errors.banco}
                </span>
              )}
            </div>

            {/* Nombre del Cliente */}
            <div className="form-group">
              <label className="form-label">Nombre del Cliente / Asegurado</label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-secondary)', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Nombre completo del cliente"
                  value={nombreCliente}
                  onChange={(e) => {
                    setNombreCliente(e.target.value);
                    if (errors.nombreCliente) setErrors(prev => ({ ...prev, nombreCliente: '' }));
                  }}
                  className="form-input"
                  style={{ 
                    width: '100%', 
                    paddingLeft: '48px', 
                    borderColor: errors.nombreCliente ? 'var(--danger)' : undefined 
                  }}
                />
              </div>
              {errors.nombreCliente && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '2px' }}>
                  {errors.nombreCliente}
                </span>
              )}
            </div>

            {/* Conditionally Render complete inspection fields */}
            {tipo === 'inspeccion' && (
              <>
                {/* Cédula de Identidad (RUT) */}
                <div className="form-group">
                  <label className="form-label">Cédula de Identidad (RUT)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: '16px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-secondary)', 
                      display: 'flex', 
                      alignItems: 'center' 
                    }}>
                      <CreditCard size={18} />
                    </span>
                    <input
                      type="text"
                      placeholder="Ej: 12.345.678-K"
                      value={rut}
                      onChange={handleRutChange}
                      className="form-input"
                      maxLength={12}
                      style={{ 
                        width: '100%', 
                        paddingLeft: '48px', 
                        borderColor: errors.rut ? 'var(--danger)' : undefined 
                      }}
                    />
                  </div>
                  {errors.rut && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '2px' }}>
                      {errors.rut}
                    </span>
                  )}
                </div>

                {/* Dirección Completa */}
                <div className="form-group">
                  <label className="form-label">Dirección Propiedad</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: '16px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-secondary)', 
                      display: 'flex', 
                      alignItems: 'center' 
                    }}>
                      <MapPin size={18} />
                    </span>
                    <input
                      type="text"
                      placeholder="Calle, Número, Comuna, Ciudad"
                      value={direccion}
                      onChange={(e) => {
                        setDireccion(e.target.value);
                        if (errors.direccion) setErrors(prev => ({ ...prev, direccion: '' }));
                      }}
                      className="form-input"
                      style={{ 
                        width: '100%', 
                        paddingLeft: '48px', 
                        borderColor: errors.direccion ? 'var(--danger)' : undefined 
                      }}
                    />
                  </div>
                  {errors.direccion && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '2px' }}>
                      {errors.direccion}
                    </span>
                  )}
                </div>

                {/* Correo Electrónico */}
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: '16px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-secondary)', 
                      display: 'flex', 
                      alignItems: 'center' 
                    }}>
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      placeholder="Ej: cliente@correo.com"
                      value={correo}
                      onChange={(e) => {
                        setCorreo(e.target.value);
                        if (errors.correo) setErrors(prev => ({ ...prev, correo: '' }));
                      }}
                      className="form-input"
                      style={{ 
                        width: '100%', 
                        paddingLeft: '48px', 
                        borderColor: errors.correo ? 'var(--danger)' : undefined 
                      }}
                    />
                  </div>
                  {errors.correo && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '2px' }}>
                      {errors.correo}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Fecha */}
            <div className="form-group">
              <label className="form-label">Fecha de Inspección</label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-secondary)', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <Calendar size={18} />
                </span>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    if (errors.fecha) setErrors(prev => ({ ...prev, fecha: '' }));
                  }}
                  className="form-input"
                  style={{ 
                    width: '100%', 
                    paddingLeft: '48px', 
                    borderColor: errors.fecha ? 'var(--danger)' : undefined 
                  }}
                />
              </div>
              {errors.fecha && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '2px' }}>
                  {errors.fecha}
                </span>
              )}
            </div>

          </div>

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              {initialData ? "Guardar Cambios" : "Continuar a Dependencias"} <ArrowRight size={18} />
            </button>
          </div>

        </form>
      </div>
    </>
  );
};

export default FormInicialScreen;
