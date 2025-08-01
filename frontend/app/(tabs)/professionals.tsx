import React from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Professionals() {

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      
      <View style={styles.headerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profesionales</Text>
        </View>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar especialista"
            placeholderTextColor="#999"
          />
          <Ionicons name="search" size={20} color="#333" style={styles.searchIcon} />
        </View>
      </View>

      {/* Encuentra tu especialista */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Encuentra tu Especialista!</Text>
        <TouchableOpacity>
          <Ionicons name="add-circle-outline" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {[
          { name: 'Peluquero', icon: '💇‍♂️' },
          { name: 'Dentista', icon: '🦷' },
          { name: 'Restaurante', icon: '🍽️' },
          { name: 'Nutricionista', icon: '🥗' },
          { name: 'Profesor', icon: '👨‍🏫' },
          { name: 'Entrenador', icon: '🏋️‍♂️' },
        ].map((item, idx) => (
          <TouchableOpacity key={idx} style={styles.card}>
            <Text style={{ fontSize: 32 }}>{item.icon}</Text>
            <Text style={styles.cardText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mejores profesionales */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        Mejores Profesionales de tu zona
      </Text>

      <View style={styles.proCard}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
          style={styles.proAvatar}
        />
        <View>
          <Text style={styles.proName}>Coach Alfredo Martin</Text>
          <Text style={styles.proRole}>Entrenador personal</Text>
          <Text style={styles.proDistance}>📍 A 1km de ti</Text>
        </View>
      </View>

      <View style={styles.proCard}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?img=18' }}
          style={styles.proAvatar}
        />
        <View>
          <Text style={styles.proName}>Jonathan Patterson</Text>
          <Text style={styles.proRole}>Peluquero</Text>
          <Text style={styles.proDistance}>📍 A 8km de ti</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerContainer: { 
    backgroundColor: '#06204F',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', margin: 4},
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },

  searchContainer: { position: 'relative', marginBottom: 20 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingLeft: 40,
    paddingVertical: 10,
    fontSize: 14,
  },
  searchIcon: { position: 'absolute', top: 12, left: 12 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '30%',
    backgroundColor: '#fff',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 12,
  },
  cardText: { fontSize: 12, marginTop: 6, color: '#333', textAlign: 'center' },

  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  proAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  proName: { fontSize: 14, fontWeight: '700', color: '#333' },
  proRole: { fontSize: 12, color: '#666' },
  proDistance: { fontSize: 12, color: '#888', marginTop: 2 },
});
