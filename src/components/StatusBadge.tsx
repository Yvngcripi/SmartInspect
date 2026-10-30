import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EstadoInspeccion } from '../types';
import { colors } from '../theme/colors';

interface Props {
  estado: EstadoInspeccion;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<Props> = ({ estado, size = 'medium' }) => {
  const getBadgeConfig = () => {
    switch (estado) {
      case 'aprobada':
        return {
          label: 'Aprobada',
          bg: colors.statusAprobadaBg,
          text: colors.statusAprobada
        };
      case 'en_revision':
        return {
          label: 'En Revisión',
          bg: colors.statusRevisionBg,
          text: colors.statusRevision
        };
      case 'rechazada':
        return {
          label: 'Con Observaciones',
          bg: colors.statusRechazadaBg,
          text: colors.statusRechazada
        };
      case 'borrador':
      default:
        return {
          label: 'Borrador',
          bg: colors.statusBorradorBg,
          text: colors.statusBorrador
        };
    }
  };

  const config = getBadgeConfig();
  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSmall]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.label, { color: config.text }, isSmall && styles.labelSmall]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start'
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  label: {
    fontSize: 12,
    fontWeight: '700'
  },
  labelSmall: {
    fontSize: 11
  }
});
