import { Redirect } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';

export default function IndexPage() {
  const { user, loading } = useAuth();

  // Si está cargando, mostrar pantalla de carga
  if (loading) {
    return null; // O puedes mostrar un spinner aquí
  }

  // Si hay usuario logueado, ir a home
  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }

  // Si no hay usuario, ir a login
  return <Redirect href="/(auth)/login" />;
}