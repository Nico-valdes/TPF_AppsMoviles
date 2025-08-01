import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';

// URL de tu API de Django (ajusta si es necesario)
// Recuerda usar la IP correcta para tu emulador/dispositivo
const API_URL = 'http://10.0.2.2:8000/api'; 

const daysOfWeek = [
  { label: 'Lunes', value: 0 },
  { label: 'Martes', value: 1 },
  { label: 'Miércoles', value: 2 },
  { label: 'Jueves', value: 3 },
  { label: 'Viernes', value: 4 },
  { label: 'Sábado', value: 5 },
  { label: 'Domingo', value: 6 },
];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { label: `${hour}:00`, value: `${hour}:00:00` };
});

export default function BecomeProfessionalForm() {
  const navigation = useNavigation();
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [businessType, setBusinessType] = useState('');
  
  // Estado para el horario
  const [schedules, setSchedules] = useState([{ day_week: 0, start_time: '09:00:00', end_time: '17:00:00' }]);

  const addSchedule = () => {
    setSchedules([...schedules, { day_week: 0, start_time: '09:00:00', end_time: '17:00:00' }]);
  };

  const updateSchedule = (index, field, value) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const removeSchedule = (index) => {
    const newSchedules = schedules.filter((_, i) => i !== index);
    setSchedules(newSchedules);
  };

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      Alert.alert('Error', 'No se encontró el token de acceso.');
      return;
    }

    try {
      // 1. Enviar los datos del ProfessionalDetail y el cambio de rol
      const professionalData = {
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        business_type: businessType,
        schedules: schedules,
      };

      const res = await fetch(`${API_URL}/users/become-professional/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(professionalData),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('Éxito', '¡Ahora eres un profesional! Redirigiendo a tu perfil...');
        // Redirige al usuario al perfil actualizado o a la página principal.
        navigation.navigate('Perfil');
      } else {
        Alert.alert('Error', data.detail || JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Completa tu perfil de profesional</Text>

      {/* Formulario para ProfessionalDetail */}
      <Text style={styles.label}>Tipo de Negocio</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Peluquería, Consultorio Odontológico"
        value={businessType}
        onChangeText={setBusinessType}
      />
      
      <Text style={styles.label}>Dirección</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Av. Siempreviva 742"
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.label}>Latitud</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 34.6037"
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Longitud</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: -58.3816"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
      />

      <Text style={styles.sectionTitle}>Horario de Atención</Text>
      {schedules.map((schedule, index) => (
        <View key={index} style={styles.scheduleRow}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Día</Text>
            <Picker
              selectedValue={schedule.day_week}
              onValueChange={(itemValue) => updateSchedule(index, 'day_week', itemValue)}
              style={styles.picker}
            >
              {daysOfWeek.map((day) => (
                <Picker.Item key={day.value} label={day.label} value={day.value} />
              ))}
            </Picker>
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Desde</Text>
            <Picker
              selectedValue={schedule.start_time}
              onValueChange={(itemValue) => updateSchedule(index, 'start_time', itemValue)}
              style={styles.picker}
            >
              {timeSlots.map((time) => (
                <Picker.Item key={time.value} label={time.label} value={time.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Hasta</Text>
            <Picker
              selectedValue={schedule.end_time}
              onValueChange={(itemValue) => updateSchedule(index, 'end_time', itemValue)}
              style={styles.picker}
            >
              {timeSlots.map((time) => (
                <Picker.Item key={time.value} label={time.label} value={time.value} />
              ))}
            </Picker>
          </View>

          {schedules.length > 1 && (
            <TouchableOpacity onPress={() => removeSchedule(index)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addSchedule}>
        <Text style={styles.addButtonText}>+ Añadir otro horario</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Convertirme en Profesional</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#343a40',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#495057',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#495057',
  },
  input: {
    height: 40,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
  },
  pickerLabel: {
    position: 'absolute',
    top: -10,
    left: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    fontSize: 12,
    color: '#6c757d',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  removeButton: {
    marginLeft: 10,
    backgroundColor: '#dc3545',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});