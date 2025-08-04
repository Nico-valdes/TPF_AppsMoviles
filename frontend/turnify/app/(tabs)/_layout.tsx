import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { useEffect } from 'react';
import { router } from 'expo-router';
import Home from './home';
import PerfilStack from './perfil-stack';
import CategoriesStack from './categories-stack';
import Messages from './messages';

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
        } else if (route.name === 'booking') {
          iconName = 'calendar';
        } else if (route.name === 'messages') {
          iconName = 'chatbubbles';
        } else if (route.name === 'profile') {
          iconName = 'person';
        }

        return <Ionicons name={iconName as any} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#34eb89',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#1c1c1c',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: 70,
        position: 'absolute',
        borderTopWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 5,
      },
    })}
    >
      <Tab.Screen name="home" component={Home} options={{ headerShown: false }} />
      <Tab.Screen 
        name="booking" 
        component={CategoriesStack} 
        options={{ 
          headerShown: false,
          tabBarLabel: 'Reservar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="messages" 
        component={Messages} 
        options={{ 
          headerShown: false,
          tabBarLabel: 'Mensajes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }} 
      />
      <Tab.Screen name="profile" component={PerfilStack} options={{ headerShown: false }} />

    </Tab.Navigator>
  );
}