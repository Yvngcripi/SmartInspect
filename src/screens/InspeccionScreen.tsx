import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Camera, Ruler, AlertCircle, Save, CheckCircle, Trash2, ShieldAlert, Edit2, Mic, MicOff, Search, Copy } from 'lucide-react';
import { Header } from '../components/Header';
import { ImagePreviewGrid } from '../components/ImagePreviewGrid';
import { ImageViewer } from '../components/ImageViewer';
import { compressImage } from '../utils/imageCompressor';
import type { Inspeccion, Dependencia, Dano } from '../types';
import { getRoomArea, isFachadaOCierre } from '../utils/areaHelper';

interface InspeccionScreenProps {
  inspeccion: Inspeccion;
  onSaveBorrador: (updatedInspeccion: Inspeccion) => Promise<void>;
  onAutoSave: (updatedInspeccion: Inspeccion) => Promise<void>;
  onFinalizar: (updatedInspeccion: Inspeccion) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEditClientDetails: () => void;
}

const ROOM_SUGGESTIONS = [
  'Cierre frontal',
  'Cierre lateral izquierdo',
  'Cierre lateral derecho',
  'Ante jardín',
  'Fachada principal',
  'Hall acceso',
  'Baño visitas',
  'Pasillo',
  'Living',
  'Comedor',
  'Living/Comedor',
  'Cocina',
  'Dormitorio principal',
  'Dormitorio 2',
  'Baño suite',
  'Caja escala',
  'Patio trasero'
];

const DAMAGE_SUGGESTIONS = [
  'Humedad / Filtración',
  'Fisuras / Grietas',
  'Cerámica suelta / Quebrada',
  'Descuadre de puerta / ventana',
  'Encuentro de muro dintel o antepecho',
  'Cerámica muro',
  'Desprendimiento de pintura / zócalo'
];

const DAMAGE_LOCATIONS = [
  'Muro',
  'Cielo',
  'Piso',
  'Ventana/Puerta',
  'Exterior',
  'General'
];

export const InspeccionScreen: React.FC<InspeccionScreenProps> = ({
  inspeccion,
  onSaveBorrador,
  onAutoSave,
  onFinalizar,
  onDelete,
  onEditClientDetails
}) => {
  const isSavingOrFinalizingRef = useRef(false);
  // Helper to load localStorage backup for crash recovery
  const getBackup = () => {
    try {
      const saved = localStorage.getItem(`inspection_backup_${inspeccion.id}`);
      if (saved) {
        const backup = JSON.parse(saved);
        if (backup.inspeccionId === inspeccion.id) {
          return backup;
        }
      }
    } catch (e) {
      console.error('Failed to parse backup:', e);
    }
    return null;
  };

  const backup = getBackup();

  const [dependencias, setDependencias] = useState<Dependencia[]>(() => {
    return backup ? backup.dependencias || [] : inspeccion.dependencias || [];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(() => {
    if (backup) {
      // Reopen modal only if user was typing a room name when app crashed
      // (photos are no longer stored in localStorage to prevent quota errors)
      return !!(backup.nombre);
    }
    return false;
  });

  // Room states inside modal (restored from backup if app crashed)
  const [nombre, setNombre] = useState(() => backup ? backup.nombre || '' : '');
  const [largo, setLargo] = useState(() => backup ? backup.largo || '' : '');
  const [ancho, setAncho] = useState(() => backup ? backup.ancho || '' : '');
  const [alto, setAlto] = useState(() => backup ? backup.alto || '' : '');
  const [fotosGenerales, setFotosGenerales] = useState<string[]>([]); // Always empty on restore — photos live in IndexedDB
  const [danos, setDanos] = useState<Dano[]>(() => backup ? backup.danos || [] : []); // Danos text preserved, photos will be re-taken
  
  // Track if we are editing an existing room or adding a new one
  const [editingDependencyId, setEditingDependencyId] = useState<string | null>(() => backup ? backup.editingDependencyId || null : null);
  
  // Sub-form states for adding an individual damage
  const [isAddingDano, setIsAddingDano] = useState(false);
  const [danoDescripcion, setDanoDescripcion] = useState('');
  const [danoUbicacion, setDanoUbicacion] = useState(() => backup ? backup.danoUbicacion || 'Muro' : 'Muro');
  const [isListening, setIsListening] = useState(false);
  const [depSearch, setDepSearch] = useState('');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Trigger backup to localStorage & debounced auto-save to database on state change
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!inspeccion.id) return;

    // 1. Save a LIGHTWEIGHT local backup (no base64 photos to avoid localStorage 5MB quota crash)
    const backupData = {
      inspeccionId: inspeccion.id,
      dependencias: dependencias.map(dep => ({
        ...dep,
        fotosGenerales: [], // Intentionally stripped — stored safely in IndexedDB
        danos: dep.danos.map(d => ({ ...d, fotos: [] })) // Stripped photos
      })),
      nombre,
      largo,
      ancho,
      alto,
      editingDependencyId,
      danoUbicacion
      // fotosGenerales & danoFotos are NOT saved to localStorage (too large, use IndexedDB instead)
    };
    try {
      localStorage.setItem(`inspection_backup_${inspeccion.id}`, JSON.stringify(backupData));
    } catch (e) {
      console.error('Failed to write local backup:', e);
    }

    // 2. Debounced auto-save: wait 800ms after last change before writing to IndexedDB
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(async () => {
      if (isSavingOrFinalizingRef.current) return;
      const m2Totales = dependencias.reduce((acc, dep) => {
        const area = getRoomArea(dep.largo, dep.ancho, dep.alto, dep.nombre);
        return acc + area;
      }, 0);
      const updated = {
        ...inspeccion,
        dependencias,
        metrosCuadradosTotales: m2Totales
      };
      try {
        await onAutoSave(updated);
      } catch (err) {
        console.error('Silent auto-save failed:', err);
      }
    }, 800);

    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [dependencias, nombre, largo, ancho, alto, editingDependencyId, danoUbicacion, inspeccion.id, onAutoSave]);
  // NOTE: fotosGenerales and danoFotos are intentionally NOT in the dependency array
  // to prevent auto-save on every photo compression, which would cause memory spikes.
  const [danoFotos, setDanoFotos] = useState<string[]>([]);
  
  const [compressing, setCompressing] = useState(false);
  const [modalError, setModalError] = useState('');

  // Handle Photo picker for general photos
  const handleGeneralPhotosSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressing(true);
    setModalError('');
    const compressedList: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i], 900, 0.6);
        compressedList.push(compressed);
      } catch (err) {
        console.error('Error compressing image:', err);
        setModalError('Ocurrió un error al procesar una o más imágenes.');
      }
    }

    setFotosGenerales((prev) => [...prev, ...compressedList]);
    setCompressing(false);
    e.target.value = ''; // reset
  };

  const handleRemoveGeneralPhoto = (idxToRemove: number) => {
    setFotosGenerales((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // Handle Photo picker for specific damage photos
  const handleDanoPhotosSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressing(true);
    setModalError('');
    const compressedList: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i], 900, 0.6);
        compressedList.push(compressed);
      } catch (err) {
        console.error('Error compressing image:', err);
        setModalError('Ocurrió un error al procesar una o más imágenes.');
      }
    }

    setDanoFotos((prev) => [...prev, ...compressedList]);
    setCompressing(false);
    e.target.value = ''; // reset
  };

  const handleRemoveDanoPhoto = (idxToRemove: number) => {
    setDanoFotos((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // Speech Recognition (Voice-to-Text) Toggle
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador o dispositivo no soporta dictado por voz.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      if ((window as any).recognitionInstance) {
        try {
          (window as any).recognitionInstance.stop();
        } catch (e) {}
      }
    } else {
      setIsListening(true);
      const rec = new SpeechRecognition();
      rec.lang = 'es-CL';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDanoDescripcion((prev) => prev ? prev.trim() + ' ' + transcript : transcript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      (window as any).recognitionInstance = rec;
      rec.start();
    }
  };

  // Cleanup speech recognition on component unmount to release audio resources
  useEffect(() => {
    return () => {
      if ((window as any).recognitionInstance) {
        try { (window as any).recognitionInstance.stop(); } catch (e) {}
        (window as any).recognitionInstance = null;
      }
    };
  }, []);

  // Push single damage into damages list inside the modal
  const handleConfirmDano = () => {
    if (!danoDescripcion.trim()) {
      setModalError('Escribe o selecciona una descripción para el daño.');
      return;
    }

    if (inspeccion.tipo === 'inspeccion' && danoFotos.length === 0) {
      setModalError('Debes adjuntar al menos una foto para documentar este daño específico.');
      return;
    }

    const nuevoDano: Dano = {
      id: Date.now().toString(),
      descripcion: danoDescripcion.trim(),
      fotos: danoFotos,
      ubicacion: danoUbicacion
    };

    setDanos((prev) => [...prev, nuevoDano]);
    
    // Clear damage sub-form
    setDanoDescripcion('');
    setDanoFotos([]);
    setDanoUbicacion('Muro');
    setIsAddingDano(false);
    setModalError('');
  };

  const handleDeleteDanoFromList = (danoId: string) => {
    setDanos((prev) => prev.filter((d) => d.id !== danoId));
  };

  const handleDuplicateDependency = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const depToDuplicate = dependencias.find((dep) => dep.id === id);
    if (!depToDuplicate) return;
    const copy: Dependencia = {
      ...depToDuplicate,
      id: Date.now().toString(),
      nombre: `${depToDuplicate.nombre} (copia)`,
      fotosGenerales: [],
      danos: depToDuplicate.danos.map(d => ({ ...d, id: Date.now().toString() + Math.random(), fotos: [] }))
    };
    setDependencias((prev) => [...prev, copy]);
    try { navigator.vibrate?.(40); } catch (e) {}
  };

  // Edit existing room (fills state variables and opens modal)
  const handleEditDependency = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const depToEdit = dependencias.find((dep) => dep.id === id);
    if (!depToEdit) return;

    setEditingDependencyId(id);
    setNombre(depToEdit.nombre);
    setLargo(depToEdit.largo === 0 ? '' : depToEdit.largo.toString());
    setAncho(depToEdit.ancho === 0 ? '' : depToEdit.ancho.toString());
    setAlto(depToEdit.alto === 0 ? '' : depToEdit.alto.toString());
    setFotosGenerales(depToEdit.fotosGenerales || []);
    setDanos(depToEdit.danos || []);
    setModalError(''); // Clear any stale error message from a previous modal session
    setIsModalOpen(true);
  };

  // Add or update completed room in inspection list
  const handleAddDependency = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setModalError('El nombre de la dependencia es obligatorio.');
      return;
    }

    const nameLower = nombre.trim().toLowerCase();
    
    // Keywords indicating it is an exterior boundary or perimeter area
    const hasExteriorKeyword = 
      nameLower.includes('cierre') || 
      nameLower.includes('fachada') ||
      nameLower.includes('lateral') ||
      nameLower.includes('perimetral') ||
      nameLower.includes('antejardín') ||
      nameLower.includes('ante jardin') ||
      nameLower.includes('patio') ||
      nameLower.includes('jardín') ||
      nameLower.includes('jardin') ||
      nameLower.includes('exterior') ||
      nameLower.includes('frontal');

    // Keywords indicating a traditional fully-enclosed interior room
    const hasInteriorKeyword = 
      nameLower.includes('living') ||
      nameLower.includes('comedor') ||
      nameLower.includes('cocina') ||
      nameLower.includes('dormitorio') ||
      nameLower.includes('baño') ||
      nameLower.includes('bano') ||
      nameLower.includes('pasillo') ||
      nameLower.includes('hall') ||
      nameLower.includes('escala') ||
      nameLower.includes('escalera') ||
      nameLower.includes('entrada') ||
      nameLower.includes('visitas') ||
      nameLower.includes('suite') ||
      nameLower.includes('acceso');

    const isExteriorRoom = hasExteriorKeyword || !hasInteriorKeyword;

    // Helper to safely parse dimensions that might be string or number
    const parseDimension = (val: any): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return val;
      const str = String(val).trim();
      return str ? parseFloat(str) : 0;
    };

    const numLargo = parseDimension(largo);
    const numAncho = parseDimension(ancho);
    const numAlto = parseDimension(alto);

    if (isExteriorRoom) {
      if (isNaN(numAlto) || numAlto <= 0) {
        setModalError('La altura (alto) es obligatoria para cierres y fachadas.');
        return;
      }
      if ((isNaN(numLargo) || numLargo <= 0) && (isNaN(numAncho) || numAncho <= 0)) {
        setModalError('Debes ingresar al menos el largo o el ancho.');
        return;
      }
    } else {
      if (isNaN(numLargo) || numLargo <= 0 || isNaN(numAncho) || numAncho <= 0 || isNaN(numAlto) || numAlto <= 0) {
        setModalError('Las dimensiones (largo, ancho y alto) deben ser números mayores a cero.');
        return;
      }
    }

    // Check if adding sub-form is active and not confirmed
    if (isAddingDano && danoDescripcion.trim()) {
      if (window.confirm('Tienes un daño editándose. ¿Deseas guardarlo antes de agregar la dependencia?')) {
        handleConfirmDano();
        return;
      }
    }

    if (editingDependencyId) {
      // Edit mode: map and replace dependency inside list
      const updatedDependency: Dependencia = {
        id: editingDependencyId,
        nombre: nombre.trim(),
        largo: numLargo,
        ancho: numAncho,
        alto: numAlto,
        danos: danos,
        fotosGenerales: fotosGenerales
      };
      setDependencias((prev) =>
        prev.map((dep) => (dep.id === editingDependencyId ? updatedDependency : dep))
      );
    } else {
      // Add mode: append new dependency to list
      const newDependency: Dependencia = {
        id: Date.now().toString(),
        nombre: nombre.trim(),
        largo: numLargo,
        ancho: numAncho,
        alto: numAlto,
        danos: danos,
        fotosGenerales: fotosGenerales
      };
      setDependencias((prev) => [...prev, newDependency]);
    }

    // Vibrate on save for mobile haptic feedback
    try { navigator.vibrate?.(50); } catch (e) {}

    closeModal();
  };

  const handleDeleteDependency = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar esta dependencia de la inspección?')) {
      setDependencias((prev) => prev.filter((dep) => dep.id !== id));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNombre('');
    setLargo('');
    setAncho('');
    setAlto('');
    setFotosGenerales([]);
    setDanos([]);
    
    setDanoDescripcion('');
    setDanoFotos([]);
    setIsAddingDano(false);
    setModalError('');
    setCompressing(false);
    setEditingDependencyId(null);
  };

  const compileInspeccion = (estado: 'borrador' | 'finalizada'): Inspeccion => {
    const m2Totales = dependencias.reduce((acc, dep) => {
      const area = getRoomArea(dep.largo, dep.ancho, dep.alto, dep.nombre);
      return acc + area;
    }, 0);

    return {
      ...inspeccion,
      dependencias,
      estado,
      metrosCuadradosTotales: m2Totales
    };
  };

  const handleSaveBorradorClick = async () => {
    isSavingOrFinalizingRef.current = true;
    try {
      localStorage.removeItem(`inspection_backup_${inspeccion.id}`);
    } catch (e) {}
    const updated = compileInspeccion('borrador');
    await onSaveBorrador(updated);
  };

  const handleDeleteClick = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este borrador de inspección de forma permanente? Esta acción no se puede deshacer.')) {
      isSavingOrFinalizingRef.current = true;
      try {
        localStorage.removeItem(`inspection_backup_${inspeccion.id}`);
      } catch (e) {}
      await onDelete(inspeccion.id);
    }
  };

  const handleFinalizarClick = async () => {
    if (dependencias.length === 0) {
      alert('Debes agregar al menos una dependencia antes de finalizar la inspección.');
      return;
    }
    setShowFinalizeModal(true);
  };

  const handleConfirmFinalize = async () => {
    setShowFinalizeModal(false);
    isSavingOrFinalizingRef.current = true;
    try {
      localStorage.removeItem(`inspection_backup_${inspeccion.id}`);
    } catch (e) {}
    const updated = compileInspeccion('finalizada');
    await onFinalizar(updated);
  };

  return (
    <>
      <Header title={inspeccion.nombreCliente || 'Sin cliente asignado'} onBack={handleSaveBorradorClick} />
      <div className="screen" style={{ paddingBottom: '100px' }}>
        
        {/* Client details card with edit action */}
        <div className="glass-card" style={{
          marginBottom: '16px',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderColor: 'rgba(255,255,255,0.06)'
        }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {inspeccion.nombreCliente || 'Sin cliente asignado'}
            </h4>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>Banco: <strong>{inspeccion.banco}</strong></span>
              <span>•</span>
              <span>Siniestro: <strong>{inspeccion.siniestro}</strong></span>
            </div>
          </div>
          <button
            onClick={onEditClientDetails}
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1.5px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Edit2 size={12} /> Editar Datos
          </button>
        </div>

        {/* Helper info banner */}
        <div className="glass-card" style={{ marginBottom: '20px', borderLeft: '3px solid var(--primary)', padding: '12px 16px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Registra las dependencias de la propiedad. Puedes asociar fotos específicas a <strong>cada daño</strong> registrado de forma independiente.
          </p>
        </div>

        {/* Room list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          {/* Header row with Add Dependency Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dependencias ({dependencias.length})
            </h3>
            
            <button 
              type="button"
              onClick={() => {
                setEditingDependencyId(null);
                setNombre('');
                setLargo('');
                setAncho('');
                setAlto('');
                setFotosGenerales([]);
                setDanos([]);
                setModalError('');
                setIsModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Agregar Dependencia
            </button>
          </div>

          {/* Progress bar */}
          {dependencias.length > 0 && (
            <div style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>{dependencias.length} dependencia{dependencias.length !== 1 ? 's' : ''} registrada{dependencias.length !== 1 ? 's' : ''}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  {dependencias.reduce((acc, dep) => acc + getRoomArea(dep.largo, dep.ancho, dep.alto, dep.nombre), 0).toFixed(1)} M² total
                </span>
              </div>
            </div>
          )}

          {/* Search bar (only show when there are 3+ rooms) */}
          {dependencias.length >= 3 && (
            <div style={{ position: 'relative', marginBottom: '4px' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar dependencia..."
                value={depSearch}
                onChange={(e) => setDepSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '0.85rem', padding: '8px 12px 8px 36px' }}
              />
            </div>
          )}

          {dependencias.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              border: '1.5px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              textAlign: 'center',
              gap: '14px',
              marginTop: '10px'
            }}>
              <Ruler size={36} style={{ color: 'var(--primary)' }} />
              <div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem' }}>
                  Sin dependencias agregadas
                </p>
                <p style={{ fontSize: '0.825rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                  Agrega habitaciones, salas o exteriores para calcular el metraje e ingresar daños.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setEditingDependencyId(null);
                  setNombre('');
                  setLargo('');
                  setAncho('');
                  setAlto('');
                  setFotosGenerales([]);
                  setDanos([]);
                  setModalError('');
                  setIsModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}
              >
                <Plus size={18} /> Agregar Primera Dependencia
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dependencias
                .filter(dep => !depSearch || dep.nombre.toLowerCase().includes(depSearch.toLowerCase()))
                .map((dep) => {
                const area = getRoomArea(dep.largo, dep.ancho, dep.alto, dep.nombre);
                const depDanos = dep.danos?.length ?? 0;
                const depFotos = (dep.fotosGenerales?.length ?? 0) + (dep.danos ?? []).reduce((a, d) => a + (d.fotos?.length ?? 0), 0);
                return (
                  <div 
                    key={dep.id}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      border: '1px solid rgba(255,255,255,0.02)',
                      animation: 'dep-fade-in 0.25s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {dep.nombre}
                        </h4>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {depDanos > 0 && (
                            <span style={{ fontSize: '0.68rem', color: '#fca5a5', backgroundColor: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                              ⚠️ {depDanos} daño{depDanos !== 1 ? 's' : ''}
                            </span>
                          )}
                          {depFotos > 0 && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '999px', fontWeight: 500 }}>
                              📸 {depFotos} foto{depFotos !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button 
                          onClick={(e) => handleDuplicateDependency(dep.id, e)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Duplicar Dependencia"
                        >
                          <Copy size={15} />
                        </button>
                        <button 
                          onClick={(e) => handleEditDependency(dep.id, e)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Editar Dependencia"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteDependency(dep.id, e)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Eliminar Dependencia"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Medidas:</span>{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {dep.largo === 0 ? `${dep.ancho} x ${dep.alto} cm (Ancho x Alto)` :
                           dep.ancho === 0 ? `${dep.largo} x ${dep.alto} cm (Largo x Alto)` :
                           `${dep.largo} x ${dep.ancho} x ${dep.alto} cm`}
                        </strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Superficie:</span>{' '}
                        <strong style={{ color: isFachadaOCierre(dep.nombre) ? 'var(--text-muted)' : 'var(--primary)' }}>
                          {isFachadaOCierre(dep.nombre) ? '-' : `${area.toFixed(2)} M²`}
                        </strong>
                      </div>
                    </div>

                    {/* General Photos */}
                    {dep.fotosGenerales && dep.fotosGenerales.length > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                          Fotos Generales ({dep.fotosGenerales.length})
                        </span>
                        <ImagePreviewGrid
                          images={dep.fotosGenerales}
                          readOnly={true}
                          onImageClick={(idx) => { setViewerImages(dep.fotosGenerales); setViewerIndex(idx); }}
                        />
                      </div>
                    )}

                    {/* Structured Damages */}
                    {dep.danos && dep.danos.length > 0 ? (
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Daños Registrados ({dep.danos.length})
                        </span>
                        {dep.danos.map((d) => (
                          <div 
                            key={d.id} 
                            style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderLeft: '2.5px solid var(--danger)', borderRadius: '4px' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px', flexWrap: 'wrap' }}>
                              <ShieldAlert size={14} />
                              {d.ubicacion && (
                                <span style={{ fontSize: '0.675rem', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase', marginRight: '4px' }}>
                                  {d.ubicacion}
                                </span>
                              )}
                              <span>{d.descripcion}</span>
                            </div>
                            <ImagePreviewGrid
                              images={d.fotos}
                              readOnly={true}
                              onImageClick={(idx) => { setViewerImages(d.fotos); setViewerIndex(idx); }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                        Sin registro de daños.
                      </div>
                    )}

                  </div>
                );
              })}
              {depSearch && dependencias.filter(dep => dep.nombre.toLowerCase().includes(depSearch.toLowerCase())).length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem', padding: '20px' }}>No se encontró ninguna dependencia con ese nombre.</p>
              )}
            </div>
          )}
        </div>

        {/* Bottom actions (scrolled naturally, not fixed!) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border)',
          width: '100%'
        }}>
          <button 
            type="button"
            onClick={() => {
              setEditingDependencyId(null);
              setNombre('');
              setLargo('');
              setAncho('');
              setAlto('');
              setFotosGenerales([]);
              setDanos([]);
              setModalError('');
              setIsModalOpen(true);
            }}
            className="btn btn-primary animate-pulse"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem', fontWeight: 700 }}
          >
            <Plus size={18} /> Agregar Dependencia
          </button>
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button 
              type="button"
              onClick={handleDeleteClick} 
              className="btn btn-secondary" 
              style={{ flex: 1, color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <Trash2 size={18} /> Eliminar Borrador
            </button>
            <button 
              type="button"
              onClick={handleSaveBorradorClick} 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
            >
              <Save size={18} /> Guardar Borrador
            </button>
          </div>
          <button 
            type="button"
            onClick={handleFinalizarClick} 
            className="btn btn-primary" 
            style={{ width: '100%' }}
          >
            <CheckCircle size={18} /> Finalizar Inspección
          </button>
        </div>

        {/* Modal: Agregar Dependencia */}
        {isModalOpen && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingDependencyId ? 'Editar Dependencia' : 'Agregar Dependencia'}
                </h3>
                <button onClick={closeModal} className="close-btn">
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  color: 'var(--danger)',
                  fontSize: '0.85rem',
                  marginBottom: '16px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddDependency} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* 1. Nombre de la dependencia */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nombre de Dependencia</label>
                  <input
                    type="text"
                    placeholder="Ej. Living, Dormitorio Principal"
                    value={nombre}
                    onChange={(e) => {
                      setNombre(e.target.value);
                      setModalError('');
                    }}
                    className="form-input"
                    required
                  />

                  {/* Suggestion Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {ROOM_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          setNombre(sug);
                          setModalError('');
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-full)',
                          border: '1.5px solid var(--border)',
                          backgroundColor: nombre === sug ? 'var(--primary-light)' : 'transparent',
                          color: nombre === sug ? 'var(--primary)' : 'var(--text-secondary)',
                          borderColor: nombre === sug ? 'var(--primary)' : 'var(--border)',
                          cursor: 'pointer',
                          fontWeight: nombre === sug ? 600 : 400,
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Dimensiones */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Dimensiones (en Centímetros - CM)</label>
                  <div className="form-row-three">
                    <div>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Largo (CM)</span>
                      <input
                        type="number"
                        placeholder="Largo"
                        value={largo}
                        onChange={(e) => {
                          setLargo(e.target.value);
                          setModalError('');
                        }}
                        className="form-input"
                        style={{ width: '100%', padding: '10px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ancho (CM)</span>
                      <input
                        type="number"
                        placeholder="Ancho"
                        value={ancho}
                        onChange={(e) => {
                          setAncho(e.target.value);
                          setModalError('');
                        }}
                        className="form-input"
                        style={{ width: '100%', padding: '10px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Alto (CM)</span>
                      <input
                        type="number"
                        placeholder="Alto"
                        value={alto}
                        onChange={(e) => {
                          setAlto(e.target.value);
                          setModalError('');
                        }}
                        className="form-input"
                        style={{ width: '100%', padding: '10px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Fotos Generales de la Habitación (Opcionales - solo en Inspección completa) */}
                {inspeccion.tipo === 'inspeccion' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Fotos Generales (Opcional - Para documentar la habitación)</label>
                    <label className="btn btn-secondary" style={{ borderStyle: 'dashed', padding: '10px', fontSize: '0.9rem', cursor: 'pointer', position: 'relative' }}>
                      <Camera size={16} />
                      <span>Subir Fotos Generales</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        capture="environment"
                        onChange={handleGeneralPhotosSelect}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                    </label>
                    <ImagePreviewGrid images={fotosGenerales} onRemove={handleRemoveGeneralPhoto} />
                  </div>
                )}

                {/* 4. Registro de Daños Específicos */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="form-label" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Daños Específicos ({danos.length})</label>
                    {!isAddingDano && (
                      <button 
                        type="button" 
                        onClick={() => setIsAddingDano(true)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                      >
                        <Plus size={14} /> Registrar Daño
                      </button>
                    )}
                  </div>

                  {/* Sub-formulario para agregar un daño */}
                  {isAddingDano && (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Nuevo Registro de Daño</span>
                        <button type="button" onClick={() => { setIsAddingDano(false); setModalError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <X size={16} />
                        </button>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Descripción del Daño</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Ej. Daño en dintel, encuentro de muro..."
                            value={danoDescripcion}
                            onChange={(e) => {
                              setDanoDescripcion(e.target.value);
                              setModalError('');
                            }}
                            className="form-input"
                            style={{ padding: '10px', fontSize: '0.9rem', flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={toggleListening}
                            style={{
                              background: isListening ? 'var(--danger)' : 'rgba(255,255,255,0.03)',
                              border: '1.5px solid',
                              borderColor: isListening ? 'var(--danger)' : 'var(--border)',
                              borderRadius: 'var(--radius-md)',
                              color: isListening ? '#fff' : 'var(--text-secondary)',
                              width: '42px',
                              height: '42px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              transition: 'all var(--transition-normal)'
                            }}
                            title={isListening ? 'Escuchando... Presiona para detener' : 'Presiona para dictar daño por voz'}
                          >
                            {isListening ? (
                              <MicOff size={18} />
                            ) : (
                              <Mic size={18} />
                            )}
                          </button>
                        </div>

                        {/* Damage suggestion chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                          {DAMAGE_SUGGESTIONS.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => {
                                setDanoDescripcion(sug);
                                setModalError('');
                              }}
                              style={{
                                fontSize: '0.7rem',
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid var(--border)',
                                backgroundColor: danoDescripcion === sug ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                color: danoDescripcion === sug ? '#fca5a5' : 'var(--text-secondary)',
                                borderColor: danoDescripcion === sug ? 'var(--danger)' : 'var(--border)',
                                cursor: 'pointer'
                              }}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>

                        {/* Damage Location Selector (Chips) */}
                        <div style={{ marginTop: '14px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                            Ubicación del Daño
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {DAMAGE_LOCATIONS.map((loc) => (
                              <button
                                key={loc}
                                type="button"
                                onClick={() => setDanoUbicacion(loc)}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '5px 10px',
                                  borderRadius: 'var(--radius-full)',
                                  border: '1.5px solid',
                                  backgroundColor: danoUbicacion === loc ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                                  color: danoUbicacion === loc ? 'var(--primary)' : 'var(--text-secondary)',
                                  borderColor: danoUbicacion === loc ? 'var(--primary)' : 'var(--border)',
                                  cursor: 'pointer',
                                  fontWeight: danoUbicacion === loc ? 600 : 'normal'
                                }}
                              >
                                {loc}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {inspeccion.tipo === 'inspeccion' && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Foto(s) del Daño</span>
                          <label className="btn btn-secondary" style={{ borderStyle: 'dashed', borderColor: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#fca5a5', padding: '8px', fontSize: '0.85rem', cursor: 'pointer', position: 'relative' }}>
                            <Camera size={14} />
                            <span>Tomar Foto del Daño</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              capture="environment"
                              onChange={handleDanoPhotosSelect}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />
                          </label>
                          <ImagePreviewGrid images={danoFotos} onRemove={handleRemoveDanoPhoto} />
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button type="button" onClick={() => { setIsAddingDano(false); setModalError(''); }} className="btn btn-secondary" style={{ padding: '8px', fontSize: '0.85rem', flex: 1 }}>
                          Cancelar
                        </button>
                        <button type="button" onClick={handleConfirmDano} className="btn btn-primary animate-pulse" style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '8px', fontSize: '0.85rem', flex: 1 }}>
                          Confirmar Daño
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of damages added to this room so far */}
                  {danos.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {danos.map((d) => (
                        <div 
                          key={d.id} 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '6px', 
                            padding: '10px 12px', 
                            backgroundColor: 'rgba(255, 255, 255, 0.01)', 
                            border: '1px solid var(--border)', 
                            borderRadius: 'var(--radius-sm)' 
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontSize: '0.825rem', fontWeight: 600 }}>
                              <ShieldAlert size={14} />
                              <span>{d.descripcion}</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteDanoFromList(d.id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {inspeccion.tipo === 'inspeccion' && <ImagePreviewGrid images={d.fotos} readOnly={true} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Global compressing indicator */}
                {compressing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                    <div className="spinner" style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid rgba(16, 185, 129, 0.2)',
                      borderTop: '2px solid var(--primary)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span>Optimizando foto...</span>
                  </div>
                )}

                {/* Modal footer actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <button 
                    type="button" 
                    onClick={closeModal} 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    disabled={compressing}
                  >
                    {editingDependencyId ? 'Actualizar Dependencia' : 'Guardar Dependencia'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* CSS Animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes dep-fade-in {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}} />

        {/* Image fullscreen viewer */}
        {viewerImages.length > 0 && (
          <ImageViewer
            images={viewerImages}
            initialIndex={viewerIndex}
            onClose={() => setViewerImages([])}
          />
        )}

        {/* Finalize confirmation modal */}
        {showFinalizeModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9100, display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', width: '100%', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Finalizar Inspección</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Se guardará el registro completo y quedará listo para generar el PDF.</p>
              </div>
              <div style={{ backgroundColor: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Dependencias</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{dependencias.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Daños registrados</span>
                  <strong style={{ color: '#fca5a5' }}>{dependencias.reduce((a, d) => a + (d.danos?.length ?? 0), 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Superficie total</span>
                  <strong style={{ color: 'var(--primary)' }}>{dependencias.reduce((acc, dep) => acc + getRoomArea(dep.largo, dep.ancho, dep.alto, dep.nombre), 0).toFixed(2)} M²</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowFinalizeModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Revisar</button>
                <button onClick={handleConfirmFinalize} className="btn btn-primary" style={{ flex: 1 }}>Confirmar y Finalizar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default InspeccionScreen;
