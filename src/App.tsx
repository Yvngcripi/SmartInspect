import { useState, useCallback } from 'react';
import HistorialScreen from './screens/HistorialScreen';
import FormInicialScreen from './screens/FormInicialScreen';
import InspeccionScreen from './screens/InspeccionScreen';
import DetalleScreen from './screens/DetalleScreen';
import { ToastProvider } from './components/Toast';
import { db } from './db/database';
import type { Inspeccion } from './types';
import './App.css';

type ScreenName = 'historial' | 'formulario_inicial' | 'inspeccion' | 'detalle';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('historial');
  const [selectedInspection, setSelectedInspection] = useState<Inspeccion | null>(null);

  const navigateTo = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  const handleNewInspection = () => {
    setSelectedInspection(null);
    navigateTo('formulario_inicial');
  };

  const handleFormSubmit = async (data: Omit<Inspeccion, 'id' | 'dependencias' | 'estado' | 'metrosCuadradosTotales'>) => {
    if (selectedInspection) {
      const updatedInspeccion: Inspeccion = {
        ...selectedInspection,
        ...data
      };
      setSelectedInspection(updatedInspeccion);
      db.saveInspeccion(updatedInspeccion); // persist updated metadata
      navigateTo('inspeccion');
    } else {
      const allExisting = await db.getAllInspecciones();
      const nextFolio = (allExisting.length > 0 ? Math.max(...allExisting.map((i: any) => i.folioNumber || 0)) : 0) + 1;
      const newInspeccion: Inspeccion = {
        id: Date.now().toString(),
        tipo: data.tipo,
        siniestro: data.siniestro,
        banco: data.banco,
        nombreCliente: data.nombreCliente,
        rut: data.rut,
        direccion: data.direccion,
        correo: data.correo,
        fecha: data.fecha,
        folioNumber: nextFolio,
        estado: 'borrador',
        dependencias: [],
        metrosCuadradosTotales: 0
      };
      setSelectedInspection(newInspeccion);
      // Persist new empty inspection immediately so it appears in historial even before auto-save
      db.saveInspeccion(newInspeccion);
      navigateTo('inspeccion');
    }
  };

  const handleSelectInspection = async (id: string) => {
    const inspection = await db.getInspeccionById(id);
    if (inspection) {
      setSelectedInspection(inspection);
      if (inspection.estado === 'finalizada') {
        navigateTo('detalle');
      } else {
        navigateTo('inspeccion');
      }
    }
  };

  const handleSaveBorrador = useCallback(async (updatedInspeccion: Inspeccion) => {
    await db.saveInspeccion(updatedInspeccion);
    setSelectedInspection(null); // Release memory
    navigateTo('historial');
  }, []);

  const handleAutoSave = useCallback(async (updatedInspeccion: Inspeccion) => {
    try {
      await db.saveInspeccion(updatedInspeccion);
    } catch (err) {
      // Silently log auto-save failures (e.g., storage full). User will be warned on explicit save.
      console.error('Auto-save failed:', err);
    }
    // NOTE: We intentionally do NOT call setSelectedInspection here to avoid re-render loops.
    // The InspeccionScreen manages its own state internally.
  }, []);

  const handleFinalizar = useCallback(async (updatedInspeccion: Inspeccion) => {
    await db.saveInspeccion(updatedInspeccion);
    setSelectedInspection(updatedInspeccion);
    navigateTo('detalle');
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await db.deleteInspeccion(id);
    setSelectedInspection(null); // Release memory
    navigateTo('historial');
  }, []);

  return (
    <ToastProvider>
      <div className="app-container">
      {currentScreen === 'historial' && (
        <HistorialScreen
          onNewInspection={handleNewInspection}
          onSelectInspection={handleSelectInspection}
        />
      )}
      
      {currentScreen === 'formulario_inicial' && (
        <FormInicialScreen
          onBack={() => {
            if (selectedInspection) {
              navigateTo('inspeccion');
            } else {
              setSelectedInspection(null); // Release memory
              navigateTo('historial');
            }
          }}
          onSubmit={handleFormSubmit}
          initialData={selectedInspection}
        />
      )}

      {currentScreen === 'inspeccion' && selectedInspection && (
        <InspeccionScreen
          inspeccion={selectedInspection}
          onSaveBorrador={handleSaveBorrador}
          onAutoSave={handleAutoSave}
          onFinalizar={handleFinalizar}
          onDelete={handleDelete}
          onEditClientDetails={() => navigateTo('formulario_inicial')}
        />
      )}

      {currentScreen === 'detalle' && selectedInspection && (
        <DetalleScreen
          inspeccion={selectedInspection}
          onBack={() => {
            setSelectedInspection(null); // Release memory
            navigateTo('historial');
          }}
          onEdit={() => navigateTo('inspeccion')}
          onDelete={handleDelete}
        />
      )}
    </div>
    </ToastProvider>
  );
}

export default App;
