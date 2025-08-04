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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
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
  const params = useLocalSearchParams();
  const professional = params.selectedProfessional ? JSON.parse(params.selectedProfessional as string) : null;
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [service, setService] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Efecto para obtener horarios cuando cambia la fecha
  useEffect(() => {
    if (selectedDate) {
      // Limpiar horarios anteriores
      setAvailableSlots([]);
      setSelectedTime('');
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  // Función para obtener horarios disponibles
  const fetchAvailableSlots = async (date: string) => {
    if (!date) return;
    
    setLoadingSlots(true);
    setAvailableSlots([]); // Limpiar slots anteriores
    
    try {
      const url = `${API_BASE_URL}/api/professionals/${professional.id}/available-slots/?date=${date}`;
      console.log('🔍 Llamando a:', url);
      console.log('📅 Fecha seleccionada:', date);
      console.log('👤 ID del profesional:', professional.id);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        setAvailableSlots(data.available_slots || []);
        console.log('⏰ Horarios disponibles:', data.available_slots);
      } else {
        // Intentar leer el error como texto primero
        const errorText = await response.text();
        console.error('❌ Error response text:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Error obteniendo horarios:', errorData);
        } catch (parseError) {
          console.error('❌ Error parseando JSON:', parseError);
          console.error('📄 Respuesta completa:', errorText);
        }
        
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !service.trim()) {
      Alert.alert(
        'Campos Incompletos', 
        'Por favor completa todos los campos obligatorios:\n\n• Fecha seleccionada\n• Hora seleccionada\n• Servicio requerido',
        [
          {
            text: 'Entendido',
            style: 'default'
          }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        professional: professional.id,
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
        const responseData = await response.json();
        Alert.alert(
          '¡Reserva Exitosa! 🎉',
          `Tu turno con ${professional.name} ha sido reservado correctamente para el ${selectedDate} a las ${selectedTime}. Recibirás una confirmación por email.`,
          [
            {
              text: 'Ver mis turnos',
              onPress: () => {
                // Redirigir a la página de mis turnos
                router.push('/(tabs)/my-appointments');
              }
            },
            {
              text: 'Ir al inicio',
              onPress: () => {
                // Redirigir al home después de la reserva exitosa
                router.push('/(tabs)/home');
              }
            }
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Error al crear la reserva. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert(
        'Error de Conexión', 
        'No se pudo completar la reserva. Verifica tu conexión a internet e intenta nuevamente.',
        [
          {
            text: 'Reintentar',
            onPress: () => handleBooking()
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const showTimeSelector = () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Por favor selecciona una fecha primero');
      return;
    }
    console.log('Botón de hora presionado');
    setShowTimeModal(true);
  };

  const selectTime = (time: string) => {
    setSelectedTime(time);
    setShowTimeModal(false);
    console.log('Hora seleccionada:', time);
  };





  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ 
        paddingBottom: 150,
      }}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      nestedScrollEnabled={true}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
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
              professional.profileImage
                ? { uri: professional.profileImage.startsWith('http') 
                    ? professional.profileImage 
                    : `${API_BASE_URL}${professional.profileImage}` }
                : require('../../assets/images/icon.png')
            }
            style={styles.professionalAvatar}
            onError={(error) => {
              console.log('Error loading image for:', professional.name, error);
              // Fallback a imagen local si hay error
              return require('../../assets/images/icon.png');
            }}
            onLoad={() => console.log('Image loaded successfully for:', professional.name)}
            resizeMode="cover"
          />
          <View style={styles.professionalInfo}>
            <Text style={styles.professionalName}>{professional.name}</Text>
            <Text style={styles.professionalCategory}>{professional.category}</Text>
            <View style={styles.professionalDetails}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={Colors.warning} />
                <Text style={styles.ratingText}>{professional.rating}</Text>
              </View>
              <Text style={styles.priceText}>${professional.hourlyRate}/hora</Text>
              {professional.distance && (
                <View style={styles.distanceContainer}>
                  <Ionicons name="location" size={14} color={Colors.textSecondary} />
                  <Text style={styles.distanceText}>
                    {professional.distance < 1 
                      ? `${Math.round(professional.distance * 1000)}m` 
                      : `${professional.distance.toFixed(1)}km`
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
           style={[
             styles.timeSelectorButton,
             !selectedDate && styles.timeSelectorButtonDisabled
           ]}
           onPress={showTimeSelector}
           activeOpacity={0.7}
           disabled={!selectedDate}
         >
           <Ionicons name="time" size={20} color={Colors.textSecondary} />
           <Text style={[
             styles.timeSelectorText,
             !selectedDate && styles.timeSelectorTextDisabled
           ]}>
             {selectedTime || (selectedDate ? 'Seleccionar hora' : 'Selecciona una fecha primero')}
           </Text>
           <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
         </TouchableOpacity>
         
         {/* Indicador de estado */}
         {selectedDate && !loadingSlots && availableSlots.length === 0 && (
           <Text style={styles.noSlotsMessage}>
             No hay horarios disponibles para el {selectedDate}
           </Text>
         )}
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

      {/* Botón de confirmar reserva */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.bookButton, 
            loading && styles.bookButtonDisabled,
            // Resaltar cuando todos los campos estén completos
            selectedDate && selectedTime && service.trim() && styles.bookButtonReady
          ]}
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
        
        {/* Indicador de progreso */}
        {selectedDate && selectedTime && service.trim() && (
          <Text style={styles.readyMessage}>
            ✅ Todos los campos completos - Listo para reservar
          </Text>
        )}
      </View>
      
      {/* Botón flotante para web */}
      {Platform.OS === 'web' && selectedDate && selectedTime && service.trim() && (
        <View style={styles.floatingButton}>
          <TouchableOpacity
            style={styles.floatingButtonTouchable}
            onPress={handleBooking}
            disabled={loading}
          >
            <Ionicons name="calendar" size={24} color={Colors.textInverse} />
            <Text style={styles.floatingButtonText}>Confirmar Reserva</Text>
          </TouchableOpacity>
        </View>
      )}

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
                {loadingSlots ? (
                  <ActivityIndicator size="small" color={Colors.secondary} />
                ) : availableSlots.length === 0 ? (
                  <Text style={styles.noSlotsText}>
                    No hay horarios disponibles para esta fecha.
                  </Text>
                ) : (
                  availableSlots.map((time) => (
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
                  ))
                )}
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
  timeSelectorButtonDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.background,
  },
  timeSelectorTextDisabled: {
    color: Colors.textTertiary,
  },
  noSlotsMessage: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
    marginBottom: 300, // Aumentado significativamente para web
    paddingBottom: 20,
  },
  bookButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    // Estilos específicos para web
    ...(Platform.OS === 'web' && {
      minHeight: 60,
      fontSize: 18,
      fontWeight: 'bold',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      position: 'relative' as any,
      zIndex: 1000,
    }),
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonReady: {
    backgroundColor: Colors.secondary,
    opacity: 1,
    // Estilos específicos para web cuando está listo
    ...(Platform.OS === 'web' && {
      transform: 'scale(1.05)',
      transition: 'all 0.3s ease',
    }),
  },
  bookButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.error,
    marginTop: 12,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: Colors.error,
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
  noSlotsText: {
    fontSize: 16,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  readyMessage: {
    fontSize: 14,
    color: Colors.success,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.secondary,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButtonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
}); 