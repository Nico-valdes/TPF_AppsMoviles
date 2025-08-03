import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Booking from './booking';
import BookingDetails from './booking-details';

const Stack = createStackNavigator();

export default function CategoriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="booking-main" component={Booking} />
      <Stack.Screen name="booking-details" component={BookingDetails} />
    </Stack.Navigator>
  );
} 