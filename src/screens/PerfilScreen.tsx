import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { colors } from '../theme/colors';

interface Props {
  onLogout: () => void;
}

export const PerfilScreen: React.FC<Props> = ({ onLogout }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loadUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleResetData = async () => {
    try {
      const confirmMsg = '¿Desea restaurar las inspecciones de prueba iniciales de SmartInspect?';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm(confirmMsg)) {
          await storageService.resetToSeedData();
          window.alert('Éxito: Base de datos restaurada con datos semilla.');
        }
      } else {
        Alert.alert(
          'Restablecer Datos Demo',
          confirmMsg,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Restablecer',
              style: 'destructive',
              onPress: async () => {
                await storageService.resetToSeedData();
                Alert.alert('Éxito', 'Base de datos restaurada con datos semilla.');
              }
            }
          ]
        );
      }
    } catch {
      // Fallback
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      onLogout();
    }
  };

  const isSupervisor = currentUser?.rol === 'supervisor';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Tarjeta de Usuario */}
        <View style={styles.userCard}>
          <View style={[styles.avatar, isSupervisor ? styles.avatarSup : styles.avatarInsp]}>
            <Ionicons
              name={isSupervisor ? 'shield-checkmark' : 'person'}
              size={36}
              color={isSupervisor ? colors.roleSupervisor : colors.roleInspector}
            />
          </View>
          <Text style={styles.userName}>{currentUser?.nombre || 'Usuario'}</Text>
          <Text style={styles.userCargo}>{currentUser?.cargo}</Text>
          <Text style={styles.userEmail}>{currentUser?.email}</Text>

          <View style={[styles.roleTag, isSupervisor ? styles.roleTagSup : styles.roleTagInsp]}>
            <Text style={[styles.roleTagText, isSupervisor ? styles.roleTagTextSup : styles.roleTagTextInsp]}>
              ROL ACTIVO: {currentUser?.rol.toUpperCase()}
            </Text>
          </View>

          {/* Botón directo y llamativo de Cerrar Sesión */}
          <TouchableOpacity
            style={styles.btnLogoutMain}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.btnLogoutMainText}>Cerrar Sesión y Salir al Login</Text>
          </TouchableOpacity>
        </View>

        {/* Ficha Técnica de la Rúbrica de Evaluación */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Evaluación 2 — Presentación MVP</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Asignatura: Desarrollo de Aplicaciones Móviles con React Native
          </Text>

          <View style={styles.criteriaItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 8 }} />
            <Text style={styles.criteriaText}>
              <Text style={{ fontWeight: '700' }}>Criterio 3 (10 pts):</Text> Interfaz nativa con 6 pantallas en React Native puro.
            </Text>
          </View>

          <View style={styles.criteriaItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 8 }} />
            <Text style={styles.criteriaText}>
              <Text style={{ fontWeight: '700' }}>Criterio 4 (8 pts):</Text> Stack & Tab Navigation (@react-navigation).
            </Text>
          </View>

          <View style={styles.criteriaItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 8 }} />
            <Text style={styles.criteriaText}>
              <Text style={{ fontWeight: '700' }}>Criterio 5 (10 pts):</Text> Funcionalidades core: Login, CRUD, filtros y cálculo M².
            </Text>
          </View>

          <View style={styles.criteriaItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 8 }} />
            <Text style={styles.criteriaText}>
              <Text style={{ fontWeight: '700' }}>Criterio 6 (4 pts):</Text> 2 Roles diferenciados (Inspector / Supervisor).
            </Text>
          </View>

          <View style={styles.criteriaItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 8 }} />
            <Text style={styles.criteriaText}>
              <Text style={{ fontWeight: '700' }}>Criterio 7 (5 pts):</Text> Almacenamiento local estructurado (AsyncStorage) y consumo de datos.
            </Text>
          </View>
        </View>

        {/* Planificación y Distribución del Equipo */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={colors.primaryDark} />
            <Text style={styles.sectionTitle}>Planificación y Equipo (Criterio 2)</Text>
          </View>

          <View style={styles.teamMember}>
            <Text style={styles.memberName}>• Joaquín C. (Líder Técnico & Frontend React Native)</Text>
            <Text style={styles.memberTask}>Arquitectura de navegación Stack/Tabs, componentes UI y lógica de roles.</Text>
          </View>

          <View style={styles.teamMember}>
            <Text style={styles.memberName}>• Integrante 2 (Datos & Storage)</Text>
            <Text style={styles.memberTask}>Persistencia en AsyncStorage, validaciones y algoritmos de M².</Text>
          </View>

          <View style={styles.teamMember}>
            <Text style={styles.memberName}>• Integrante 3 (Diseño UX & Flujos)</Text>
            <Text style={styles.memberTask}>Filtros en tiempo real, gestión fotográfica y panel de supervisión.</Text>
          </View>
        </View>

        {/* Acciones de Sistema */}
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.actionRow} onPress={handleResetData}>
            <Ionicons name="refresh-circle-outline" size={20} color={colors.warning} />
            <Text style={[styles.actionRowText, { color: colors.warning }]}>
              Restablecer Datos Demo para Presentación
            </Text>
          </TouchableOpacity>
        </View>
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
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  avatarInsp: {
    backgroundColor: colors.roleInspectorBg
  },
  avatarSup: {
    backgroundColor: colors.roleSupervisorBg
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary
  },
  userCargo: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  },
  roleTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 14
  },
  roleTagInsp: {
    backgroundColor: colors.primaryLight
  },
  roleTagSup: {
    backgroundColor: '#ede9fe'
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '800'
  },
  roleTagTextInsp: {
    color: colors.primaryDark
  },
  roleTagTextSup: {
    color: colors.roleSupervisor
  },
  btnLogoutMain: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4
  },
  btnLogoutMainText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginLeft: 8
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  criteriaText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
    flex: 1
  },
  teamMember: {
    marginBottom: 8
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  memberTask: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 10,
    marginTop: 2
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  actionRowText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4
  }
});
