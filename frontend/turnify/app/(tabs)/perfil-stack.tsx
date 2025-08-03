import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Perfil from './perfil';
import MyAppointments from './my-appointments';

const Stack = createStackNavigator();

export default function PerfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile-main" component={Perfil} />
      <Stack.Screen name="my-appointments" component={MyAppointments} />
    </Stack.Navigator>
  );
} 