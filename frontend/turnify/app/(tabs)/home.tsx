import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Appointment {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  regular_name?: string;
  professional_name?: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch user data
        const userResponse = await fetch('http://127.0.0.1:8000/api/users/me/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        }

        // Fetch appointments data
        const appointmentsResponse = await fetch('http://127.0.0.1:8000/api/appointments/upcoming/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          setAppointments(appointmentsData);
        }
      } catch (error) {
        console.log('Error trayendo datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Bienvenido a Turnify</Text>
        <Text style={styles.headerText}>{user?.name || 'Usuario'}</Text>
        <Text style={styles.subHeaderText}>
          Podrás manejar tus turnos con facilidad.
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Próximos Turnos</Text>
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.noAppointments}>No tienes turnos disponibles.</Text>
            <Text style={styles.emptySubtext}>Reserva tu primer turno desde la pestaña de Profesionales</Text>
          </View>
        ) : (
          appointments.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.date}>
                {item.date} - {item.start_time} a {item.end_time}
              </Text>
              <Text style={styles.professional}>
                {user?.role === 'professional'
                  ? `Paciente: ${item.regular_name || 'Sin nombre'}`
                  : `Profesional: ${item.professional_name || 'Sin nombre'}`}
              </Text>
              <Text style={styles.status}>Estado: {item.status}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F7FA' 
  },
  headerContainer: {
    backgroundColor: '#06204F',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerText: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  subHeaderText: { 
    fontSize: 14, 
    color: '#fff', 
    marginBottom: 20 
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginTop: 20,
    marginBottom: 15,
    color: '#333'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAppointments: { 
    fontSize: 16, 
    color: '#999',
    textAlign: 'center',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  date: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#06204F' 
  },
  professional: { 
    fontSize: 14, 
    color: '#555', 
    marginTop: 4 
  },
  status: { 
    fontSize: 12, 
    color: '#888', 
    marginTop: 4 
  },
});