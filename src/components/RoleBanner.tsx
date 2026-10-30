import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { colors } from '../theme/colors';

interface Props {
  user: User | null;
}

export const RoleBanner: React.FC<Props> = ({ user }) => {
  if (!user) return null;

  const isSupervisor = user.rol === 'supervisor';

  return (
    <View style={[styles.container, isSupervisor ? styles.containerSup : styles.containerInsp]}>
      <View style={styles.left}>
        <View style={[styles.avatar, isSupervisor ? styles.avatarSup : styles.avatarInsp]}>
          <Ionicons
            name={isSupervisor ? 'shield-checkmark' : 'clipboard'}
            size={16}
            color={isSupervisor ? colors.roleSupervisor : colors.roleInspector}
          />
        </View>
        <View>
          <View style={styles.roleRow}>
            <Text style={styles.roleText}>
              {isSupervisor ? 'ROL: SUPERVISOR TÉCNICO' : 'ROL: INSPECTOR TERRENO'}
            </Text>
            <View style={[styles.tag, isSupervisor ? styles.tagSup : styles.tagInsp]}>
              <Text style={[styles.tagText, isSupervisor ? styles.tagTextSup : styles.tagTextInsp]}>
                {isSupervisor ? 'Aprobador' : 'Operativo'}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user.nombre}</Text>
        </View>
      </View>

      <View style={styles.rightBadge}>
        <Ionicons name="checkmark-circle" size={14} color={isSupervisor ? colors.roleSupervisor : colors.primary} style={{ marginRight: 4 }} />
        <Text style={[styles.rightBadgeText, { color: isSupervisor ? colors.roleSupervisor : colors.primary }]}>
          {isSupervisor ? 'Modo Auditoría' : 'Modo Terreno'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  containerInsp: {
    backgroundColor: colors.roleInspectorBg
  },
  containerSup: {
    backgroundColor: colors.roleSupervisorBg
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#ffffff'
  },
  avatarInsp: {
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  avatarSup: {
    borderWidth: 1,
    borderColor: '#ddd6fe'
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  tag: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8
  },
  tagInsp: {
    backgroundColor: colors.primaryLight
  },
  tagSup: {
    backgroundColor: '#ede9fe'
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700'
  },
  tagTextInsp: {
    color: colors.primary
  },
  tagTextSup: {
    color: colors.roleSupervisor
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  rightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  rightBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  }
});
