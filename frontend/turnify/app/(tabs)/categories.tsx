import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

const CATEGORIES = [
  { id: 'health', name: 'Salud', icon: 'medical', color: '#FF6B6B', count: 0 },
  { id: 'beauty', name: 'Belleza', icon: 'cut', color: '#FFD93D', count: 0 },
  { id: 'fitness', name: 'Fitness', icon: 'fitness', color: '#6BCF7F', count: 0 },
  { id: 'education', name: 'Educación', icon: 'school', color: '#4ECDC4', count: 0 },
  { id: 'legal', name: 'Legal', icon: 'document-text', color: '#A8E6CF', count: 0 },
  { id: 'consulting', name: 'Consultoría', icon: 'business', color: '#FF8B94', count: 0 },
  { id: 'other', name: 'Otros', icon: 'ellipsis-horizontal', color: '#DDA0DD', count: 0 },
];

export default function Categories() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategoryCounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/professionals/`);
      
      if (response.ok) {
        const professionals = await response.json();
        
        // Contar profesionales por categoría
        const categoryCounts = CATEGORIES.map(category => {
          const count = professionals.filter((p: any) => p.category === category.id).length;
          return { ...category, count };
        });
        
        setCategories(categoryCounts);
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
    await fetchCategoryCounts();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: Category) => {
    (navigation as any).navigate('professionals', { selectedCategory: category.id });
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={32} color={item.color} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryCount}>
          {item.count} profesional{item.count !== 1 ? 'es' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Cargando categorías...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reservar Turno</Text>
        <Text style={styles.headerSubtitle}>
          Selecciona la categoría del servicio que necesitas
        </Text>
      </View>

      {/* Lista de categorías */}
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.categoriesList}
      />
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
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
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
  },
  categoriesList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  categoryCard: {
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
    borderRadius: 15,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
}); 