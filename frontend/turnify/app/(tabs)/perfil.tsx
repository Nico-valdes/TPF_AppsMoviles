import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Pressable, 
  TextInput, 
  ScrollView, 
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../../constants/Config';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lastName?: string;
  bio?: string;
  profileImage?: string;
}

export default function Perfil() {
  const { signOut, user: authUser } = useAuth();
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  // Estados para edición
  const [editName, setEditName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      // Construir la URL completa de la imagen si existe y no es una URL externa
      if (data.profileImage && !data.profileImage.startsWith('http')) {
        data.profileImage = `${API_BASE_URL}/media/${data.profileImage}`;
      }
      console.log('Profile image URL:', data.profileImage);
      
      setUser(data);
      setEditName(data.name || '');
      setEditLastName(data.lastName || '');
      setEditBio(data.bio || '');
      setEditProfileImage(data.profileImage || null);
      
      console.log('Usuario cargado:', data);
    } catch (error) {
      console.log('Error trayendo usuario:', error);
    }
  };

  const pickImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar una imagen.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      // Solicitar permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu cámara para tomar una foto.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Seleccionar imagen',
      '¿Cómo quieres agregar tu foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar foto', onPress: takePhoto },
        { text: 'Galería', onPress: pickImage },
      ]
    );
  };

  const saveProfile = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      // Crear FormData para enviar datos multipart
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('lastName', editLastName);
      formData.append('bio', editBio);

      // Si hay una imagen seleccionada, agregarla al FormData
      if (editProfileImage && !editProfileImage.startsWith('http')) {
        // Solo procesar si es una imagen nueva (no una URL del servidor)
        const filename = editProfileImage.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('profileImage', {
          uri: editProfileImage,
          type: type,
          name: filename,
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/api/users/me/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No incluir Content-Type, se establece automáticamente para FormData
        },
        body: formData,
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Construir la URL completa de la imagen si existe y no es una URL externa
        if (updatedUser.profileImage && !updatedUser.profileImage.startsWith('http')) {
          updatedUser.profileImage = `${API_BASE_URL}/media/${updatedUser.profileImage}`;
        }
        console.log('Updated profile image URL:', updatedUser.profileImage);
        
        setUser(updatedUser);
        setIsEditing(false);
        setEditModalVisible(false);
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        
        console.log('Usuario actualizado:', updatedUser);
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        Alert.alert('Error', 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.log('Error saving profile:', error);
      Alert.alert('Error', 'Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión? Esta acción te llevará a la pantalla de inicio de sesión.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar sesión', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Mostrar indicador de carga
              setIsLoading(true);
              
              // Limpiar estado local
              setUser(null);
              setEditModalVisible(false);
              setEditName('');
              setEditLastName('');
              setEditBio('');
              setEditProfileImage(null);
              
              // Llamar a la función de cerrar sesión del AuthProvider
              await signOut();
              
              // Mostrar mensaje de confirmación
              Alert.alert(
                'Sesión cerrada',
                'Has cerrado sesión exitosamente.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // La navegación se manejará automáticamente por el AuthProvider
                      console.log('Usuario ha cerrado sesión');
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert(
                'Error',
                'Hubo un problema al cerrar sesión. Por favor, intenta nuevamente.',
                [
                  {
                    text: 'OK',
                    style: 'default'
                  }
                ]
              );
            } finally {
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header con imagen de perfil */}
      <View style={styles.header}>
                 <View style={styles.profileImageContainer}>
           {user?.profileImage ? (
             <Image
               source={{ uri: user.profileImage }}
               style={styles.profileImage}
               onError={(error) => console.log('Error cargando imagen:', error)}
               onLoad={() => console.log('Imagen cargada exitosamente:', user.profileImage)}
             />
           ) : (
             <View style={styles.profileImage}>
               <Ionicons name="person" size={50} color={Colors.textInverse} />
             </View>
           )}
                     <TouchableOpacity 
             style={styles.editImageButton}
             onPress={() => setEditModalVisible(true)}
           >
             <Ionicons name="camera" size={16} color={Colors.textInverse} />
           </TouchableOpacity>
        </View>
        
        <Text style={styles.userName}>
          {user?.name} {user?.lastName}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.userRole}>
          {user?.role === 'professional' ? 'Profesional' : 'Cliente'}
        </Text>
      </View>

      {/* Bio Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle" size={20} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>Sobre mí</Text>
        </View>
        <Text style={styles.bioText}>
          {user?.bio || 'No has agregado una descripción sobre ti aún.'}
        </Text>
      </View>

             {/* Quick Actions Section */}
       <View style={styles.quickActionsContainer}>
         <TouchableOpacity 
           style={styles.quickActionCard}
           onPress={() => (navigation as any).navigate('my-appointments')}
         >
           <View style={styles.quickActionIcon}>
             <Ionicons name="calendar-outline" size={28} color={Colors.secondary} />
           </View>
           <View style={styles.quickActionContent}>
             <Text style={styles.quickActionTitle}>Mis Turnos</Text>
             <Text style={styles.quickActionSubtitle}>Ver mis reservas</Text>
           </View>
           <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
         </TouchableOpacity>
       </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Ionicons name="create" size={20} color={Colors.textPrimary} />
          <Text style={styles.actionButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Configuración', 'Próximamente disponible')}
        >
          <Ionicons name="settings" size={20} color={Colors.textPrimary} />
          <Text style={styles.actionButtonText}>Configuración</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Ayuda', 'Próximamente disponible')}
        >
          <Ionicons name="help-circle" size={20} color={Colors.textPrimary} />
          <Text style={styles.actionButtonText}>Ayuda</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]} 
        onPress={handleLogout}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.textInverse} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color={Colors.textInverse} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
                             <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                 <Ionicons name="close" size={24} color={Colors.textSecondary} />
               </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Profile Image */}
              <TouchableOpacity style={styles.imagePickerContainer} onPress={showImagePickerOptions}>
                                 {editProfileImage ? (
                   <Image
                     source={{ uri: editProfileImage }}
                     style={styles.editProfileImage}
                     onError={(error) => console.log('Error cargando imagen en modal:', error)}
                     onLoad={() => console.log('Imagen cargada en modal:', editProfileImage)}
                   />
                                   ) : (
                    <View style={styles.editProfileImage}>
                      <Ionicons name="person" size={60} color={Colors.secondary} />
                    </View>
                  )}
                                 <View style={styles.imagePickerOverlay}>
                   <Ionicons name="camera" size={24} color={Colors.textInverse} />
                   <Text style={styles.imagePickerText}>Cambiar foto</Text>
                 </View>
              </TouchableOpacity>

              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Tu nombre"
                />
              </View>

              {/* Last Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Apellido</Text>
                <TextInput
                  style={styles.input}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Tu apellido"
                />
              </View>

              {/* Bio Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Sobre mí</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Cuéntanos sobre ti..."
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.textInverse,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.secondary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.textInverse,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textInverse,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.textInverse,
    opacity: 0.8,
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.background,
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 10,
  },
  bioText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 5,
  },
  actionsContainer: {
    backgroundColor: Colors.background,
    margin: 20,
    borderRadius: 15,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  actionButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 15,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: Colors.error,
    margin: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: Colors.textInverse,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  editProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
  },
  imagePickerText: {
    color: Colors.textInverse,
    fontSize: 10,
    marginTop: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: Colors.backgroundSecondary,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
  },
     saveButtonText: {
     color: Colors.textInverse,
     fontSize: 16,
     fontWeight: '600',
   },
   quickActionsContainer: {
     margin: 20,
   },
   quickActionCard: {
     backgroundColor: Colors.background,
     padding: 20,
     borderRadius: 15,
     flexDirection: 'row',
     alignItems: 'center',
     shadowColor: Colors.shadow,
     shadowOpacity: 0.1,
     shadowRadius: 10,
     elevation: 5,
     borderWidth: 1,
     borderColor: Colors.borderLight,
   },
   quickActionIcon: {
     width: 50,
     height: 50,
     borderRadius: 25,
     backgroundColor: Colors.backgroundSecondary,
     alignItems: 'center',
     justifyContent: 'center',
     marginRight: 15,
   },
   quickActionContent: {
     flex: 1,
   },
   quickActionTitle: {
     fontSize: 18,
     fontWeight: '600',
     color: Colors.textPrimary,
     marginBottom: 4,
   },
   quickActionSubtitle: {
     fontSize: 14,
     color: Colors.textSecondary,
   },
 });