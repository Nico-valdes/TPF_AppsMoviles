import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { useEffect } from 'react';
import { router } from 'expo-router';
import Home from './home';
import Professionals from './professionals';
import Calendar from './calendar';
import Perfil from './perfil';

const Tab = createBottomTabNavigator();

export default function AppLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // Si no está cargando y no hay usuario, redirigir a login
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  // Si está cargando, mostrar pantalla de carga
  if (loading) {
    return null; // O puedes mostrar un spinner aquí
  }

  // Si no hay usuario, no mostrar nada (se redirigirá automáticamente)
  if (!user) {
    return null;
  }

  return (
    <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;

        if (route.name === 'home') {
          iconName = 'home';
        } else if (route.name === 'professionals') {
          iconName = 'people';
        } else if (route.name === 'calendar') {
          iconName = 'calendar';
        } else if (route.name === 'perfil') {
          iconName = 'person';
        }

        return <Ionicons name={iconName as any} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#00AEEF',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#06204F',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: 70,
        position: 'absolute',
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 5,
      },
    })}
    >
      <Tab.Screen name="home" component={Home} options={{ headerShown: false }} />
      <Tab.Screen name="professionals" component={Professionals} options={{ headerShown: false }} />
      <Tab.Screen name="calendar" component={Calendar} options={{ headerShown: false }} />
      <Tab.Screen name="perfil" component={Perfil} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}