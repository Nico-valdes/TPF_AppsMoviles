import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Calendar() {

    const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      try {
        const res = await fetch('http://127.0.0.1:8000/api/users/me/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.log('Error trayendo usuario:', error);
      }
    };
    
    fetchUser();
  }, []);

    if (user?.role === 'professional') {
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.welcome}>Bienvenido {user.name}</Text>
              <Text style={styles.subTitle}>
                Administrá tus turnos y clientes desde Turnify
              </Text>
            </View>
    
            <ScrollView contentContainerStyle={styles.content}>
              <Text style={styles.sectionTitle}>Estadísticas rápidas</Text>
              <View style={styles.appointmentCard}>
                <Text>Turnos esta semana: 5</Text>
                <Text>Clientes recurrentes: 3</Text>
              </View>
            </ScrollView>
          </View>
        );
      }

    return (
        <View style={styles.container}>
            <Text>Bienvenido</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#F5F7FA'},
});