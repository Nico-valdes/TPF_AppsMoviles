import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BecomeProfessionalForm from '../../components/BecomeProfessionalForm';

export default function Perfil() {
  const { signOut } = useAuth();
  const [user, setUser] = useState<any>(null);

  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      try {
        const res = await fetch('http://127.0.0.1:8000/api/users/me/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.log('Error trayendo usuario:', error);
      }
    };
    fetchUser();
  }, []);

  const handleBecomeProfessional = async () => {
    if (!latitude || !longitude || !address) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/api/professional-details/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address: address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          professional: user.id, // se guarda el ID del usuario actual
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error creando ProfessionalDetail:', errorData);
        alert('Error al registrar como profesional');
        return;
      }

      alert('¡Ahora eres profesional!');
    } catch (error) {
      console.log('Error al enviar datos:', error);
      alert('Error de conexión');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user ? user.name : 'Cargando...'}</Text>
        <Text style={styles.email}>{user ? user.email : ''}</Text>
      </View>

      {/* Botón Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Ionicons name="log-out-outline" size={24} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      {/* Sección para volverse profesional */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {/* Aquí se renderiza el formulario */}
            <BecomeProfessionalForm 
              onClose={() => setModalVisible(false)} 
            />
            {/* Botón para cerrar el modal si es necesario */}
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    width: '80%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  name: { fontSize: 20, fontWeight: '700', color: '#06204F', marginBottom: 5 },
  email: { fontSize: 16, color: '#555' },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#D9534F',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  professionalSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  professionalText: { fontSize: 16, textAlign: 'center', color: '#06204F', marginBottom: 10 },
  becomeProButton: { backgroundColor: '#06204F', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  becomeProText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  form: { width: '100%', marginTop: 10 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#06204F',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    backgroundColor: '#2196F3',
  },
  buttonClose: {
    marginTop: 10,
    backgroundColor: '#DC3545', // Un color diferente para cerrar
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
