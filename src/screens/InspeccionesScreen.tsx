import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Inspeccion, User, EstadoInspeccion } from '../types';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { InspectionCard } from '../components/InspectionCard';
import { RoleBanner } from '../components/RoleBanner';
import { colors } from '../theme/colors';

interface Props {
  navigation: any;
}

export const InspeccionesScreen: React.FC<Props> = ({ navigation }) => {
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'todas' | EstadoInspeccion>('todas');
  const [bancoFilter, setBancoFilter] = useState<string>('todos');

  const loadData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      const list = await storageService.getInspecciones();
      setInspecciones(list);
    } catch (error) {
      console.error('Error cargando inspecciones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filtrado de la lista en memoria (rápido y responsivo)
  const filteredList = inspecciones.filter(item => {
    // Filtro por texto de búsqueda
    const query = searchQuery.toLowerCase().trim();
    const matchQuery =
      !query ||
      item.nombreCliente.toLowerCase().includes(query) ||
      item.siniestro.toLowerCase().includes(query) ||
      (item.direccion && item.direccion.toLowerCase().includes(query)) ||
      (item.rut && item.rut.toLowerCase().includes(query));

    // Filtro por estado
    const matchEstado = estadoFilter === 'todas' || item.estado === estadoFilter;

    // Filtro por banco
    const matchBanco = bancoFilter === 'todos' || item.banco === bancoFilter;

    return matchQuery && matchEstado && matchBanco;
  });

  const bancosDisponibles = ['todos', 'Banco de Chile', 'Santander', 'BCI', 'BancoEstado'];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Banner de Rol activo */}
      <RoleBanner user={currentUser} />

      {/* Barra de Búsqueda */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por cliente, siniestro, RUT o dirección..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros Horizontales por Estado */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, estadoFilter === 'todas' && styles.filterChipActive]}
            onPress={() => setEstadoFilter('todas')}
          >
            <Text style={[styles.filterChipText, estadoFilter === 'todas' && styles.filterChipTextActive]}>
              Todas ({inspecciones.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, estadoFilter === 'borrador' && styles.filterChipActive]}
            onPress={() => setEstadoFilter('borrador')}
          >
            <Text style={[styles.filterChipText, estadoFilter === 'borrador' && styles.filterChipTextActive]}>
              Borradores ({inspecciones.filter(i => i.estado === 'borrador').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, estadoFilter === 'en_revision' && styles.filterChipActive]}
            onPress={() => setEstadoFilter('en_revision')}
          >
            <Text style={[styles.filterChipText, estadoFilter === 'en_revision' && styles.filterChipTextActive]}>
              En Revisión ({inspecciones.filter(i => i.estado === 'en_revision').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, estadoFilter === 'aprobada' && styles.filterChipActive]}
            onPress={() => setEstadoFilter('aprobada')}
          >
            <Text style={[styles.filterChipText, estadoFilter === 'aprobada' && styles.filterChipTextActive]}>
              Aprobadas ({inspecciones.filter(i => i.estado === 'aprobada').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, estadoFilter === 'rechazada' && styles.filterChipActive]}
            onPress={() => setEstadoFilter('rechazada')}
          >
            <Text style={[styles.filterChipText, estadoFilter === 'rechazada' && styles.filterChipTextActive]}>
              Con Obs. ({inspecciones.filter(i => i.estado === 'rechazada').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Lista de Inspecciones */}
      <FlatList
        data={filteredList}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <InspectionCard
            inspeccion={item}
            onPress={() => navigation.navigate('DetalleInspeccion', { id: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No se encontraron inspecciones</Text>
            <Text style={styles.emptyDesc}>
              {searchQuery || estadoFilter !== 'todas'
                ? 'Prueba modificando los filtros o el texto de búsqueda.'
                : 'Usa la pestaña "Registrar" abajo para crear una nueva inspección.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 0
  },
  filtersWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8
  },
  filterScroll: {
    paddingHorizontal: 16
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  listContent: {
    padding: 16,
    paddingBottom: 90
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6
  }
});
