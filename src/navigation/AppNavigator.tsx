import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { User } from '../types';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { colors } from '../theme/colors';

// Pantallas
import { LoginScreen } from '../screens/LoginScreen';
import { InspeccionesScreen } from '../screens/InspeccionesScreen';
import { NuevaInspeccionScreen } from '../screens/NuevaInspeccionScreen';
import { DetalleInspeccionScreen } from '../screens/DetalleInspeccionScreen';
import { DependenciasScreen } from '../screens/DependenciasScreen';
import { SupervisorDashboardScreen } from '../screens/SupervisorDashboardScreen';
import { PerfilScreen } from '../screens/PerfilScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack de Navegación de Inspecciones
const InspeccionesStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primaryDark
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '800'
        },
        headerBackTitle: 'Volver'
      }}
    >
      <Stack.Screen
        name="InspeccionesLista"
        component={InspeccionesScreen}
        options={{ title: 'SmartInspect' }}
      />

      <Stack.Screen
        name="DetalleInspeccion"
        component={DetalleInspeccionScreen}
        options={{ title: 'Ficha de Inspección' }}
      />

      <Stack.Screen
        name="GestionDependencias"
        component={DependenciasScreen}
        options={{ title: 'Dependencias y Daños' }}
      />

      <Stack.Screen
        name="NuevaInspeccion"
        component={NuevaInspeccionScreen}
        options={{ title: 'Registrar Inspección' }}
      />
    </Stack.Navigator>
  );
};

// Bottom Tabs Navigator Principal
const MainTabNavigator = ({
  user,
  onLogout
}: {
  user: User;
  onLogout: () => void;
}) => {
  const isSupervisor = user.rol === 'supervisor';
  const [revisionCount, setRevisionCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    storageService.getInspecciones().then(list => {
      const count = list.filter(i => i.estado === 'en_revision').length;
      if (count > 0) setRevisionCount(count);
      else setRevisionCount(undefined);
    });
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'document-text';

          if (route.name === 'TabInspecciones') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'TabNueva') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'TabSupervisor') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'TabPerfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: isSupervisor ? colors.roleSupervisor : colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700'
        },
        headerStyle: {
          backgroundColor: colors.primaryDark
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '800'
        }
      })}
    >
      <Tab.Screen
        name="TabInspecciones"
        component={InspeccionesStackNavigator}
        options={{ headerShown: false, tabBarLabel: 'Inspecciones' }}
      />

      <Tab.Screen
        name="TabNueva"
        component={NuevaInspeccionScreen}
        options={{
          title: 'Nueva Inspección',
          tabBarLabel: 'Registrar'
        }}
      />

      <Tab.Screen
        name="TabSupervisor"
        component={SupervisorDashboardScreen}
        options={{
          title: 'Panel de Supervisión',
          tabBarLabel: 'Supervisión',
          tabBarBadge: isSupervisor && revisionCount ? revisionCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.warning }
        }}
      />

      <Tab.Screen
        name="TabPerfil"
        options={{
          title: 'Mi Perfil & Equipo',
          tabBarLabel: 'Perfil'
        }}
      >
        {() => <PerfilScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initApp = async () => {
    try {
      // Inicializar datos semilla si no existen
      await storageService.getInspecciones();
      // OBLIGATORIO: Siempre cerrar sesión al abrir/recargar la app para exigir pantalla de Login
      await authService.logout();
      setCurrentUser(null);
    } catch (e) {
      console.error(e);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleRoleChanged = async () => {
    const updated = await authService.getCurrentUser();
    setCurrentUser(updated);
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryDark }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {currentUser ? (
        <MainTabNavigator
          user={currentUser}
          onLogout={handleLogout}
        />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {() => <LoginScreen onLoginSuccess={handleLoginSuccess} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
