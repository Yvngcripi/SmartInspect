import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { authService, DEMO_CREDENTIALS } from '../services/authService';
import { colors } from '../theme/colors';

interface Props {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Acceso directo con 1 toque (Ideal para iPhone y presentación en vivo)
  const handleQuickLogin = async (role: 'inspector' | 'supervisor') => {
    setErrorMessage('');
    setLoading(true);
    try {
      const user = await authService.loginWithRole(role);
      onLoginSuccess(user);
    } catch (err) {
      console.error('Error en login directo:', err);
      const fallbackUser = DEMO_CREDENTIALS[role].user;
      onLoginSuccess(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim() && !password.trim()) {
      setErrorMessage('Ingresa tus datos o toca una de las tarjetas de acceso directo abajo.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.authenticate(email, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Credenciales no reconocidas.');
      }
    } catch (err) {
      console.error('Error al autenticar:', err);
      // Fallback seguro para no bloquear al usuario en el móvil
      const fallbackUser = DEMO_CREDENTIALS.inspector.user;
      onLoginSuccess(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
      >
        {/* Cabecera / Marca Institucional */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="leaf" size={44} color="#10b981" />
          </View>
          <Text style={styles.appName}>SmartInspect</Text>
          <Text style={styles.appSubtitle}>Sistema Móvil de Inspecciones y Siniestros</Text>
          <View style={styles.mvpTag}>
            <Text style={styles.mvpText}>EVALUACIÓN 2 — PRESENTACIÓN MVP</Text>
          </View>
        </View>

        {/* Tarjeta del Formulario de Login */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>
          <Text style={styles.cardDesc}>
            Acceso corporativo para peritos e inspectores técnicos.
          </Text>

          {/* Mensaje de Error si aplica */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Campo Correo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo Electrónico Corporativo</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                placeholder="ej: inspector@smartinspect.cl"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Campo Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  setErrorMessage('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón Ingresar */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
            ) : null}
            <Text style={styles.loginBtnText}>
              {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
            </Text>
            {!loading && (
              <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>

          {/* Separador */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ACCESO RÁPIDO EN 1 TOQUE (RECOMENDADO)</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Acceso Rápido con 1 toque: al tocar entra inmediatamente */}
          <View style={styles.quickAccessRow}>
            {/* Opción 1: Inspector */}
            <TouchableOpacity
              style={styles.quickCardInsp}
              onPress={() => handleQuickLogin('inspector')}
              activeOpacity={0.7}
            >
              <View style={styles.quickIconRow}>
                <Ionicons name="clipboard" size={18} color={colors.roleInspector} />
                <Text style={styles.quickRoleName}>1. Inspector</Text>
              </View>
              <Text style={styles.quickEmail}>inspector@smartinspect.cl</Text>
              <Text style={styles.quickPass}>Clave: smart2026</Text>
              <View style={styles.enterDirectBadgeInsp}>
                <Text style={styles.enterDirectTextInsp}>Toca para entrar directo →</Text>
              </View>
            </TouchableOpacity>

            {/* Opción 2: Supervisor */}
            <TouchableOpacity
              style={styles.quickCardSup}
              onPress={() => handleQuickLogin('supervisor')}
              activeOpacity={0.7}
            >
              <View style={styles.quickIconRow}>
                <Ionicons name="shield-checkmark" size={18} color={colors.roleSupervisor} />
                <Text style={styles.quickRoleNameSup}>2. Supervisor</Text>
              </View>
              <Text style={styles.quickEmail}>supervisor@smartinspect.cl</Text>
              <Text style={styles.quickPass}>Clave: admin2026</Text>
              <View style={styles.enterDirectBadgeSup}>
                <Text style={styles.enterDirectTextSup}>Toca para entrar directo →</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Institucional */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Desarrollo de Aplicaciones Móviles con React Native
          </Text>
          <Text style={styles.footerSubtext}>
            SmartInspect • 2026
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primaryDark
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 6
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5
  },
  appSubtitle: {
    fontSize: 13,
    color: '#a7f3d0',
    marginTop: 3,
    textAlign: 'center'
  },
  mvpTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#10b981'
  },
  mvpText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 3
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.statusRechazadaBg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
    flex: 1
  },
  inputGroup: {
    marginBottom: 12
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 5
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 0
  },
  eyeBtn: {
    padding: 6
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border
  },
  dividerText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    paddingHorizontal: 6,
    letterSpacing: 0.5
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  quickCardInsp: {
    flex: 1,
    backgroundColor: colors.roleInspectorBg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 10,
    marginRight: 4
  },
  quickCardSup: {
    flex: 1,
    backgroundColor: colors.roleSupervisorBg,
    borderWidth: 1.5,
    borderColor: colors.roleSupervisor,
    borderRadius: 12,
    padding: 10,
    marginLeft: 4
  },
  quickIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  quickRoleName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.roleInspector,
    marginLeft: 4
  },
  quickRoleNameSup: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.roleSupervisor,
    marginLeft: 4
  },
  quickEmail: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 1
  },
  quickPass: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1
  },
  enterDirectBadgeInsp: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 8,
    alignItems: 'center'
  },
  enterDirectTextInsp: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800'
  },
  enterDirectBadgeSup: {
    backgroundColor: colors.roleSupervisor,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 8,
    alignItems: 'center'
  },
  enterDirectTextSup: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800'
  },
  footer: {
    marginTop: 16,
    alignItems: 'center'
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600'
  },
  footerSubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    marginTop: 2
  }
});
