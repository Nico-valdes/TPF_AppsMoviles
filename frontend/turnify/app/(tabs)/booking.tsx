import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/Colors';
import { useRoute } from '@react-navigation/native';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface Professional {
  id: number;
  name: string;
  category: string;
  rating: number;
  hourlyRate: number;
  profileImage?: string;
}

interface BookingData {
  professionalId: number;
  date: string;
  timeSlot: string;
  service: string;
  notes?: string;
}

export default function BookingScreen() {
  const { user, authenticatedRequest } = useAuth();
  const route = useRoute();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [service, setService] = useState('');
  const [notes, setNotes] = useState('');

  // Generar horarios disponibles (9:00 AM - 6:00 PM)
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour <= 18; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push({
        id: time,
        time,
        available: Math.random() > 0.3, // 70% de probabilidad de estar disponible
      });
    }
    return slots;
  };

  useEffect(() => {
    // Verificar si hay un profesional seleccionado desde la navegación
    const params = route.params as any;
    if (params?.selectedProfessional) {
      setSelectedProfessional(params.selectedProfessional);
    }
    
    fetchProfessionals();
    setTimeSlots(generateTimeSlots());
  }, [route.params]);

  const fetchProfessionals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/professionals/`);
      if (response.ok) {
        const data = await response.json();
        setProfessionals(data);
      }
    } catch (error) {
      console.error('Error fetching professionals:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfessionals();
    setTimeSlots(generateTimeSlots());
    setRefreshing(false);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
    // Regenerar horarios para la fecha seleccionada
    setTimeSlots(generateTimeSlots());
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleProfessionalSelect = (professional: Professional) => {
    setSelectedProfessional(professional);
  };

  const handleBooking = async () => {
    if (!selectedProfessional || !selectedDate || !selectedTimeSlot || !service) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const bookingData: BookingData = {
        professionalId: selectedProfessional.id,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        service,
        notes,
      };

      console.log('Enviando datos de reserva:', bookingData);

      // Usar la función helper de autenticación
      
      const response = await authenticatedRequest(`${API_BASE_URL}/api/appointments/create/`, {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });

      console.log('Respuesta del servidor:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Datos de respuesta:', responseData);
        
        Alert.alert(
          '¡Reserva Exitosa!',
          'Tu turno ha sido reservado correctamente',
          [
            {
              text: 'OK',
              onPress: () => {
                // Limpiar formulario
                setSelectedDate('');
                setSelectedTimeSlot('');
                setSelectedProfessional(null);
                setService('');
                setNotes('');
              },
            },
          ]
        );
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        Alert.alert('Error', errorData.message || errorData.error || 'Error al crear la reserva');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Error de conexión o autenticación');
    } finally {
      setLoading(false);
    }
  };

  const renderCalendar = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Generar fechas marcadas para los próximos 30 días
    const markedDates: any = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      markedDates[dateString] = {
        marked: true,
        dotColor: Colors.secondary,
        selected: selectedDate === dateString,
        selectedColor: Colors.secondary,
      };
    }

    return (
      <View style={styles.calendarContainer}>
        <Text style={styles.sectionTitle}>Selecciona una fecha</Text>
        <Calendar
          onDayPress={(day) => handleDateSelect(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: Colors.background,
            calendarBackground: Colors.background,
            textSectionTitleColor: Colors.textPrimary,
            selectedDayBackgroundColor: Colors.secondary,
            selectedDayTextColor: Colors.textInverse,
            todayTextColor: Colors.secondary,
            dayTextColor: Colors.textPrimary,
            textDisabledColor: Colors.textTertiary,
            dotColor: Colors.secondary,
            selectedDotColor: Colors.textInverse,
            arrowColor: Colors.secondary,
            monthTextColor: Colors.textPrimary,
            indicatorColor: Colors.secondary,
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
          minDate={today}
          maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
        />
      </View>
    );
  };

  const renderTimeSlots = () => {
    if (!selectedDate) return null;

    return (
      <View style={styles.timeSlotsContainer}>
        <Text style={styles.sectionTitle}>Selecciona un horario</Text>
        <View style={styles.timeSlotsGrid}>
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.timeSlotCard,
                !slot.available && styles.timeSlotUnavailable,
                selectedTimeSlot === slot.time && styles.timeSlotSelected,
              ]}
              onPress={() => slot.available && handleTimeSlotSelect(slot.time)}
              disabled={!slot.available}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  !slot.available && styles.timeSlotTextUnavailable,
                  selectedTimeSlot === slot.time && styles.timeSlotTextSelected,
                ]}
              >
                {slot.time}
              </Text>
              {!slot.available && (
                <Ionicons name="close-circle" size={16} color={Colors.error} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderProfessionalSelection = () => {
    return (
      <View style={styles.professionalContainer}>
        <Text style={styles.sectionTitle}>Selecciona un profesional</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.professionalsContainer}>
            {professionals.map((professional) => (
              <TouchableOpacity
                key={professional.id}
                style={[
                  styles.professionalCard,
                  selectedProfessional?.id === professional.id && styles.professionalCardSelected,
                ]}
                onPress={() => handleProfessionalSelect(professional)}
              >
                <View style={styles.professionalInfo}>
                  <Text style={styles.professionalName}>{professional.name}</Text>
                  <Text style={styles.professionalCategory}>{professional.category}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color={Colors.warning} />
                    <Text style={styles.ratingText}>{professional.rating}</Text>
                  </View>
                  <Text style={styles.hourlyRateText}>
                    ${professional.hourlyRate}/hora
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderBookingForm = () => {
    if (!selectedProfessional || !selectedDate || !selectedTimeSlot) return null;

    return (
      <View style={styles.bookingFormContainer}>
        <Text style={styles.sectionTitle}>Detalles de la reserva</Text>
        
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Servicio</Text>
          <View style={styles.serviceInput}>
            <TextInput
              style={styles.input}
              placeholder="Ej: Corte de pelo, Consulta médica..."
              value={service}
              onChangeText={setService}
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.formField}>
          <Text style={styles.formLabel}>Notas adicionales (opcional)</Text>
          <View style={styles.notesInput}>
            <TextInput
              style={[styles.input, styles.notesTextInput]}
              placeholder="Agregar notas especiales..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.bookingSummary}>
          <Text style={styles.summaryTitle}>Resumen de la reserva</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Profesional:</Text>
            <Text style={styles.summaryValue}>{selectedProfessional.name}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Fecha:</Text>
            <Text style={styles.summaryValue}>
              {new Date(selectedDate).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Horario:</Text>
            <Text style={styles.summaryValue}>{selectedTimeSlot}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Servicio:</Text>
            <Text style={styles.summaryValue}>{service}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textInverse} size="small" />
          ) : (
            <>
              <Ionicons name="calendar" size={20} color={Colors.textInverse} />
              <Text style={styles.bookButtonText}>Confirmar Reserva</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={24} color={Colors.secondary} />
        <Text style={styles.title}>Reservar Turno</Text>
        <Text style={styles.subtitle}>Selecciona fecha, horario y profesional</Text>
      </View>

      {renderProfessionalSelection()}
      {renderCalendar()}
      {renderTimeSlots()}
      {renderBookingForm()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textInverse,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textInverse,
    opacity: 0.8,
    marginTop: 4,
  },
  professionalContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  professionalsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  professionalCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    minWidth: 160,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  professionalCardSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondaryMuted,
  },
  professionalInfo: {
    alignItems: 'center',
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  professionalCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  hourlyRateText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600',
    marginTop: 4,
  },
  calendarContainer: {
    padding: 20,
  },
  timeSlotsContainer: {
    padding: 20,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlotCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  timeSlotSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondaryMuted,
  },
  timeSlotUnavailable: {
    backgroundColor: Colors.backgroundTertiary,
    borderColor: Colors.borderLight,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  timeSlotTextSelected: {
    color: Colors.secondary,
  },
  timeSlotTextUnavailable: {
    color: Colors.textTertiary,
  },
  bookingFormContainer: {
    padding: 20,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  serviceInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  notesTextInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  bookingSummary: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textInverse,
  },
}); 