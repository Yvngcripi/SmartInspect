import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Inspeccion, User, EstadoInspeccion } from '../types';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { StatusBadge } from '../components/StatusBadge';
import { colors } from '../theme/colors';

interface Props {
  navigation: any;
  route: any;
}

export const DetalleInspeccionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      const data = await storageService.getInspeccionById(id);
      if (data) {
        setInspeccion(data);
        setObservaciones(data.observacionesSupervisor || '');
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const handleUpdateEstado = async (nuevoEstado: EstadoInspeccion) => {
    if (!inspeccion) return;
    try {
      const updated = await storageService.updateEstadoInspeccion(
        inspeccion.id,
        nuevoEstado,
        observaciones
      );
      if (updated) {
        setInspeccion(updated);
        const msg = `La inspección cambió a estado: "${nuevoEstado.toUpperCase()}".`;
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') window.alert(msg);
        } else {
          Alert.alert('Estado Actualizado', msg);
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert('No se pudo actualizar el estado.');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el estado.');
      }
    }
  };

  const handleDelete = async () => {
    if (!inspeccion) return;
    const confirmMsg = `¿Está seguro de eliminar la inspección Folio #${inspeccion.folioNumber}? Esta acción no se puede deshacer.`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(confirmMsg)) {
        await storageService.deleteInspeccion(inspeccion.id);
        navigation.goBack();
      }
    } else {
      Alert.alert(
        'Confirmar Eliminación',
        confirmMsg,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              await storageService.deleteInspeccion(inspeccion.id);
              navigation.goBack();
            }
          }
        ]
      );
    }
  };

  if (!inspeccion) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Cargando inspección...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSupervisor = currentUser?.rol === 'supervisor';
  const totalDanos = inspeccion.dependencias.reduce(
    (acc, dep) => acc + (dep.danos?.length || 0),
    0
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Banner de Permisos de Rol */}
        <View
          style={[
            styles.roleBanner,
            isSupervisor ? styles.roleBannerSup : styles.roleBannerInsp
          ]}
        >
          <Ionicons
            name={isSupervisor ? 'shield-checkmark' : 'person'}
            size={18}
            color={isSupervisor ? colors.roleSupervisor : colors.roleInspector}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.roleBannerText}>
            {isSupervisor
              ? 'Vista de Supervisor: Puedes auditar, redactar observaciones y dictaminar aprobación.'
              : 'Vista de Inspector: Puedes modificar datos, agregar dependencias y enviar a revisión.'}
          </Text>
        </View>

        {/* Tarjeta de Encabezado */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.folioNumber}>
                Folio #{inspeccion.folioNumber.toString().padStart(3, '0')}
              </Text>
              <Text style={styles.tipoText}>
                {inspeccion.tipo === 'inspeccion_seguro'
                  ? 'Inspección de Seguro'
                  : 'Pre-Inspección'}
              </Text>
            </View>
            <StatusBadge estado={inspeccion.estado} />
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Asegurado:</Text>
            <Text style={styles.infoValue}>{inspeccion.nombreCliente}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>RUT:</Text>
            <Text style={styles.infoValue}>{inspeccion.rut || 'No informado'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Banco Mandante:</Text>
            <Text style={[styles.infoValue, { fontWeight: '700', color: colors.primaryDark }]}>
              {inspeccion.banco}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>N° Siniestro:</Text>
            <Text style={[styles.infoValue, { fontWeight: '700' }]}>{inspeccion.siniestro}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dirección:</Text>
            <Text style={styles.infoValue}>{inspeccion.direccion}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha Inspección:</Text>
            <Text style={styles.infoValue}>{inspeccion.fecha}</Text>
          </View>

          {inspeccion.fechaAprobacion && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha Aprobación:</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>
                {inspeccion.fechaAprobacion}
              </Text>
            </View>
          )}
        </View>

        {/* Resumen Métrico de Superficies */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Resumen Técnico en Terreno</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{inspeccion.metrosCuadradosTotales} m²</Text>
              <Text style={styles.metricDesc}>Área Habitable Total</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{inspeccion.dependencias.length}</Text>
              <Text style={styles.metricDesc}>Dependencias</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricVal, totalDanos > 0 && { color: colors.warning }]}>
                {totalDanos}
              </Text>
              <Text style={styles.metricDesc}>Daños Identificados</Text>
            </View>
          </View>
        </View>

        {/* Desglose de Dependencias y Daños */}
        <View style={styles.depsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Dependencias y Daños ({inspeccion.dependencias.length})
            </Text>
          </View>

          {inspeccion.dependencias.length === 0 ? (
            <View style={styles.emptyDeps}>
              <Ionicons name="home-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyDepsText}>
                No se han registrado dependencias aún.
              </Text>
            </View>
          ) : (
            inspeccion.dependencias.map((dep, index) => {
              const m2 = (dep.largo * dep.ancho).toFixed(2);
              return (
                <View key={dep.id || index} style={styles.depCard}>
                  <View style={styles.depCardHeader}>
                    <View style={styles.depTitleRow}>
                      <Ionicons
                        name={dep.esFachadaOCierre ? 'business-outline' : 'bed-outline'}
                        size={18}
                        color={colors.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.depName}>{dep.nombre}</Text>
                    </View>
                    <View style={styles.m2Badge}>
                      <Text style={styles.m2Text}>
                        {dep.esFachadaOCierre ? 'Fachada/Cierre' : `${m2} m²`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.depDims}>
                    Dimensiones: {dep.largo}m largo × {dep.ancho}m ancho × {dep.alto}m alto
                  </Text>

                  {/* Daños registrados en esta dependencia */}
                  {dep.danos && dep.danos.length > 0 ? (
                    <View style={styles.danosList}>
                      <Text style={styles.danosSubtitle}>Daños reportados:</Text>
                      {dep.danos.map((d, dIdx) => (
                        <View key={d.id || dIdx} style={styles.danoItem}>
                          <View
                            style={[
                              styles.danoDot,
                              d.gravedad === 'grave'
                                ? { backgroundColor: colors.danger }
                                : d.gravedad === 'moderada'
                                ? { backgroundColor: colors.warning }
                                : { backgroundColor: colors.info }
                            ]}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.danoDesc}>{d.descripcion}</Text>
                            <Text style={styles.danoGravedad}>
                              Gravedad: {d.gravedad?.toUpperCase() || 'MODERADA'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.sinDanos}>Sin daños estructurales reportados.</Text>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Panel Exclusivo de Supervisión */}
        {isSupervisor ? (
          <View style={styles.supervisorPanel}>
            <View style={styles.panelTitleRow}>
              <Ionicons name="shield-checkmark" size={20} color={colors.roleSupervisor} />
              <Text style={styles.panelTitle}>Dictamen y Aprobación de Supervisión</Text>
            </View>

            <Text style={styles.inputLabel}>
              Observaciones Técnicas / Visto Bueno de Póliza:
            </Text>
            <TextInput
              style={styles.obsInput}
              multiline
              numberOfLines={4}
              placeholder="Ingrese el dictamen técnico o requisitos de subsanación para el perito..."
              placeholderTextColor={colors.textMuted}
              value={observaciones}
              onChangeText={setObservaciones}
            />

            <View style={styles.supActionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnAprobar]}
                onPress={() => handleUpdateEstado('aprobada')}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Aprobar Siniestro</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnRechazar]}
                onPress={() => handleUpdateEstado('rechazada')}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Con Observaciones</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Acciones de Inspector */
          <View style={styles.inspectorActions}>
            <TouchableOpacity
              style={styles.inspectorBtnPrimary}
              onPress={() =>
                navigation.navigate('GestionDependencias', { id: inspeccion.id })
              }
            >
              <Ionicons name="pencil" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.inspectorBtnText}>
                Editar Medidas y Daños
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.inspectorBtnSecondary}
              onPress={() => handleUpdateEstado('en_revision')}
            >
              <Ionicons name="send" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.inspectorBtnSecondaryText}>
                Enviar a Revisión de Supervisor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.inspectorBtnOutline}
              onPress={() =>
                navigation.navigate('NuevaInspeccion', { editId: inspeccion.id })
              }
            >
              <Ionicons name="create-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.inspectorBtnOutlineText}>
                Modificar Datos del Cliente / Siniestro
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botón Peligro: Eliminar */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.deleteBtnText}>Eliminar Inspección</Text>
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
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14
  },
  roleBannerInsp: {
    backgroundColor: colors.roleInspectorBg
  },
  roleBannerSup: {
    backgroundColor: colors.roleSupervisorBg
  },
  roleBannerText: {
    fontSize: 12,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500'
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  folioNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark
  },
  tipoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  infoValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    marginHorizontal: 3
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary
  },
  metricDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center'
  },
  depsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  manageLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  emptyDeps: {
    alignItems: 'center',
    paddingVertical: 20
  },
  emptyDepsText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6
  },
  depCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10
  },
  depCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  depTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  depName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  m2Badge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  m2Text: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark
  },
  depDims: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6
  },
  danosList: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  danosSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4
  },
  danoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  danoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
    marginRight: 6
  },
  danoDesc: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16
  },
  danoGravedad: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 1
  },
  sinDanos: {
    fontSize: 11,
    color: colors.success,
    fontStyle: 'italic'
  },
  supervisorPanel: {
    backgroundColor: colors.roleSupervisorBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    marginBottom: 14
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.roleSupervisor,
    marginLeft: 8
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6
  },
  obsInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c4b5fd',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 12
  },
  supActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10
  },
  btnAprobar: {
    backgroundColor: colors.success,
    marginRight: 6
  },
  btnRechazar: {
    backgroundColor: colors.danger,
    marginLeft: 6
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  inspectorActions: {
    marginBottom: 14
  },
  inspectorBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8
  },
  inspectorBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  inspectorBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8
  },
  inspectorBtnSecondaryText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700'
  },
  inspectorBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 12
  },
  inspectorBtnOutlineText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600'
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger
  }
});
