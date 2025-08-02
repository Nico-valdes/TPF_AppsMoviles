import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { Colors } from '../../constants/Colors';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, loading } = useAuth();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
    const success = await signIn(email, password);
    if (success) {
      router.replace('/home');  // ⬅ Redirige al Home
    } else {
      setError('Email o contraseña incorrectos.');
    }
    } catch (error) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Turnify</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email} 
        onChangeText={setEmail}
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#888"
        value={password} 
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity disabled={isLoading}>
        <Text style={[styles.forgotText, isLoading && styles.disabledText]}>
          Recuperar contraseña
        </Text>
      </TouchableOpacity>
      
      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>No tienes una cuenta? </Text>
        <TouchableOpacity 
          onPress={() => router.push('/(auth)/register')}
          disabled={isLoading}
        >
          <Text style={[styles.registerLink, isLoading && styles.disabledText]}>
            Registrate
          </Text>
        </TouchableOpacity>
      </View>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.textInverse,
    marginBottom: 48,
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
  buttonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  buttonText: {
    color: Colors.textInverse,
    fontWeight: 'bold',
    fontSize: 18,
  },
  forgotText: {
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: 32,
    textDecorationLine: 'underline',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 32,
  },
  registerText: {
    color: Colors.textInverse,
    fontSize: 16,
  },
  registerLink: {
    color: Colors.textInverse,
    fontWeight: 'bold',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  disabledText: {
    opacity: 0.5,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});