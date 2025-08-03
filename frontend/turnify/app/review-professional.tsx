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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { API_BASE_URL } from '../constants/Config';
import { Colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';

interface Appointment {
  id: number;
  professional_name: string;
  professional_id: number;
  date: string;
}

export default function ReviewProfessional() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const appointment = params.appointment ? JSON.parse(params.appointment as string) : null;
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!appointment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleStarPress = (starIndex: number) => {
    setRating(starIndex + 1);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert(
        'Calificación Requerida',
        'Por favor selecciona una calificación antes de enviar la reseña.',
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
      // Simulación de envío de reseña - en producción esto debería llamar al endpoint correcto
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay de red
      
      Alert.alert(
        '¡Reseña Enviada! ⭐',
        'Tu reseña ha sido enviada exitosamente. Gracias por compartir tu experiencia.',
        [
          {
            text: 'OK',
            onPress: () => {
              (navigation as any).navigate('home');
            }
          }
        ]
      );
      
      // En producción, aquí harías la llamada real al API:
      /*
      const response = await fetch(`${API_BASE_URL}/api/reviews/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          appointment_id: appointment.id,
          professional_id: appointment.professional_id,
          rating: rating,
          comment: comment.trim(),
        }),
      });

      if (response.ok) {
        // Mostrar alerta de éxito
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Error al enviar la reseña.');
      }
      */
      
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Error de Conexión',
        'No se pudo enviar la reseña. Verifica tu conexión a internet e intenta nuevamente.',
        [
          {
            text: 'Reintentar',
            onPress: () => handleSubmitReview()
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

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i < rating ? "star" : "star-outline"}
            size={32}
            color={i < rating ? Colors.warning : Colors.border}
          />
        </TouchableOpacity>
      );
    }
    return stars;
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
        <Text style={styles.headerTitle}>Dejar Reseña</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Información del turno */}
      <View style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <Ionicons name="person" size={24} color={Colors.secondary} />
          <View style={styles.appointmentInfo}>
            <Text style={styles.professionalName}>{appointment.professional_name}</Text>
            <Text style={styles.appointmentDate}>{formatDate(appointment.date)}</Text>
          </View>
        </View>
      </View>

      {/* Calificación */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Cómo calificarías tu experiencia?</Text>
        <Text style={styles.sectionSubtitle}>
          Selecciona de 1 a 5 estrellas
        </Text>
        
        <View style={styles.starsContainer}>
          {renderStars()}
        </View>
        
        {rating > 0 && (
          <Text style={styles.ratingText}>
            {rating === 1 ? 'Muy malo' : 
             rating === 2 ? 'Malo' : 
             rating === 3 ? 'Regular' : 
             rating === 4 ? 'Bueno' : 'Excelente'}
          </Text>
        )}
      </View>

      {/* Comentario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comentario (opcional)</Text>
        <Text style={styles.sectionSubtitle}>
          Comparte detalles sobre tu experiencia
        </Text>
        
        <TextInput
          style={styles.commentInput}
          placeholder="Describe tu experiencia con el profesional..."
          value={comment}
          onChangeText={setComment}
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={6}
          maxLength={500}
        />
        
        <Text style={styles.characterCount}>
          {comment.length}/500 caracteres
        </Text>
      </View>

      {/* Botón de enviar */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmitReview}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={Colors.textInverse} />
              <Text style={styles.submitButtonText}>Enviar Reseña</Text>
            </>
          )}
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
    alignItems: 'center',
    gap: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warning,
    textAlign: 'center',
  },
  commentInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 8,
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginBottom: 100,
  },
  submitButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
}); 