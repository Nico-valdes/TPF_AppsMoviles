import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { API_BASE_URL } from '../constants/Config';
import { Colors } from '../constants/Colors';
import { useLocalSearchParams, router } from 'expo-router';
import { Calendar } from 'react-native-calendars';

interface Appointment {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  regular_name?: string;
  professional_name?: string;
  service?: string;
  notes?: string;
}



export default function AppointmentDetails() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const appointment = params.appointment ? JSON.parse(params.appointment as string) : null;
  
  // Hooks deben estar al principio, antes de cualquier return
  const [selectedDate, setSelectedDate] = useState(appointment?.date || '');
  const [selectedTime, setSelectedTime] = useState(appointment?.start_time || '');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [service, setService] = useState(appointment?.service || '');
  const [notes, setNotes] = useState(appointment?.notes || '');

  const [cancelling, setCancelling] = useState(false);
  const [saving, setSaving] = useState(false);
  
  console.log('AppointmentDetails mounted with appointment:', appointment);
  
  if (!appointment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se pudo cargar la información del turno</Text>
        </View>
      </View>
    );
  }

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

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
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'confirmed':
        return Colors.secondary;
      case 'completed':
        return Colors.success;
      case 'cancelled':
        return Colors.error;
      case 'no_show':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      case 'no_show':
        return 'No se presentó';
      default:
        return status;
    }
  };

  const handleSaveChanges = async () => {
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

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointment.id}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          start_time: selectedTime,
          service: service.trim(),
          notes: notes.trim(),
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Cambios Guardados ✅',
          'Tu turno ha sido actualizado exitosamente.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.push('/(tabs)/home');
              }
            }
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Error al actualizar el turno.');
      }
      
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert(
        'Error de Conexión',
        'No se pudo actualizar el turno. Verifica tu conexión a internet e intenta nuevamente.',
        [
          {
            text: 'Reintentar',
            onPress: () => handleSaveChanges()
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAppointment = async () => {
    Alert.alert(
      'Cancelar Turno',
      '¿Estás seguro de que quieres cancelar este turno? Esta acción no se puede deshacer.',
      [
        {
          text: 'No, mantener',
          style: 'cancel'
        },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const response = await fetch(`${API_BASE_URL}/api/appointments/${appointment.id}/cancel/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user?.token}`,
                },
              });

              if (response.ok) {
                Alert.alert(
                  'Turno Cancelado ✅',
                  'Tu turno ha sido cancelado exitosamente. Se ha enviado una notificación al profesional.',
                  [
                    {
                      text: 'Ir al inicio',
                      onPress: () => {
                        router.push('/(tabs)/home');
                      }
                    }
                  ]
                );
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.error || 'Error al cancelar el turno.');
              }
              
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert(
                'Error de Conexión',
                'No se pudo cancelar el turno. Verifica tu conexión a internet e intenta nuevamente.',
                [
                  {
                    text: 'Reintentar',
                    onPress: () => handleCancelAppointment()
                  },
                  {
                    text: 'Cancelar',
                    style: 'cancel'
                  }
                ]
              );
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const showTimeSelector = () => {
    setShowTimeModal(true);
  };

  const selectTime = (time: string) => {
    setSelectedTime(time);
    setShowTimeModal(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Turno</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Información del turno */}
      <View style={styles.appointmentCard}>
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

      {/* Selección de fecha */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cambiar fecha</Text>
        <Calendar
          onDayPress={(day) => {
            if (appointment.status !== 'cancelled' && appointment.status !== 'completed') {
              setSelectedDate(day.dateString);
            }
          }}
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
            dayTextColor: appointment.status === 'cancelled' || appointment.status === 'completed' ? Colors.textTertiary : Colors.textPrimary,
            textDisabledColor: Colors.textTertiary,
            arrowColor: appointment.status === 'cancelled' || appointment.status === 'completed' ? Colors.textTertiary : Colors.secondary,
            monthTextColor: appointment.status === 'cancelled' || appointment.status === 'completed' ? Colors.textTertiary : Colors.textPrimary,
            indicatorColor: appointment.status === 'cancelled' || appointment.status === 'completed' ? Colors.textTertiary : Colors.secondary,
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
        <Text style={styles.sectionTitle}>Cambiar hora</Text>
        
        <TouchableOpacity
          style={[
            styles.timeSelectorButton,
            (appointment.status === 'cancelled' || appointment.status === 'completed') && styles.timeSelectorButtonDisabled
          ]}
          onPress={showTimeSelector}
          activeOpacity={0.7}
          disabled={appointment.status === 'cancelled' || appointment.status === 'completed'}
        >
          <Ionicons name="time" size={20} color={Colors.textSecondary} />
          <Text style={[
            styles.timeSelectorText,
            (appointment.status === 'cancelled' || appointment.status === 'completed') && styles.timeSelectorTextDisabled
          ]}>
            {selectedTime || 'Seleccionar hora'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Servicio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Servicio requerido *</Text>
        <TextInput
          style={[
            styles.input,
            (appointment.status === 'cancelled' || appointment.status === 'completed') && styles.inputDisabled
          ]}
          placeholder="Describe el servicio que necesitas"
          value={service}
          onChangeText={setService}
          placeholderTextColor={Colors.textTertiary}
          multiline
          editable={appointment.status !== 'cancelled' && appointment.status !== 'completed'}
        />
      </View>

      {/* Notas adicionales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notas adicionales (opcional)</Text>
        <TextInput
          style={[
            styles.input, 
            styles.notesInput,
            (appointment.status === 'cancelled' || appointment.status === 'completed') && styles.inputDisabled
          ]}
          placeholder="Agrega cualquier información adicional..."
          value={notes}
          onChangeText={setNotes}
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={4}
          editable={appointment.status !== 'cancelled' && appointment.status !== 'completed'}
        />
      </View>

      {/* Botones de acción */}
      <View style={styles.buttonContainer}>
        {/* Solo mostrar botón de guardar si el turno no está cancelado o completado */}
        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveChanges}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <>
                <Ionicons name="save" size={20} color={Colors.textInverse} />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {/* Solo mostrar botón de cancelar si el turno no está cancelado o completado */}
        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
          <TouchableOpacity
            style={[styles.cancelButton, cancelling && styles.cancelButtonDisabled]}
            onPress={handleCancelAppointment}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color={Colors.error} />
                <Text style={styles.cancelButtonText}>Cancelar Turno</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {/* Mostrar mensaje si el turno está cancelado o completado */}
        {(appointment.status === 'cancelled' || appointment.status === 'completed') && (
          <View style={styles.statusMessageContainer}>
            <Ionicons 
              name={appointment.status === 'cancelled' ? 'close-circle' : 'checkmark-circle'} 
              size={24} 
              color={appointment.status === 'cancelled' ? Colors.error : Colors.success} 
            />
            <Text style={[
              styles.statusMessageText,
              { color: appointment.status === 'cancelled' ? Colors.error : Colors.success }
            ]}>
              {appointment.status === 'cancelled' ? 'Turno Cancelado' : 'Turno Completado'}
            </Text>
          </View>
        )}
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
  appointmentCard: {
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: { 
    fontSize: 14, 
    color: Colors.textInverse,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.background,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginBottom: 100,
  },
  saveButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  statusMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  statusMessageText: {
    fontSize: 16,
    fontWeight: '600',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
}); 