import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/Config';

// Tipos para el contexto
type AuthContextType = {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string, role: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  authenticatedRequest: (url: string, options?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async () => false,
  signUp: async () => false,
  signOut: async () => {},
  authenticatedRequest: async () => new Response(),
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay un token guardado al iniciar la app
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        // Decodificar el token para obtener información del usuario
        const userInfo = decodeToken(token);
        if (userInfo) {
          // Incluir el token en el estado del usuario
          setUser({
            ...userInfo,
            token: token, // Agregar el token completo
          });
        } else {
          // Token inválido, limpiar
          await AsyncStorage.removeItem('access_token');
          await AsyncStorage.removeItem('refresh_token');
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const decodeToken = (token: string) => {
    try {
      // Decodificar el token JWT (parte del payload)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      
      // Extraer información del usuario del token
      return {
        id: payload.user_id,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        // Guardar tokens
        await AsyncStorage.setItem('access_token', data.access);
        await AsyncStorage.setItem('refresh_token', data.refresh);
        
        // Decodificar el token para obtener información del usuario
        const userInfo = decodeToken(data.access);
        if (userInfo) {
          // Incluir el token en el estado del usuario
          setUser({
            ...userInfo,
            token: data.access, // Agregar el token completo
          });
        }
        return true;
      } else {
        console.error('Login error:', data.detail || data.error);
        return false;
      }
    } catch (error) {
      console.error('Network error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string, role: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await response.json();
      
      if (response.ok) {
        // No establecer usuario aquí, solo registrar
        return true;
      } else {
        console.error('Register error:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Network error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('access_token', data.access);
        
        // Actualizar el estado del usuario con el nuevo token
        const userInfo = decodeToken(data.access);
        if (userInfo) {
          setUser({
            ...userInfo,
            token: data.access,
          });
        }
        return true;
      } else {
        // Token de refresh expirado, limpiar todo
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  const authenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = await AsyncStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    // Si el token expiró, intentar refrescarlo
    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Reintentar la request con el nuevo token
        const newToken = await AsyncStorage.getItem('access_token');
        return fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
            ...options.headers,
          },
        });
      } else {
        // No se pudo refrescar, redirigir al login
        setUser(null);
        throw new Error('Authentication failed');
      }
    }

    return response;
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, authenticatedRequest }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;