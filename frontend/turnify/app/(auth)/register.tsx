import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { API_BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/Colors';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('regular');
  const [error, setError] = useState('');

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
    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
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
            onPress={() => setRole('regular')}
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
            onPress={() => setRole('professional')}
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
});