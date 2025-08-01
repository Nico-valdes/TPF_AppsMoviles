import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipos para el contexto
type AuthContextType = {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string, role: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async () => false,
  signUp: async () => false,
  signOut: async () => {},
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
          setUser(userInfo);
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
      const response = await fetch('http://127.0.0.1:8000/api/token/', {
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
          setUser(userInfo);
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
      const response = await fetch('http://127.0.0.1:8000/api/register/', {
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
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 