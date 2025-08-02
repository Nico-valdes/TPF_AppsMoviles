import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';

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
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch user data
      const userResponse = await fetch(`${API_BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      }

      // Fetch appointments data
      const appointmentsResponse = await fetch(`${API_BASE_URL}/api/appointments/upcoming/`, {
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

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00AEEF" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'completed':
        return Colors.success;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            ¡Hola, {user?.name}!
          </Text>
          <Text style={styles.subtitleText}>
            {user?.role === 'professional' ? 'Profesional' : 'Cliente'}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar" size={30} color={Colors.textInverse} />
        </View>
      </View>

      {/* Appointments Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={24} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>📅 Mis Próximos Turnos</Text>
        </View>
        
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={60} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No tienes turnos programados</Text>
            <Text style={styles.emptySubtext}>
              {user?.role === 'professional' 
                ? 'Los turnos que programes aparecerán aquí'
                : 'Los turnos que reserves aparecerán aquí'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.dateTimeContainer}>
                    <Text style={styles.dateText}>
                      {formatDate(appointment.date)}
                    </Text>
                    <Text style={styles.timeText}>
                      {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                    <Text style={styles.statusText}>
                      {getStatusText(appointment.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>
                      {user?.role === 'professional' 
                        ? `Cliente: ${appointment.regular_name || 'Sin nombre'}`
                        : `Profesional: ${appointment.professional_name || 'Sin nombre'}`
                      }
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash" size={24} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
        </View>
        
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('booking')}
          >
            <Ionicons name="add-circle" size={32} color={Colors.secondary} />
            <Text style={styles.actionText}>
              {user?.role === 'professional' ? 'Nuevo Turno' : 'Reservar Turno'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('professionals')}
          >
            <Ionicons name="people" size={32} color={Colors.success} />
            <Text style={styles.actionText}>
              {user?.role === 'professional' ? 'Mis Clientes' : 'Ver Profesionales'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: Colors.textInverse,
    marginBottom: 5,
  },
  subtitleText: { 
    fontSize: 16, 
    color: Colors.textInverse,
    opacity: 0.8,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: Colors.background,
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: Colors.textPrimary,
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: { 
    fontSize: 16, 
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  appointmentsList: {
    gap: 15,
  },
  appointmentCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  timeText: { 
    fontSize: 14, 
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { 
    fontSize: 12, 
    color: Colors.textInverse,
    fontWeight: '600',
  },
  appointmentDetails: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: { 
    fontSize: 14, 
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 15,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
});