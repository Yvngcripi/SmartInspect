import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Inspeccion } from '../types';
import { StatusBadge } from './StatusBadge';
import { colors } from '../theme/colors';

interface Props {
  inspeccion: Inspeccion;
  onPress: () => void;
}

export const InspectionCard: React.FC<Props> = ({ inspeccion, onPress }) => {
  const totalDanos = inspeccion.dependencias.reduce((acc, dep) => acc + (dep.danos?.length || 0), 0);
  const totalDeps = inspeccion.dependencias.length;

  const formatFolio = (num: number) => {
    return `#${num.toString().padStart(3, '0')}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Cabecera de la tarjeta: Folio y Estado */}
      <View style={styles.header}>
        <View style={styles.folioContainer}>
          <Text style={styles.folio}>{formatFolio(inspeccion.folioNumber)}</Text>
          <View style={styles.bankPill}>
            <Ionicons name="business-outline" size={12} color={colors.primaryDark} style={{ marginRight: 4 }} />
            <Text style={styles.bankText}>{inspeccion.banco}</Text>
          </View>
        </View>
        <StatusBadge estado={inspeccion.estado} size="small" />
      </View>

      {/* Datos del Cliente y Siniestro */}
      <View style={styles.body}>
        <Text style={styles.clientName}>{inspeccion.nombreCliente}</Text>
        <Text style={styles.rutText}>RUT: {inspeccion.rut || 'No informado'}</Text>

        <View style={styles.siniestroRow}>
          <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.siniestroText}>Siniestro: {inspeccion.siniestro}</Text>
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.addressText} numberOfLines={1}>{inspeccion.direccion}</Text>
        </View>
      </View>

      {/* Métricas clave en terreno */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Ionicons name="cube-outline" size={14} color={colors.primary} />
          <Text style={styles.metricLabel}>{inspeccion.metrosCuadradosTotales} m²</Text>
        </View>

        <View style={styles.metricItem}>
          <Ionicons name="home-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metricLabel}>{totalDeps} dependencias</Text>
        </View>

        <View style={styles.metricItem}>
          <Ionicons name="warning-outline" size={14} color={totalDanos > 0 ? colors.warning : colors.textMuted} />
          <Text style={[styles.metricLabel, totalDanos > 0 && { color: colors.warning, fontWeight: '700' }]}>
            {totalDanos} daños
          </Text>
        </View>
      </View>

      {/* Footer con fecha y flecha */}
      <View style={styles.footer}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={styles.dateText}>{inspeccion.fecha}</Text>
        </View>
        <View style={styles.arrowRow}>
          <Text style={styles.viewDetailsText}>Ver detalles</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  folioContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  folio: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
    marginRight: 8
  },
  bankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  bankText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark
  },
  body: {
    marginBottom: 12
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2
  },
  rutText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6
  },
  siniestroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  siniestroText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginBottom: 10
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textPrimary,
    marginLeft: 6,
    fontWeight: '500'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2
  }
});
