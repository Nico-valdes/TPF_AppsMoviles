import { Alert } from 'react-native';
import { API_BASE_URL } from '../constants/Config';

interface Professional {
  id: number;
  professional: {
    id: number;
    name: string;
    email: string;
    profileImage?: string;
  };
  category: string;
  category_display: string;
  address: string;
  description: string;
  hourly_rate: number;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    // Crear un AbortController para manejar el timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { data, status: response.status };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.error || errorData.message || `Error ${response.status}`,
        status: response.status,
      };
    }
  } catch (error) {
    console.error('API Request Error:', error);
    let errorMessage = 'Error de conexión';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'La solicitud tardó demasiado tiempo. Verifica tu conexión a internet.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'No se pudo conectar al servidor. Verifica que el backend esté ejecutándose.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      error: errorMessage,
      status: 0,
    };
  }
};

export const showApiError = (error: string, title: string = 'Error') => {
  Alert.alert(title, error, [{ text: 'OK' }]);
};

export const fetchProfessionals = async () => {
  const result = await apiRequest<Professional[]>('/api/professionals/');
  
  if (result.error) {
    showApiError(result.error, 'Error al cargar profesionales');
    return [];
  }
  
  return result.data || [];
}; 