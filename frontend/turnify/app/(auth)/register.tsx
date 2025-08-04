import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import * as Location from 'expo-location';
import { API_BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/Colors';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('regular');
  const [error, setError] = useState('');
  
  // Campos adicionales para profesionales
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{latitude: number, longitude: number, address: string} | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showProfessionalFields, setShowProfessionalFields] = useState(false);

  // Categorías disponibles para profesionales
  const categories = [
    { value: 'health', label: 'Salud' },
    { value: 'beauty', label: 'Belleza' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'education', label: 'Educación' },
    { value: 'legal', label: 'Legal' },
    { value: 'consulting', label: 'Consultoría' },
    { value: 'other', label: 'Otros' },
  ];

  // Función para obtener la ubicación
  const getLocation = async () => {
    setIsLoadingLocation(true);
    try {
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu ubicación para registrarte como profesional.'
        );
        setIsLoadingLocation(false);
        return;
      }

      // Obtener ubicación actual
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Obtener dirección a partir de las coordenadas
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const address = reverseGeocode[0] 
        ? `${reverseGeocode[0].street || ''} ${reverseGeocode[0].streetNumber || ''}, ${reverseGeocode[0].city || ''}, ${reverseGeocode[0].region || ''}`
        : 'Ubicación actual';

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: address.trim(),
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Por favor, intenta de nuevo.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Función para manejar el cambio de rol
  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    if (newRole === 'professional') {
      setShowProfessionalFields(true);
      // Solicitar ubicación automáticamente cuando se selecciona profesional
      getLocation();
    } else {
      setShowProfessionalFields(false);
      setLocation(null);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password || !confirmPassword || !role) {
      setError('Por favor, rellena todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    // Validaciones adicionales para profesionales
    if (role === 'professional') {
      if (!category || !description || !location) {
        setError('Para registrarse como profesional, debe completar todos los campos adicionales.');
        return;
      }
    }

    try {
      const requestBody = {
        name,
        email,
        password,
        role,
        ...(role === 'professional' && {
          category,
          description,
          latitude: location?.latitude,
          longitude: location?.longitude,
          address: location?.address,
        }),
      };

      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (response.ok) {
        router.replace('/(auth)/login');
      } else {
        setError(data.error || 'Error al registrarse');
      }
    } catch (err) {
      setError('Error de red');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Turnify</Text>
      <Text style={styles.subtitle}>Únete a la comunidad</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        placeholderTextColor="#888"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* Selección de Rol */}
      <View style={styles.roleSection}>
        <Text style={styles.roleTitle}>¿Cómo quieres usar Turnify?</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleCard, role === 'regular' && styles.roleCardSelected]}
            onPress={() => handleRoleChange('regular')}
          >
            <Ionicons 
              name="person" 
              size={32} 
              color={role === 'regular' ? Colors.textInverse : Colors.secondary} 
            />
            <Text style={[styles.roleText, role === 'regular' && styles.roleTextSelected]}>
              Soy Cliente
            </Text>
            <Text style={[styles.roleDescription, role === 'regular' && styles.roleDescriptionSelected]}>
              Quiero reservar turnos con profesionales
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, role === 'professional' && styles.roleCardSelected]}
            onPress={() => handleRoleChange('professional')}
          >
            <Ionicons 
              name="briefcase" 
              size={32} 
              color={role === 'professional' ? Colors.textInverse : Colors.secondary} 
            />
            <Text style={[styles.roleText, role === 'professional' && styles.roleTextSelected]}>
              Soy Profesional
            </Text>
            <Text style={[styles.roleDescription, role === 'professional' && styles.roleDescriptionSelected]}>
              Quiero ofrecer mis servicios
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Campos adicionales para profesionales */}
      {showProfessionalFields && (
        <View style={styles.professionalFields}>
          <Text style={styles.sectionTitle}>Información Profesional</Text>
          
          {/* Categoría */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Categoría</Text>
            <View style={styles.pickerContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryOption, category === cat.value && styles.categoryOptionSelected]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={[styles.categoryText, category === cat.value && styles.categoryTextSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Descripción */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Descripción de tus servicios</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe los servicios que ofreces..."
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Ubicación */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Ubicación</Text>
            <TouchableOpacity 
              style={styles.locationButton} 
              onPress={getLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator color={Colors.textInverse} size="small" />
              ) : (
                <Ionicons name="location" size={20} color={Colors.textInverse} />
              )}
              <Text style={styles.locationButtonText}>
                {isLoadingLocation ? 'Obteniendo ubicación...' : 'Obtener mi ubicación'}
              </Text>
            </TouchableOpacity>
            
            {location && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>{location.address}</Text>
                <Text style={styles.coordinatesText}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Crear cuenta</Text>
      </TouchableOpacity>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.loginLink}>Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.textInverse,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textInverse,
    opacity: 0.8,
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleSection: {
    width: '100%',
    marginBottom: 24,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textInverse,
    marginBottom: 16,
    textAlign: 'center',
  },
  roleContainer: {
    gap: 12,
  },
  roleCard: {
    backgroundColor: Colors.overlayLight,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.textInverse,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 8,
    marginBottom: 4,
  },
  roleTextSelected: {
    color: Colors.textInverse,
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.textInverse,
    opacity: 0.8,
    textAlign: 'center',
  },
  roleDescriptionSelected: {
    opacity: 1,
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: Colors.textInverse,
    fontWeight: 'bold',
    fontSize: 18,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  loginLink: {
    color: Colors.secondary,
    fontWeight: 'bold',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    color: Colors.textInverse,
    fontSize: 16,
  },
  // Estilos para campos profesionales
  professionalFields: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textInverse,
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textInverse,
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    backgroundColor: Colors.overlayLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.textInverse,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.textInverse,
  },
  categoryTextSelected: {
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  locationButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    backgroundColor: Colors.overlayLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  locationText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  coordinatesText: {
    color: Colors.textInverse,
    fontSize: 12,
    opacity: 0.7,
  },
});