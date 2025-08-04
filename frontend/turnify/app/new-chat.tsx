import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';
import { apiRequest, showApiError } from '../utils/api';

interface Professional {
  id: number;
  professional: {
    id: number;
    name: string;
    email: string;
    profileImage?: string;
  };
  category: string;
  category_display: string;
  address: string;
  description: string;
  hourly_rate: number;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
}

export default function NewChatScreen() {
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingChat, setCreatingChat] = useState<number | null>(null);

  const fetchProfessionals = async () => {
    try {
      const result = await apiRequest<Professional[]>('/api/professionals/', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (result.error) {
        showApiError(result.error, 'Error al cargar profesionales');
        return;
      }

      setProfessionals(result.data || []);
      setFilteredProfessionals(result.data || []);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = professionals.filter(prof =>
        prof.professional.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prof.category_display.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProfessionals(filtered);
    } else {
      setFilteredProfessionals(professionals);
    }
  }, [searchQuery, professionals]);

  const createChat = async (professionalId: number) => {
    setCreatingChat(professionalId);
    try {
      console.log('Creating chat with professional ID:', professionalId);
      const result = await apiRequest('/api/chat/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: professionalId,
        }),
      });

      console.log('Chat creation result:', result);

      if (result.error) {
        showApiError(result.error, 'Error al crear chat');
        return;
      }

      console.log('Result data:', result.data);
      console.log('Result data type:', typeof result.data);
      console.log('Result data keys:', result.data ? Object.keys(result.data) : 'null');

      // Navegar al chat creado
      if (result.data && typeof result.data === 'object' && 'room' in result.data) {
        const roomData = (result.data as any).room;
        const roomId = roomData?.id;
        console.log('Navigating to chat room:', roomId);
        if (roomId) {
          router.push({
            pathname: '/chat/[id]',
            params: { id: roomId.toString() }
          });
        }
      } else {
        console.log('No room data found in result');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setCreatingChat(null);
    }
  };

  const renderProfessional = ({ item }: { item: Professional }) => {
    console.log('Professional item:', item);
    if (!item || !item.professional) {
      return null;
    }
    const isCreating = creatingChat === item.professional.id;
    
    return (
      <TouchableOpacity
        style={styles.professionalItem}
        onPress={() => createChat(item.professional.id)}
        disabled={isCreating}
      >
        <View style={styles.avatarContainer}>
          {item.professional.profileImage ? (
            <Image
              source={{ uri: item.professional.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#666" />
            </View>
          )}
        </View>

        <View style={styles.professionalInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.professionalName}>
              {item.professional.name || 'Sin nombre'}
            </Text>
            {item.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color="#34eb89" />
            )}
          </View>
          
          <Text style={styles.category}>{item.category_display || 'Sin categoría'}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description || 'Sin descripción'}
          </Text>
          
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#ffd700" />
            <Text style={styles.rating}>
              {item.rating && typeof item.rating === 'number' ? item.rating.toFixed(1) : '0.0'} ({item.total_reviews || 0} reseñas)
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          {isCreating ? (
            <ActivityIndicator size="small" color="#34eb89" />
          ) : (
            <Ionicons name="chatbubble-outline" size={24} color="#34eb89" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34eb89" />
        <Text style={styles.loadingText}>Cargando profesionales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo Chat</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar profesionales..."
          placeholderTextColor="#666"
        />
      </View>

      {/* Professionals List */}
      {filteredProfessionals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No se encontraron profesionales' : 'No hay profesionales disponibles'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Intenta con otra búsqueda' : 'Vuelve más tarde'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProfessionals}
          renderItem={renderProfessional}
          keyExtractor={(item) => item.id.toString()}
          style={styles.professionalsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1c1c1c',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  professionalsList: {
    flex: 1,
  },
  professionalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  professionalInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 5,
  },
  category: {
    fontSize: 14,
    color: '#34eb89',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  actionContainer: {
    marginLeft: 15,
  },
}); 