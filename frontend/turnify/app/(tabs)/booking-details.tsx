import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';

interface SelectedProfessional {
  id: number;
  name: string;
  category: string;
  rating: string;
  hourlyRate: string;
  profileImage?: string;
  distance?: number;
}

interface RouteParams {
  selectedProfessional: SelectedProfessional;
}

export default function BookingDetails() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedProfessional } = route.params as RouteParams;
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [service, setService] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !service.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        professional: selectedProfessional.id,
        date: selectedDate,
        start_time: selectedTime,
        service: service.trim(),
        notes: notes.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/api/appointments/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        Alert.alert(
          '¡Reserva Exitosa!',
          'Tu turno ha sido reservado correctamente',
          [
            {
              text: 'OK',
              onPress: () => {
                // Redirigir al home después de la reserva exitosa
                (navigation as any).navigate('home');
              }
            }
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Error al crear la reserva');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const showTimeSelector = () => {
    console.log('Botón de hora presionado');
    setShowTimeModal(true);
  };

  const selectTime = (time: string) => {
    setSelectedTime(time);
    setShowTimeModal(false);
    console.log('Hora seleccionada:', time);
  };



  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reservar Turno</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Información del profesional */}
      <View style={styles.professionalCard}>
        <View style={styles.professionalHeader}>
          <Image
            source={
              selectedProfessional.profileImage
                ? { uri: selectedProfessional.profileImage.startsWith('http') 
                    ? selectedProfessional.profileImage 
                    : `${API_BASE_URL}${selectedProfessional.profileImage}` }
                : require('../../assets/images/icon.png')
            }
            style={styles.professionalAvatar}
            onError={(error) => {
              console.log('Error loading image for:', selectedProfessional.name, error);
              // Fallback a imagen local si hay error
              return require('../../assets/images/icon.png');
            }}
            onLoad={() => console.log('Image loaded successfully for:', selectedProfessional.name)}
            resizeMode="cover"
          />
          <View style={styles.professionalInfo}>
            <Text style={styles.professionalName}>{selectedProfessional.name}</Text>
            <Text style={styles.professionalCategory}>{selectedProfessional.category}</Text>
            <View style={styles.professionalDetails}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={Colors.warning} />
                <Text style={styles.ratingText}>{selectedProfessional.rating}</Text>
              </View>
              <Text style={styles.priceText}>${selectedProfessional.hourlyRate}/hora</Text>
              {selectedProfessional.distance && (
                <View style={styles.distanceContainer}>
                  <Ionicons name="location" size={14} color={Colors.textSecondary} />
                  <Text style={styles.distanceText}>
                    {selectedProfessional.distance < 1 
                      ? `${Math.round(selectedProfessional.distance * 1000)}m` 
                      : `${selectedProfessional.distance.toFixed(1)}km`
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Selección de fecha */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selecciona una fecha</Text>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: {
              selected: true,
              selectedColor: Colors.secondary,
            }
          }}
          theme={{
            selectedDayBackgroundColor: Colors.secondary,
            selectedDayTextColor: Colors.textInverse,
            todayTextColor: Colors.secondary,
            dayTextColor: Colors.textPrimary,
            textDisabledColor: Colors.textTertiary,
            arrowColor: Colors.secondary,
            monthTextColor: Colors.textPrimary,
            indicatorColor: Colors.secondary,
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13
          }}
          minDate={new Date().toISOString().split('T')[0]}
        />
      </View>

      {/* Selección de hora */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selecciona una hora</Text>
        
        {/* Selector de hora desplegable */}
        <TouchableOpacity
          style={styles.timeSelectorButton}
          onPress={showTimeSelector}
          activeOpacity={0.7}
        >
          <Ionicons name="time" size={20} color={Colors.textSecondary} />
          <Text style={styles.timeSelectorText}>
            {selectedTime || 'Seleccionar hora'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Servicio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Servicio requerido *</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe el servicio que necesitas"
          value={service}
          onChangeText={setService}
          placeholderTextColor={Colors.textTertiary}
          multiline
        />
      </View>

      {/* Notas adicionales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notas adicionales (opcional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Agrega cualquier información adicional..."
          value={notes}
          onChangeText={setNotes}
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Botón de reserva */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <>
              <Ionicons name="calendar" size={20} color={Colors.textInverse} />
              <Text style={styles.bookButtonText}>Confirmar Reserva</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal desplegable de horarios */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona un horario</Text>
              <TouchableOpacity
                onPress={() => setShowTimeModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalTimeGrid}>
                {timeSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.modalTimeSlot,
                      selectedTime === time && styles.modalTimeSlotSelected
                    ]}
                    onPress={() => selectTime(time)}
                  >
                    <Text style={[
                      styles.modalTimeSlotText,
                      selectedTime === time && styles.modalTimeSlotTextSelected
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textInverse,
  },
  placeholder: {
    width: 34,
  },
  professionalCard: {
    backgroundColor: Colors.background,
    margin: 20,
    padding: 16,
    borderRadius: 15,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  professionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  professionalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  professionalCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  professionalDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  timeSelectorButton: {
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    minHeight: 48,
    justifyContent: 'space-between',
  },
  timeSelectorText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },

  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginBottom: 100, // Aumentado para evitar que el nav lo tape
  },
  bookButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  iosTimePicker: {
    width: '100%',
    backgroundColor: Colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalTimeSlot: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  modalTimeSlotSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  modalTimeSlotText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  modalTimeSlotTextSelected: {
    color: Colors.textInverse,
  },
}); 