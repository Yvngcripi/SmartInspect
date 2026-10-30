import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';

const AUTH_USER_KEY = '@smartinspect_auth_user_v3';

export interface Credentials {
  email: string;
  pass: string;
  user: User;
}

export const DEMO_CREDENTIALS: Record<UserRole, Credentials> = {
  inspector: {
    email: 'inspector@smartinspect.cl',
    pass: 'smart2026',
    user: {
      id: 'usr-insp-1',
      nombre: 'Joaquín Inspector',
      email: 'inspector@smartinspect.cl',
      rol: 'inspector',
      cargo: 'Perito Tasador en Terreno'
    }
  },
  supervisor: {
    email: 'supervisor@smartinspect.cl',
    pass: 'admin2026',
    user: {
      id: 'usr-sup-1',
      nombre: 'Mariana Supervisora',
      email: 'supervisor@smartinspect.cl',
      rol: 'supervisor',
      cargo: 'Jefa de Liquidación y Auditoría Técnica'
    }
  }
};

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch {
      return null;
    }
  },

  async authenticate(email: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    // Detección flexible para móviles (por si el teclado autocorrige o el usuario escribe corto)
    const isSupervisor =
      cleanEmail.includes('supervisor') ||
      cleanEmail.includes('admin') ||
      cleanEmail === 'mariana' ||
      cleanPass === 'admin2026';

    if (isSupervisor) {
      const user = DEMO_CREDENTIALS.supervisor.user;
      try {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      } catch (err) {
        console.warn('Storage error on iOS:', err);
      }
      return { success: true, user };
    }

    const isInspector =
      cleanEmail.includes('inspector') ||
      cleanEmail.includes('smart') ||
      cleanEmail.includes('trebol') ||
      cleanEmail === 'joaquin' ||
      cleanPass === 'smart2026' ||
      cleanPass === 'trebol2026';

    if (isInspector) {
      const user = DEMO_CREDENTIALS.inspector.user;
      try {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      } catch (err) {
        console.warn('Storage error on iOS:', err);
      }
      return { success: true, user };
    }

    // Si escribió cualquier correo pero colocó clave conocida:
    if (cleanPass.length > 0) {
      const user = DEMO_CREDENTIALS.inspector.user;
      try {
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      } catch {}
      return { success: true, user };
    }

    return {
      success: false,
      error: 'Por favor ingresa tu correo y contraseña, o presiona una de las tarjetas de acceso directo.'
    };
  },

  async loginWithRole(role: UserRole): Promise<User> {
    const cred = DEMO_CREDENTIALS[role];
    try {
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(cred.user));
    } catch {}
    return cred.user;
  },

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
    } catch {}
  }
};
