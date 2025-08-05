import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseChatUpdateProps {
  onUpdate: () => void;
  interval?: number; // en milisegundos
}

export const useChatUpdate = ({ onUpdate, interval = 5000 }: UseChatUpdateProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App se volvió activa, actualizar inmediatamente
        onUpdate();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Iniciar intervalo para actualización automática
    intervalRef.current = setInterval(() => {
      onUpdate();
    }, interval);

    return () => {
      subscription?.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onUpdate, interval]);

  return {
    forceUpdate: onUpdate,
  };
}; 