import type { User, AuthResponse, UserRole, AdminAccount } from '../types';
import { AdminAccountStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getAdminAccounts } from './adminAccountService'; // Importar servicio de cuentas admin

const AUTH_TOKEN_KEY = 'aiProductGeneratorApp_authToken';
const CURRENT_USER_KEY = 'aiProductGeneratorApp_currentUser';

// Mock users - in a real localStorage-based auth, register would add to this list.
// For now, only these users can "log in".
const mockUsers: User[] = [
  { id: 'user-sme-001', email: 'user@example.com', name: 'SME User', role: 'sme', profileImageUrl: '' },
  { id: 'user-superadmin-001', email: 'superadmin@example.com', name: 'Super Admin', role: 'superadmin', profileImageUrl: '' },
];
// Mock passwords (in a real scenario, never store plain text passwords)
const mockPasswords: Record<string, string> = {
  'user@example.com': 'password123',
  'superadmin@example.com': 'superpassword',
};

const normalizeRole = (roleFromServer?: string | UserRole): UserRole => {
  if (roleFromServer) {
    const lowerRole = String(roleFromServer).toLowerCase();
    if (lowerRole === 'superadmin') {
      return 'superadmin';
    }
    if (lowerRole === 'sme') {
      return 'sme';
    }
  }
  return 'sme'; // Default to 'sme' if undefined or not recognized
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  console.log(`AuthService (localStorage): Intentando login para ${email}`);
  const normalizedEmail = email.toLowerCase();

  // 1. Check hardcoded mock users first
  const foundMockUser = mockUsers.find(u => u.email.toLowerCase() === normalizedEmail);

  if (foundMockUser) {
    if (mockPasswords[foundMockUser.email] === password) {
      // Try to load existing user from localStorage to preserve profileImageUrl
      const existingStoredUser = getCurrentUser();
      let profileImageUrl = foundMockUser.profileImageUrl || '';
      if (existingStoredUser && existingStoredUser.id === foundMockUser.id && existingStoredUser.profileImageUrl) {
        profileImageUrl = existingStoredUser.profileImageUrl;
      }
      
      const userToStore: User = {
          id: foundMockUser.id,
          email: foundMockUser.email,
          name: foundMockUser.name,
          role: normalizeRole(foundMockUser.role),
          profileImageUrl: profileImageUrl,
      };
      const token = `mock-token-${uuidv4()}`;
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToStore));
        console.log('AuthService (localStorage): Login exitoso para mock user, token y usuario guardados.', userToStore);
        return { token, user: userToStore };
      } catch (error) {
        console.error("AuthService (localStorage): Error al guardar en localStorage después de login (mock user):", error);
        throw new Error('Error del sistema al procesar el inicio de sesión local.');
      }
    } else {
      throw new Error('Credenciales inválidas (simulado).');
    }
  }

  // 2. If not a hardcoded mock user, check dynamically created admin accounts from localStorage
  console.log(`AuthService (localStorage): Usuario ${normalizedEmail} no encontrado en mocks, buscando en adminAccounts...`);
  try {
    const adminAccounts: AdminAccount[] = await getAdminAccounts();
    const foundAdminAccount = adminAccounts.find(acc => acc.email.toLowerCase() === normalizedEmail);

    if (foundAdminAccount) {
      console.log(`AuthService (localStorage): Cuenta admin encontrada:`, foundAdminAccount);
      // For dynamically created admin accounts, if status is active, allow login with any non-empty password (mock behavior)
      if (foundAdminAccount.status === AdminAccountStatus.Active) {
        if (password && password.trim() !== '') { // Check if any password was provided
           // Try to load existing user from localStorage to preserve profileImageUrl
          const existingStoredUser = getCurrentUser();
          let profileImageUrl = ''; // Dynamic accounts don't have a default mock image unless stored
          if (existingStoredUser && existingStoredUser.id === foundAdminAccount.id && existingStoredUser.profileImageUrl) {
            profileImageUrl = existingStoredUser.profileImageUrl;
          }

          const userToStore: User = {
            id: foundAdminAccount.id,
            email: foundAdminAccount.email,
            name: foundAdminAccount.name,
            role: 'sme', // Assign 'sme' role to these admin accounts for app access
            profileImageUrl: profileImageUrl,
          };
          const token = `mock-admin-token-${uuidv4()}`;
          localStorage.setItem(AUTH_TOKEN_KEY, token);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToStore));
          console.log('AuthService (localStorage): Login exitoso para cuenta admin dinámica, token y usuario guardados.', userToStore);
          return { token, user: userToStore };
        } else {
            console.log(`AuthService (localStorage): Contraseña vacía para cuenta admin dinámica ${normalizedEmail}.`);
            throw new Error('Contraseña requerida (simulado).');
        }
      } else {
        console.log(`AuthService (localStorage): Cuenta admin dinámica ${normalizedEmail} no está activa. Estado: ${foundAdminAccount.status}`);
        throw new Error('Cuenta de administrador inactiva o suspendida.');
      }
    }
  } catch (serviceError) {
      console.error("AuthService (localStorage): Error al consultar adminAccountService:", serviceError);
      if (serviceError instanceof Error && (serviceError.message.startsWith("Credenciales inválidas") || serviceError.message.startsWith("Cuenta de administrador inactiva"))) {
          throw serviceError;
      }
  }
  
  console.log(`AuthService (localStorage): Usuario ${normalizedEmail} no encontrado.`);
  throw new Error('Credenciales inválidas (simulado).');
};

export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  console.log(`AuthService (localStorage): Intentando registrar a ${email}`);
  const normalizedEmail = email.toLowerCase();
  
  const existingMockUser = mockUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingMockUser) {
    if (mockPasswords[existingMockUser.email] === password) {
        return login(email, password); 
    } else {
        throw new Error("Este usuario de demostración ya existe con una contraseña diferente.");
    }
  }
  
  const adminAccounts = await getAdminAccounts();
  const existingAdminAccount = adminAccounts.find(acc => acc.email.toLowerCase() === normalizedEmail);
  if (existingAdminAccount) {
    throw new Error("Una cuenta de administrador con este email ya existe.");
  }

  const newUserRole = normalizedEmail.includes('superadmin') ? 'superadmin' : 'sme';
  const newUser: User = {
    id: `temp-user-${uuidv4()}`,
    email: normalizedEmail,
    name: name || `Usuario ${normalizedEmail.split('@')[0]}`,
    role: newUserRole,
    profileImageUrl: '', // Initialize with empty profile image
  };
  const token = `mock-token-register-${uuidv4()}`;
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    console.log('AuthService (localStorage): Registro simulado exitoso.', newUser);
    return { token, user: newUser };
  } catch (error) {
    console.error("AuthService (localStorage): Error al guardar en localStorage después de registro simulado:", error);
    throw new Error('Error del sistema al procesar el registro simulado.');
  }
};

export const logout = async (): Promise<void> => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    console.log('AuthService (localStorage): Logout, token y usuario eliminados.');
  } catch (error) {
    console.error("AuthService (localStorage): Error al limpiar localStorage:", error);
  }
  return Promise.resolve();
};

export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (userStr) {
      const user = JSON.parse(userStr) as User;
      if (user && typeof user.id === 'string' && typeof user.email === 'string') {
        user.role = normalizeRole(user.role);
        // Ensure profileImageUrl is at least an empty string if not present
        user.profileImageUrl = user.profileImageUrl || ''; 
        return user;
      }
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (error) {
    console.error("AuthService (localStorage): Error al parsear usuario desde localStorage:", error);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
  return null;
};

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error("AuthService (localStorage): Error al obtener token desde localStorage:", error);
    return null;
  }
};

export const updateUserProfileImage = async (userId: string, imageUrl: string): Promise<User | null> => {
  console.log(`AuthService (localStorage): Actualizando imagen de perfil para usuario ${userId}`);
  try {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (userStr) {
      const user = JSON.parse(userStr) as User;
      if (user.id === userId) {
        user.profileImageUrl = imageUrl;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        console.log('AuthService (localStorage): Imagen de perfil actualizada en localStorage.', user);
        return user;
      }
    }
    console.warn(`AuthService (localStorage): No se encontró el usuario ${userId} en localStorage para actualizar imagen.`);
    return null;
  } catch (error) {
    console.error("AuthService (localStorage): Error al actualizar imagen de perfil en localStorage:", error);
    return null;
  }
};

export const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  return headers;
};