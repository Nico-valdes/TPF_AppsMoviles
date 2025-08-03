import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';

interface ProfessionalSettings {
  category: string;
  address: string;
  description: string;
  hourly_rate: number;
  is_verified: boolean;
  latitude?: number;
  longitude?: number;
}

export default function ProfessionalSettings() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [settings, setSettings] = useState<ProfessionalSettings>({
    category: '',
    address: '',
    description: '',
    hourly_rate: 0,
    is_verified: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = [
    { id: 'health', name: 'Salud', icon: 'medical' },
    { id: 'beauty', name: 'Belleza', icon: 'cut' },
    { id: 'fitness', name: 'Fitness', icon: 'fitness' },
    { id: 'education', name: 'Educación', icon: 'school' },
    { id: 'legal', name: 'Legal', icon: 'document-text' },
    { id: 'consulting', name: 'Consultoría', icon: 'business' },
    { id: 'other', name: 'Otros', icon: 'ellipsis-horizontal' },
  ];

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/professionals/profile/`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.error('Error fetching settings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings.category || !settings.address || !settings.description || settings.hourly_rate <= 0) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/professionals/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Configuración guardada correctamente');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Información del profesional */}
      <View style={styles.profileSection}>
        <Image
          source={
            user?.profileImage
              ? { uri: `${API_BASE_URL}${user.profileImage}` }
              : require('../../assets/images/icon.png')
          }
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      {/* Categoría */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categoría *</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                settings.category === category.id && styles.categoryItemSelected
              ]}
              onPress={() => setSettings({ ...settings, category: category.id })}
            >
              <Ionicons 
                name={category.icon as any} 
                size={20} 
                color={settings.category === category.id ? Colors.textInverse : Colors.textSecondary} 
              />
              <Text style={[
                styles.categoryText,
                settings.category === category.id && styles.categoryTextSelected
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dirección */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dirección *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa tu dirección de trabajo"
          value={settings.address}
          onChangeText={(text) => setSettings({ ...settings, address: text })}
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe tus servicios y experiencia..."
          value={settings.description}
          onChangeText={(text) => setSettings({ ...settings, description: text })}
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Tarifa por hora */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tarifa por hora *</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          value={settings.hourly_rate.toString()}
          onChangeText={(text) => setSettings({ ...settings, hourly_rate: parseFloat(text) || 0 })}
          placeholderTextColor={Colors.textTertiary}
          keyboardType="numeric"
        />
      </View>

      {/* Verificación */}
      <View style={styles.section}>
        <View style={styles.verificationRow}>
          <View style={styles.verificationInfo}>
            <Text style={styles.sectionTitle}>Cuenta verificada</Text>
            <Text style={styles.verificationText}>
              {settings.is_verified ? 'Tu cuenta está verificada' : 'Tu cuenta está pendiente de verificación'}
            </Text>
          </View>
          <Switch
            value={settings.is_verified}
            onValueChange={(value) => setSettings({ ...settings, is_verified: value })}
            trackColor={{ false: Colors.border, true: Colors.secondary }}
            thumbColor={Colors.textInverse}
            disabled={true}
          />
        </View>
      </View>

      {/* Botón de guardar */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveSettings}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 100,
  },
  categoryItemSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: Colors.textInverse,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verificationInfo: {
    flex: 1,
  },
  verificationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  saveButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
}); 