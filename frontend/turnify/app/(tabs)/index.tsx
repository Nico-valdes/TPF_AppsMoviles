import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Redirigir automáticamente a la pantalla home
    router.replace('/(tabs)/home');
  }, []);

  return null; // No renderizar nada mientras redirige
} 