import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
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

      const resAppointments = await fetch('http://127.0.0.1:8000/api/appointments/upcoming/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataAppointments = await resAppointments.json();
      setAppointments(dataAppointments);
    };

    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Bienvenido a Turnify</Text>
        <Text style={styles.headerText}>{user?.name}</Text>
        <Text style={styles.subHeaderText}>
          Podrás manejar tus turnos con facilidad.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Próximos Turnos</Text>
      {appointments.length === 0 ? (
        <Text style={styles.noAppointments}>No tienes turnos disponibles.</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.date}>
                {item.date} - {item.start_time} a {item.end_time}
              </Text>
              <Text style={styles.professional}>
                {user?.role === 'professional'
                  ? `Paciente: ${item.regular_name}`
                  : `Profesional: ${item.professional_name}`}
              </Text>
              <Text style={styles.status}>Estado: {item.status}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerContainer: {
    backgroundColor: '#06204F',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subHeaderText: { fontSize: 14, color: '#fff', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  noAppointments: { fontSize: 16, color: '#999', marginTop: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  date: { fontSize: 16, fontWeight: '600', color: '#06204F' },
  professional: { fontSize: 14, color: '#555', marginTop: 4 },
  status: { fontSize: 12, color: '#888', marginTop: 4 },
});
