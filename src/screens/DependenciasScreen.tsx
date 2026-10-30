import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Inspeccion, Dependencia, Dano } from '../types';
import { storageService } from '../services/storageService';
import { colors } from '../theme/colors';

interface Props {
  navigation: any;
  route: any;
}

export const DependenciasScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null);

  // Formulario nueva dependencia
  const [nombre, setNombre] = useState('');
  const [largo, setLargo] = useState('');
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('2.4');
  const [esFachada, setEsFachada] = useState(false);

  // Modal / Formulario para agregar daño a una dependencia seleccionada
  const [selectedDepId, setSelectedDepId] = useState<string | null>(null);
  const [danoDesc, setDanoDesc] = useState('');
  const [danoGravedad, setDanoGravedad] = useState<'leve' | 'moderada' | 'grave'>('moderada');

  const sugerencias = [
    'Living-Comedor',
    'Dormitorio Principal',
    'Dormitorio 2',
    'Cocina',
    'Baño Principal',
    'Logia',
    'Fachada Norte',
    'Cierre Perimetral'
  ];

  const loadData = async () => {
    const data = await storageService.getInspeccionById(id);
    if (data) {
      setInspeccion(data);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddDependencia = async () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'Ingrese el nombre de la dependencia o seleccione una sugerencia.');
      return;
    }
    const numLargo = parseFloat(largo.replace(',', '.'));
    const numAncho = parseFloat(ancho.replace(',', '.'));
    const numAlto = parseFloat(alto.replace(',', '.')) || 2.4;

    if (isNaN(numLargo) || numLargo <= 0 || isNaN(numAncho) || numAncho <= 0) {
      Alert.alert('Dimensiones inválidas', 'Por favor ingrese largo y ancho válidos mayores a cero.');
      return;
    }

    if (!inspeccion) return;

    const newDep: Dependencia = {
      id: `dep-${Date.now()}`,
      nombre: nombre.trim(),
      largo: numLargo,
      ancho: numAncho,
      alto: numAlto,
      esFachadaOCierre: esFachada,
      fotosGenerales: [],
      danos: []
    };

    const updatedDeps = [...inspeccion.dependencias, newDep];
    const updatedInspeccion: Inspeccion = {
      ...inspeccion,
      dependencias: updatedDeps
    };

    await storageService.saveInspeccion(updatedInspeccion);
    setInspeccion(updatedInspeccion);

    // Reset form
    setNombre('');
    setLargo('');
    setAncho('');
    setAlto('2.4');
    setEsFachada(false);

    Alert.alert('Agregada', `Dependencia "${newDep.nombre}" registrada exitosamente.`);
  };

  const handleDeleteDependencia = async (depId: string) => {
    if (!inspeccion) return;
    const confirmMsg = '¿Desea eliminar esta dependencia y todos sus daños registrados?';

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(confirmMsg)) {
        const updatedDeps = inspeccion.dependencias.filter(d => d.id !== depId);
        const updated: Inspeccion = { ...inspeccion, dependencias: updatedDeps };
        await storageService.saveInspeccion(updated);
        setInspeccion(updated);
      }
    } else {
      Alert.alert(
        'Eliminar Dependencia',
        confirmMsg,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              const updatedDeps = inspeccion.dependencias.filter(d => d.id !== depId);
              const updated: Inspeccion = { ...inspeccion, dependencias: updatedDeps };
              await storageService.saveInspeccion(updated);
              setInspeccion(updated);
            }
          }
        ]
      );
    }
  };

  const handleAddDano = async (depId: string) => {
    if (!danoDesc.trim()) {
      Alert.alert('Campo requerido', 'Describa el daño técnico observado.');
      return;
    }
    if (!inspeccion) return;

    const newDano: Dano = {
      id: `dan-${Date.now()}`,
      descripcion: danoDesc.trim(),
      gravedad: danoGravedad,
      fotos: []
    };

    const updatedDeps = inspeccion.dependencias.map(dep => {
      if (dep.id === depId) {
        return {
          ...dep,
          danos: [...(dep.danos || []), newDano]
        };
      }
      return dep;
    });

    const updated: Inspeccion = { ...inspeccion, dependencias: updatedDeps };
    await storageService.saveInspeccion(updated);
    setInspeccion(updated);

    // Reset daño form
    setDanoDesc('');
    setSelectedDepId(null);
    Alert.alert('Daño Registrado', 'Evidencia técnica añadida a la dependencia.');
  };

  const handlePickPhotoForDano = async (depId: string, danoId: string) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso necesario', 'Se necesita acceso a la galería para adjuntar fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && inspeccion) {
        const photoUri = result.assets[0].uri;
        const updatedDeps = inspeccion.dependencias.map(dep => {
          if (dep.id === depId) {
            const updatedDanos = dep.danos.map(d => {
              if (d.id === danoId) {
                return { ...d, fotos: [...d.fotos, photoUri] };
              }
              return d;
            });
            return { ...dep, danos: updatedDanos };
          }
          return dep;
        });

        const updated: Inspeccion = { ...inspeccion, dependencias: updatedDeps };
        await storageService.saveInspeccion(updated);
        setInspeccion(updated);
        Alert.alert('Foto Adjuntada', 'La imagen de evidencia quedó asociada al daño.');
      }
    } catch (err) {
      console.error('Error seleccionando imagen:', err);
    }
  };

  if (!inspeccion) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Cargando dependencias...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Banner Superior con total M2 */}
        <View style={styles.topInfo}>
          <View>
            <Text style={styles.topFolio}>Folio #{inspeccion.folioNumber.toString().padStart(3, '0')}</Text>
            <Text style={styles.topClient}>{inspeccion.nombreCliente}</Text>
          </View>
          <View style={styles.topM2Badge}>
            <Text style={styles.topM2Val}>{inspeccion.metrosCuadradosTotales} m²</Text>
            <Text style={styles.topM2Label}>Superficie Interior</Text>
          </View>
        </View>

        {/* Formulario Agregar Dependencia */}
        <View style={styles.cardForm}>
          <View style={styles.formTitleRow}>
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={styles.formTitle}>Agregar Nueva Dependencia</Text>
          </View>

          {/* Sugerencias Rápidas */}
          <Text style={styles.label}>Sugerencias de dependencias:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sugerenciasScroll}>
            {sugerencias.map(sug => (
              <TouchableOpacity
                key={sug}
                style={[styles.sugChip, nombre === sug && styles.sugChipActive]}
                onPress={() => {
                  setNombre(sug);
                  if (sug.includes('Fachada') || sug.includes('Cierre')) {
                    setEsFachada(true);
                  } else {
                    setEsFachada(false);
                  }
                }}
              >
                <Text style={[styles.sugChipText, nombre === sug && styles.sugChipTextActive]}>
                  {sug}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Nombre */}
          <Text style={styles.label}>Nombre de la Habitación / Área *</Text>
          <TextInput
            style={styles.input}
            placeholder="ej: Dormitorio Secundario Poniente"
            placeholderTextColor={colors.textMuted}
            value={nombre}
            onChangeText={setNombre}
          />

          {/* Dimensiones */}
          <View style={styles.dimsRow}>
            <View style={[styles.dimBox, { marginRight: 6 }]}>
              <Text style={styles.dimLabel}>Largo (m)</Text>
              <TextInput
                style={styles.dimInput}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={colors.textMuted}
                value={largo}
                onChangeText={setLargo}
              />
            </View>

            <View style={[styles.dimBox, { marginHorizontal: 3 }]}>
              <Text style={styles.dimLabel}>Ancho (m)</Text>
              <TextInput
                style={styles.dimInput}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={colors.textMuted}
                value={ancho}
                onChangeText={setAncho}
              />
            </View>

            <View style={[styles.dimBox, { marginLeft: 6 }]}>
              <Text style={styles.dimLabel}>Alto (m)</Text>
              <TextInput
                style={styles.dimInput}
                keyboardType="numeric"
                placeholder="2.4"
                placeholderTextColor={colors.textMuted}
                value={alto}
                onChangeText={setAlto}
              />
            </View>
          </View>

          {/* Switch Fachada */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.switchLabel}>¿Es Fachada o Cierre Perimetral?</Text>
              <Text style={styles.switchSubtext}>
                No suma metros cuadrados al área interior habitable.
              </Text>
            </View>
            <Switch
              value={esFachada}
              onValueChange={setEsFachada}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={esFachada ? colors.primary : '#ffffff'}
            />
          </View>

          {/* Botón Agregar */}
          <TouchableOpacity style={styles.btnAddDep} onPress={handleAddDependencia}>
            <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.btnAddDepText}>Guardar Dependencia</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Dependencias Existentes */}
        <Text style={styles.sectionHeader}>
          Dependencias Registradas ({inspeccion.dependencias.length})
        </Text>

        {inspeccion.dependencias.map((dep, index) => {
          const m2 = (dep.largo * dep.ancho).toFixed(2);
          const isAddingDanoHere = selectedDepId === dep.id;

          return (
            <View key={dep.id || index} style={styles.depItemCard}>
              <View style={styles.depItemHeader}>
                <View>
                  <Text style={styles.depItemName}>{dep.nombre}</Text>
                  <Text style={styles.depItemDims}>
                    {dep.largo}m × {dep.ancho}m × {dep.alto}m • {dep.esFachadaOCierre ? 'Fachada' : `${m2} m²`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteDependencia(dep.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>

              {/* Lista de Daños en esta Dependencia */}
              {dep.danos && dep.danos.length > 0 && (
                <View style={styles.danosContainer}>
                  <Text style={styles.danosHeader}>Daños ({dep.danos.length}):</Text>
                  {dep.danos.map((d, dIdx) => (
                    <View key={d.id || dIdx} style={styles.danoRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.danoText}>• {d.descripcion}</Text>
                        <Text style={styles.danoMeta}>
                          Gravedad: {d.gravedad?.toUpperCase()} | Fotos: {d.fotos?.length || 0}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addPhotoBtn}
                        onPress={() => handlePickPhotoForDano(dep.id, d.id)}
                      >
                        <Ionicons name="camera-outline" size={14} color={colors.primary} />
                        <Text style={styles.addPhotoText}>+ Foto</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Botón o Formulario para agregar daño */}
              {isAddingDanoHere ? (
                <View style={styles.addDanoBox}>
                  <Text style={styles.addDanoTitle}>Registrar Daño en {dep.nombre}:</Text>
                  <TextInput
                    style={styles.danoInput}
                    placeholder="Descripción técnica del daño o siniestro..."
                    placeholderTextColor={colors.textMuted}
                    value={danoDesc}
                    onChangeText={setDanoDesc}
                  />

                  {/* Selector Gravedad */}
                  <View style={styles.gravedadRow}>
                    {(['leve', 'moderada', 'grave'] as const).map(g => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.gravedadChip,
                          danoGravedad === g && styles.gravedadChipActive
                        ]}
                        onPress={() => setDanoGravedad(g)}
                      >
                        <Text
                          style={[
                            styles.gravedadText,
                            danoGravedad === g && styles.gravedadTextActive
                          ]}
                        >
                          {g.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.danoActions}>
                    <TouchableOpacity
                      style={styles.btnConfirmDano}
                      onPress={() => handleAddDano(dep.id)}
                    >
                      <Text style={styles.btnConfirmDanoText}>Guardar Daño</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnCancelDano}
                      onPress={() => setSelectedDepId(null)}
                    >
                      <Text style={styles.btnCancelDanoText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.btnOpenAddDano}
                  onPress={() => {
                    setSelectedDepId(dep.id);
                    setDanoDesc('');
                  }}
                >
                  <Ionicons name="alert-circle-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.btnOpenAddDanoText}>+ Agregar Daño a {dep.nombre}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Botón Volver a Detalle */}
        <TouchableOpacity
          style={styles.btnVolver}
          onPress={() => navigation.navigate('DetalleInspeccion', { id: inspeccion.id })}
        >
          <Ionicons name="checkmark-done-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.btnVolverText}>Finalizar y Ver Ficha Completa</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    padding: 16,
    paddingBottom: 40
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary
  },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16
  },
  topFolio: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6ee7b7'
  },
  topClient: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2
  },
  topM2Badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center'
  },
  topM2Val: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff'
  },
  topM2Label: {
    fontSize: 10,
    color: '#a7f3d0'
  },
  cardForm: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginLeft: 8
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6
  },
  sugerenciasScroll: {
    flexDirection: 'row',
    marginBottom: 12
  },
  sugChip: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6
  },
  sugChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  sugChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  sugChipTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 12
  },
  dimsRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  dimBox: {
    flex: 1
  },
  dimLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4
  },
  dimInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'center'
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 4
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary
  },
  switchSubtext: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2
  },
  btnAddDep: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10
  },
  btnAddDepText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12
  },
  depItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12
  },
  depItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  depItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  depItemDims: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  danosContainer: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 8
  },
  danosHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6
  },
  danoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  danoText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500'
  },
  danoMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 3
  },
  btnOpenAddDano: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6
  },
  btnOpenAddDanoText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  addDanoBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 10,
    marginTop: 8
  },
  addDanoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 6
  },
  danoInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 8
  },
  gravedadRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  gravedadChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fcd34d',
    marginHorizontal: 2
  },
  gravedadChipActive: {
    backgroundColor: colors.warning,
    borderColor: colors.warning
  },
  gravedadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e'
  },
  gravedadTextActive: {
    color: '#ffffff'
  },
  danoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  btnConfirmDano: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6
  },
  btnConfirmDanoText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  btnCancelDano: {
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  btnCancelDanoText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  btnVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10
  },
  btnVolverText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  }
});
