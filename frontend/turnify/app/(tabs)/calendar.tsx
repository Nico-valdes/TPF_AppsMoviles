import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function Calendar() {
    const [user, setUser] = useState<User | null>(null);

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
    container: { backgroundColor: '#F5F7FA', flex: 1 },
    header: {
        backgroundColor: '#06204F',
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 30,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    welcome: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    subTitle: { fontSize: 14, color: '#fff', marginTop: 10 },
    content: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
    appointmentCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    }
});