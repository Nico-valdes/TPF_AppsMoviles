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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';

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

const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'grid' },
  { id: 'health', name: 'Salud', icon: 'medical' },
  { id: 'beauty', name: 'Belleza', icon: 'cut' },
  { id: 'fitness', name: 'Fitness', icon: 'fitness' },
  { id: 'education', name: 'Educación', icon: 'school' },
  { id: 'legal', name: 'Legal', icon: 'document-text' },
  { id: 'consulting', name: 'Consultoría', icon: 'business' },
  { id: 'other', name: 'Otros', icon: 'ellipsis-horizontal' },
];

export default function Professionals() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchProfessionals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/professionals/`);
      if (response.ok) {
        const data = await response.json();
        setProfessionals(data);
        setFilteredProfessionals(data);
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
    Alert.alert(
      'Reservar Turno',
      `¿Quieres reservar un turno con ${professional.professional.name}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Reservar',
          onPress: () => {
            // Navegar a la pantalla de booking con el profesional seleccionado
            (navigation as any).navigate('booking', { 
              selectedProfessional: {
                id: professional.professional.id,
                name: professional.professional.name,
                category: professional.category_display,
                rating: professional.rating,
                hourlyRate: professional.hourly_rate,
                profileImage: professional.professional.profileImage,
              }
            });
          },
        },
      ]
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={14} color={Colors.warning} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={14} color={Colors.warning} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={14} color={Colors.border} />);
      }
    }
    return stars;
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    filterProfessionals();
  }, [professionals, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Cargando profesionales...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Profesionales</Text>
        <Text style={styles.subtitle}>
          Encuentra el profesional perfecto para ti
        </Text>
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

      {/* Categorías */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoryTitle}>Categorías</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={
                  selectedCategory === category.id
                    ? Colors.textInverse
                    : Colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextSelected,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de Profesionales */}
      <View style={styles.professionalsContainer}>
        <Text style={styles.sectionTitle}>
          {filteredProfessionals.length > 0 
            ? `${filteredProfessionals.length} profesional${filteredProfessionals.length !== 1 ? 'es' : ''} encontrado${filteredProfessionals.length !== 1 ? 's' : ''}`
            : 'No se encontraron profesionales'
          }
        </Text>

        {filteredProfessionals.map((professional) => (
          <TouchableOpacity
            key={professional.id}
            style={styles.professionalCard}
            onPress={() => handleProfessionalPress(professional)}
          >
            <View style={styles.professionalHeader}>
              <View style={styles.professionalInfo}>
                <Image
                  source={
                    professional.professional.profileImage
                      ? { uri: `${API_BASE_URL}${professional.professional.profileImage}` }
                      : require('../../assets/images/icon.png')
                  }
                  style={styles.professionalAvatar}
                />
                <View style={styles.professionalDetails}>
                  <Text style={styles.professionalName}>
                    {professional.professional.name}
                  </Text>
                  <Text style={styles.professionalCategory}>
                    {professional.category_display}
                  </Text>
                  <View style={styles.ratingContainer}>
                    {renderStars(professional.rating)}
                    <Text style={styles.ratingText}>
                      {professional.rating} ({professional.total_reviews} reseñas)
                    </Text>
                  </View>
                </View>
              </View>
              {professional.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                </View>
              )}
            </View>
            
            <Text style={styles.professionalDescription} numberOfLines={2}>
              {professional.description}
            </Text>
            
            <View style={styles.professionalFooter}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>${professional.hourly_rate}</Text>
                <Text style={styles.priceLabel}>/hora</Text>
              </View>
              <TouchableOpacity 
                style={styles.bookButton}
                onPress={() => handleProfessionalPress(professional)}
              >
                <Text style={styles.bookButtonText}>Reservar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: 100,
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
  headerContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textInverse,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textInverse,
    opacity: 0.8,
    marginBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.overlayLight,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 10,
    color: Colors.textPrimary,
  },
  searchIcon: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 15,
  },
  categoryChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: Colors.textInverse,
  },
  categoryIcon: {
    fontSize: 16,
  },
  professionalsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  professionalInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  professionalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  professionalDetails: {
    flex: 1,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
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
  verifiedBadge: {
    marginLeft: 8,
  },
  professionalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  professionalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  bookButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookButtonText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
});