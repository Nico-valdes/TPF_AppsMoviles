import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { useLocation } from '../../hooks/useLocation';

const { width } = Dimensions.get('window');

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
  latitude?: number;
  longitude?: number;
  distance?: number;
}

const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'grid', color: Colors.primary },
  { id: 'health', name: 'Salud', icon: 'medical', color: '#FF6B6B' },
  { id: 'beauty', name: 'Belleza', icon: 'cut', color: '#FFD93D' },
  { id: 'fitness', name: 'Fitness', icon: 'fitness', color: '#6BCF7F' },
  { id: 'education', name: 'Educación', icon: 'school', color: '#4ECDC4' },
  { id: 'legal', name: 'Legal', icon: 'document-text', color: '#A8E6CF' },
  { id: 'consulting', name: 'Consultoría', icon: 'business', color: '#FF8B94' },
  { id: 'other', name: 'Otros', icon: 'ellipsis-horizontal', color: '#DDA0DD' },
];

export default function Booking() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { location, loading: locationLoading, error: locationError, calculateDistance } = useLocation();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/professionals/`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Professionals data received:', data.length, 'professionals');
        console.log('First professional profileImage:', data[0]?.professional?.profileImage);
        
        // Calcular distancias si tenemos ubicación del usuario
        if (location) {
          const professionalsWithDistance = data.map((professional: Professional) => {
            if (professional.latitude && professional.longitude) {
              const distance = calculateDistance(
                location.latitude,
                location.longitude,
                professional.latitude,
                professional.longitude
              );
              return { ...professional, distance };
            }
            return professional;
          });
          
          // Ordenar por distancia (más cercanos primero)
          professionalsWithDistance.sort((a: Professional, b: Professional) => {
            if (a.distance && b.distance) {
              return a.distance - b.distance;
            }
            return 0;
          });
          
          setProfessionals(professionalsWithDistance);
          setFilteredProfessionals(professionalsWithDistance);
        } else {
          setProfessionals(data);
          setFilteredProfessionals(data);
        }
      } else {
        console.error('Error fetching professionals:', response.status);
      }
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfessionals();
    setRefreshing(false);
  };

  const filterProfessionals = () => {
    let filtered = professionals;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.professional.name.toLowerCase().includes(query) ||
        p.category_display.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    setFilteredProfessionals(filtered);
  };

  const handleProfessionalPress = (professional: Professional) => {
    (navigation as any).navigate('booking-details', { 
      selectedProfessional: {
        id: professional.professional.id,
        name: professional.professional.name,
        category: professional.category_display,
        rating: professional.rating,
        hourlyRate: professional.hourly_rate,
        profileImage: professional.professional.profileImage,
        distance: professional.distance,
      }
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={12} color={Colors.warning} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={12} color={Colors.warning} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={12} color={Colors.border} />);
      }
    }
    return stars;
  };

  const renderCategoryItem = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemSelected
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Ionicons 
        name={item.icon as any} 
        size={20} 
        color={selectedCategory === item.id ? Colors.textInverse : item.color} 
      />
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextSelected
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProfessionalItem = ({ item }: { item: Professional }) => (
    <TouchableOpacity
      style={styles.professionalCard}
      onPress={() => handleProfessionalPress(item)}
    >
      <View style={styles.professionalHeader}>
        <Image
          source={
            item.professional.profileImage
              ? { uri: item.professional.profileImage.startsWith('http') 
                  ? item.professional.profileImage 
                  : `${API_BASE_URL}${item.professional.profileImage}` }
              : require('../../assets/images/icon.png')
          }
          style={styles.professionalAvatar}
          onError={(error) => {
            console.log('Error loading image for:', item.professional.name, error);
            // Fallback a imagen local si hay error
            return require('../../assets/images/icon.png');
          }}
          onLoad={() => console.log('Image loaded successfully for:', item.professional.name)}
          resizeMode="cover"
        />
        <View style={styles.professionalInfo}>
          <View style={styles.professionalNameRow}>
            <Text style={styles.professionalName} numberOfLines={1}>
              {item.professional.name}
            </Text>
            {item.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            )}
          </View>
          <Text style={styles.professionalCategory}>
            {item.category_display}
          </Text>
          <View style={styles.ratingContainer}>
            {renderStars(item.rating)}
            <Text style={styles.ratingText}>
              {item.rating} ({item.total_reviews})
            </Text>
          </View>
        </View>
        <View style={styles.professionalActions}>
          {item.distance && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={14} color={Colors.textSecondary} />
              <Text style={styles.distanceText}>
                {item.distance < 1 
                  ? `${Math.round(item.distance * 1000)}m` 
                  : `${item.distance.toFixed(1)}km`
                }
              </Text>
            </View>
          )}
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>${item.hourly_rate}</Text>
            <Text style={styles.priceLabel}>/hora</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.professionalDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <TouchableOpacity 
        style={styles.bookButton}
        onPress={() => handleProfessionalPress(item)}
      >
        <Ionicons name="calendar" size={16} color={Colors.textInverse} />
        <Text style={styles.bookButtonText}>Reservar</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchProfessionals();
  }, [location]);

  useEffect(() => {
    filterProfessionals();
  }, [professionals, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Cargando profesionales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Reservar Turno</Text>
          <Text style={styles.headerSubtitle}>
            Encuentra los mejores profesionales cerca de ti
          </Text>
          
          {/* Estado de ubicación */}
          {locationLoading && (
            <View style={styles.locationStatus}>
              <ActivityIndicator size="small" color={Colors.textInverse} />
              <Text style={styles.locationStatusText}>Obteniendo ubicación...</Text>
            </View>
          )}
          
          {locationError && (
            <View style={styles.locationStatus}>
              <Ionicons name="close-circle" size={16} color={Colors.error} />
              <Text style={styles.locationStatusText}>{locationError}</Text>
            </View>
          )}
          
          {location && (
            <View style={styles.locationStatus}>
              <Ionicons name="location" size={16} color={Colors.success} />
              <Text style={styles.locationStatusText}>Ubicación activa</Text>
            </View>
          )}
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Buscar profesionales..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
      </View>

      {/* Categorías deslizables */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Lista de profesionales */}
      <View style={styles.professionalsContainer}>
        <View style={styles.professionalsHeader}>
          <Text style={styles.professionalsTitle}>
            {filteredProfessionals.length > 0 
              ? `${filteredProfessionals.length} profesional${filteredProfessionals.length !== 1 ? 'es' : ''} encontrado${filteredProfessionals.length !== 1 ? 's' : ''}`
              : 'No se encontraron profesionales'
            }
          </Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredProfessionals}
          renderItem={renderProfessionalItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.professionalsList}
        />
      </View>
    </View>
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
    marginTop: 10,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textInverse,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textInverse,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 15,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationStatusText: {
    fontSize: 12,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 10,
    color: Colors.textPrimary,
  },
  categoriesContainer: {
    paddingVertical: 10,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  professionalsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  professionalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  professionalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  refreshButton: {
    padding: 5,
  },
  professionalsList: {
    paddingBottom: 120, // Aumentado para evitar que el nav tape los botones
  },
  professionalCard: {
    backgroundColor: Colors.background,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  professionalHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  professionalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  professionalCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginLeft: 4,
  },
  professionalActions: {
    alignItems: 'flex-end',
    gap: 8,
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
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  professionalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  bookButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookButtonText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
}); 